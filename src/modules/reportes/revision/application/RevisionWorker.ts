import pino from 'pino';
import {
  crearImportesRevision,
  ImportesRevisionPersistencia,
  ResultadoConceptoRevision,
  RevisionSnapshotMetadata,
  RevisionTarea
} from '../domain/Revision.types.js';
import { RevisionRepository } from '../infrastructure/persistence/RevisionRepository.js';
import { guardarRevisionLogFtp, guardarRevisionLogFtpOpcional } from '../infrastructure/services/RevisionLogFtpService.js';

const logger = pino({ name: 'revisionWorker', level: process.env.LOG_LEVEL || 'info' });

interface DefinicionConcepto {
  numeroConcepto: number;
  fuente: string;
  calcular: () => Promise<{
    importes: ImportesRevisionPersistencia;
    registros: number;
    liquidacionSnapshot?: RevisionSnapshotMetadata;
  }>;
  aplica?: () => boolean;
}

export class RevisionWorker {
  private timer: NodeJS.Timeout | null = null;
  private detenido = true;
  private ejecucion: Promise<void> | null = null;

  constructor(private revisionRepo: RevisionRepository) {}

  async start(): Promise<void> {
    if (!this.detenido) return;
    this.detenido = false;
    await this.revisionRepo.recuperarInterrumpidas();
    this.programarSiguiente(500);
    logger.info('Worker REVISA iniciado');
  }

  async stop(): Promise<void> {
    this.detenido = true;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    await this.ejecucion;
    logger.info('Worker REVISA detenido');
  }

  private programarSiguiente(delayMs: number): void {
    if (this.detenido) return;
    this.timer = setTimeout(() => {
      this.ejecucion = this.ciclo().finally(() => {
        this.ejecucion = null;
      });
    }, delayMs);
    this.timer.unref();
  }

  private async ciclo(): Promise<void> {
    let encontroTarea = false;
    try {
      const tarea = await this.revisionRepo.reclamarSiguiente();
      encontroTarea = Boolean(tarea);
      if (tarea) await this.procesar(tarea);
    } catch (error) {
      logger.error({ error }, 'Error en ciclo del worker REVISA');
    } finally {
      this.programarSiguiente(encontroTarea ? 500 : 5000);
    }
  }

  private async procesar(tarea: RevisionTarea): Promise<void> {
    const inicio = Date.now();
    const inicioUtc = new Date().toISOString();
    const conceptos: ResultadoConceptoRevision[] = [];
    try {
      const catalogoActivo = await this.revisionRepo.obtenerConceptosActivos();
      const activos = new Map(catalogoActivo.map((item) => [item.numeroConcepto, item.concepto]));
      const definicionesDisponibles: DefinicionConcepto[] = [
        {
          numeroConcepto: 1,
          fuente: 'conciliacion.Revision (concepto 12 activo del período anterior)',
          calcular: () => this.revisionRepo.calcularSaldoAnterior(tarea)
        },
        {
          numeroConcepto: 2,
          fuente: tarea.liquidacionSnapshotId
            ? 'liquidacion.QnaSnapshotTotal (snapshot oficial COMPLETE; importes A2)'
            : 'LEGACY_PRE_MIGRACION: conciliacion.RevisionAplicacionHistorico',
          calcular: () => tarea.liquidacionSnapshotId
            ? this.revisionRepo.calcularAplicacionQuincenalSnapshot(tarea)
            : this.revisionRepo.calcularAplicacionQuincenal(tarea)
        },
        {
          numeroConcepto: 3,
          fuente: "AP_G_FONDOS_ALTBAJ (CVE_MOVIMIENTO = 'AL')",
          calcular: () => this.revisionRepo.calcularAltasBajas(tarea, 'AL')
        },
        {
          numeroConcepto: 4,
          fuente: "AP_G_FONDOS_ALTBAJ (CVE_MOVIMIENTO = 'BA')",
          calcular: () => this.revisionRepo.calcularAltasBajas(tarea, 'BA')
        },
        {
          numeroConcepto: 5,
          fuente: "AP_G_FONDOS_ALTBAJ (CVE_MOVIMIENTO = 'LB')",
          calcular: () => this.revisionRepo.calcularAltasBajas(tarea, 'LB')
        },
        {
          numeroConcepto: 6,
          fuente: "AP_G_FONDOS_REINGRESO_ORD (TIPO_T_R_B = 'TRASPASO', orgánica HORG)",
          calcular: () => this.revisionRepo.calcularTraspasos(tarea)
        },
        {
          numeroConcepto: 7,
          fuente: "FONDOS_INICIALES_IND (TIPO_FONDO = 'AED'; FAT = FAA + FAE)",
          calcular: () => this.revisionRepo.calcularAportacionExtemporanea(tarea)
        },
        {
          numeroConcepto: 8,
          fuente: "RENDIMIENTOS_ANUALES (TIPO_MOVIMIENTO = 'B', STATUS_ORG_PERS = 'A')",
          calcular: () => this.revisionRepo.calcularRendimientoAnual(tarea, 'B', 'A'),
          aplica: () => tarea.periodo.startsWith('01')
        },
        {
          numeroConcepto: 9,
          fuente: "RENDIMIENTOS_ANUALES (TIPO_MOVIMIENTO = 'B', STATUS_ORG_PERS = 'L')",
          calcular: () => this.revisionRepo.calcularRendimientoAnual(tarea, 'B', 'L')
        },
        {
          numeroConcepto: 10,
          fuente: "RENDIMIENTOS_ANUALES (TIPO_MOVIMIENTO = 'E', STATUS_ORG_PERS = 'L')",
          calcular: () => this.revisionRepo.calcularRendimientoAnual(tarea, 'E', 'L')
        },
        {
          numeroConcepto: 11,
          fuente: "RENDIMIENTOS_ANUALES (TIPO_MOVIMIENTO = 'E', STATUS_ORG_PERS = 'A')",
          calcular: () => this.revisionRepo.calcularRendimientoAnual(tarea, 'E', 'A'),
          aplica: () => tarea.periodo.startsWith('01')
        },
        {
          numeroConcepto: 12,
          fuente: 'AP_G_SALDO_FONDO',
          calcular: () => this.revisionRepo.calcularSaldoActual(tarea)
        },
        {
          numeroConcepto: 13,
          fuente: "FONDOS_INICIALES_IND (TIPO_FONDO = 'LFA'; FAT = FAA + FAE; FAI = FAR funcional)",
          calcular: () => this.revisionRepo.calcularLiberacionPcp(tarea, 'LFA')
        },
        {
          numeroConcepto: 15,
          fuente: "FONDOS_INICIALES_IND (TIPO_FONDO = 'LFM'; FAT = FAA + FAE; FAI = FAR funcional)",
          calcular: () => this.revisionRepo.calcularLiberacionPcp(tarea, 'LFM')
        },
        {
          numeroConcepto: 16,
          fuente: "FONDOS_INICIALES_IND (TIPO_FONDO = 'LFP'; FAT = FAA + FAE; FAI = FAR funcional)",
          calcular: () => this.revisionRepo.calcularLiberacionPcp(tarea, 'LFP')
        }
      ];
      // El concepto 14 se captura administrativamente y no participa en el cálculo automático.
      const conceptosDisponibles = new Set([
        ...definicionesDisponibles.map((definicion) => definicion.numeroConcepto),
        14
      ]);
      const activosSinImplementacion = [...activos.keys()].filter((numero) => !conceptosDisponibles.has(numero));
      if (activosSinImplementacion.length > 0) {
        throw new Error(`CONCEPTO_ACTIVO_SIN_IMPLEMENTACION: ${activosSinImplementacion.join(',')}`);
      }
      const definiciones = definicionesDisponibles.filter((definicion) => activos.has(definicion.numeroConcepto));

      const calculados = [];
      for (const definicion of definiciones) {
        const inicioConcepto = Date.now();
        const aplica = definicion.aplica?.() ?? true;
        const calculo = aplica
          ? await definicion.calcular()
          : { importes: crearImportesRevision(), registros: 0 };
        calculados.push({
          ...definicion,
          concepto: activos.get(definicion.numeroConcepto)!,
          fuente: aplica ? definicion.fuente : 'NO_APLICA: concepto anual exclusivo del periodo 01',
          ...calculo,
          duracionMs: Date.now() - inicioConcepto
        });
      }

      const guardados = await this.revisionRepo.guardarRevisiones(calculados.map((calculo) => ({
        tarea,
        numeroConcepto: calculo.numeroConcepto,
        importes: calculo.importes
      })));
      for (let index = 0; index < calculados.length; index += 1) {
        const calculo = calculados[index];
        const guardado = guardados[index];
        conceptos.push({
          numeroConcepto: calculo.numeroConcepto,
          concepto: calculo.concepto,
          fuente: calculo.fuente,
          registrosOrigen: calculo.registros,
          importes: calculo.importes,
          importesAnteriores: guardado.importesAnteriores,
          operacion: guardado.operacion,
          idRevision: guardado.idRevision,
          idRevisionHistorico: guardado.idRevisionHistorico,
          duracionMs: calculo.duracionMs,
          liquidacionSnapshot: calculo.liquidacionSnapshot
        });
      }

      const entrega = await guardarRevisionLogFtpOpcional(tarea, conceptos, inicioUtc, Date.now() - inicio);
      await this.revisionRepo.completarTarea(
        tarea.idRevisionTarea,
        entrega.ruta,
        tarea.claimToken,
        entrega.advertencia
      );
      if (entrega.advertencia) {
        logger.warn({
          idRevisionTarea: tarea.idRevisionTarea,
          advertencia: entrega.advertencia
        }, 'Tarea REVISA completada sin entrega FTP opcional');
      } else {
        logger.info({
          idRevisionTarea: tarea.idRevisionTarea,
          ruta: entrega.ruta,
          liquidacionSnapshot: conceptos.find((concepto) => concepto.numeroConcepto === 2)?.liquidacionSnapshot
        }, 'Tarea REVISA completada');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      let rutaError: string | undefined;
      try {
        rutaError = await guardarRevisionLogFtp(
          tarea,
          conceptos,
          inicioUtc,
          Date.now() - inicio,
          'ERROR',
          message
        );
      } catch (ftpError) {
        logger.error({ ftpError, idRevisionTarea: tarea.idRevisionTarea }, 'No se pudo guardar el reporte de error REVISA en SFTP');
      }
      await this.revisionRepo.fallarTarea(tarea, message, rutaError);
      logger.error({
        idRevisionTarea: tarea.idRevisionTarea,
        intento: tarea.intentos,
        liquidacionSnapshotId: tarea.liquidacionSnapshotId,
        error: message
      }, 'Tarea REVISA fallida');
    }
  }
}
