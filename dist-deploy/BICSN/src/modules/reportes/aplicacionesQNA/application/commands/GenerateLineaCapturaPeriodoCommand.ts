import { LineaCapturaService } from '../../domain/services/LineaCapturaService.js';
import { LineaCapturaPeriodoRepository, LineaCapturaPeriodoRecord } from '../../infrastructure/persistence/LineaCapturaPeriodoRepository.js';
import { getMexicoTodayDateOnly } from '../../../../../utils/sqlServerDate.js';

export interface GenerateLineaCapturaPeriodoParams {
  org0: string;
  org1: string;
  periodo: string;
  usuarioId?: string;
  omitirValidacionEstado?: boolean;
  finalizarPendiente?: boolean;
}

export interface GenerateLineaCapturaPeriodoResult extends LineaCapturaPeriodoRecord {
  reutilizada: boolean;
}

export class GenerateLineaCapturaPeriodoCommand {
  constructor(
    private lineaCapturaPeriodoRepo: LineaCapturaPeriodoRepository,
    private lineaCapturaService: LineaCapturaService
  ) {}

  async execute(params: GenerateLineaCapturaPeriodoParams): Promise<GenerateLineaCapturaPeriodoResult> {
    const periodoInfo = parsePeriodo(params.periodo);
    const estado = params.omitirValidacionEstado
      ? null
      : await this.lineaCapturaPeriodoRepo.findEstadoPeriodo(params.org0, params.org1, params.periodo);
    if (!params.omitirValidacionEstado && !estado?.habilitaLineaPago) {
      throw new Error('APLICACION_QNA_NO_HABILITA_LINEA_PAGO');
    }
    const historico = await this.lineaCapturaPeriodoRepo.calcularImporteHistorico(params.org0, params.org1, params.periodo);
    if (historico.totalRegistros === 0 || historico.importe <= 0) {
      throw new Error('HISTORICO_APLICADO_NOT_FOUND');
    }

    const importe = historico.importe;
    const existing = await this.lineaCapturaPeriodoRepo.findVigente(params.org0, params.org1, params.periodo);

    if (existing) {
      const existingImporte = Math.round(Number(existing.importe) * 100) / 100;
      if (existingImporte !== importe) {
        const error = new Error('LINEA_CAPTURA_IMPORTE_MISMATCH') as Error & {
          details?: { importeLinea: number; importeHistorico: number };
        };
        error.details = { importeLinea: existingImporte, importeHistorico: importe };
        throw error;
      }
      if (params.finalizarPendiente && estado?.pendienteLineaPago) {
        await this.lineaCapturaPeriodoRepo.finalizarAfectacion(estado.afectacionId, params.usuarioId);
      }
      return { ...existing, reutilizada: true };
    }

    const today = getMexicoTodayDateOnly();
    const fechaPago = await this.lineaCapturaPeriodoRepo.findPrimerPagoDesde(today);

    if (!fechaPago) {
      throw new Error('PAGO_EVENT_NOT_FOUND');
    }

    const referencia4 = `${params.org0}${params.org1}`.toUpperCase();
    const lineaCaptura = this.lineaCapturaService.generarReferencia11({
      referencia4,
      periodo: params.periodo,
      quincena: periodoInfo.quincena,
      fechaLimite: fechaPago,
      importe
    });
    const fechaCondensada = this.lineaCapturaService.calcularFechaCondensada(fechaPago);
    const montoCondensado = this.lineaCapturaService.calcularMontoCondensado(importe);
    const digitoVerificador = lineaCaptura.substring(13, 15);

    try {
      const created = await this.lineaCapturaPeriodoRepo.create({
        org0: params.org0,
        org1: params.org1,
        periodo: params.periodo,
        quincena: periodoInfo.quincena,
        anio: periodoInfo.anio,
        importe,
        lineaCaptura,
        referencia4,
        fechaInicioPeriodo: periodoInfo.fechaInicioPeriodo,
        fechaFinalPeriodo: periodoInfo.fechaFinalPeriodo,
        fechaInicioVigencia: today,
        fechaFinVigencia: fechaPago,
        fechaReferenciaValidacion: fechaPago,
        tipoReferenciaValidacion: 'PAGO',
        fechaLimite: fechaPago,
        fechaCondensada,
        montoCondensado,
        digitoVerificador,
        usuarioId: params.usuarioId
      });

      if (params.finalizarPendiente && estado?.pendienteLineaPago) {
        await this.lineaCapturaPeriodoRepo.finalizarAfectacion(estado.afectacionId, params.usuarioId);
      }
      return { ...created, reutilizada: false };
    } catch (error: any) {
      const duplicate = await this.lineaCapturaPeriodoRepo.findVigente(params.org0, params.org1, params.periodo);
      if (duplicate) {
        const duplicateImporte = Math.round(Number(duplicate.importe) * 100) / 100;
        if (duplicateImporte !== importe) {
          const mismatch = new Error('LINEA_CAPTURA_IMPORTE_MISMATCH') as Error & {
            details?: { importeLinea: number; importeHistorico: number };
          };
          mismatch.details = { importeLinea: duplicateImporte, importeHistorico: importe };
          throw mismatch;
        }
        if (params.finalizarPendiente && estado?.pendienteLineaPago) {
          await this.lineaCapturaPeriodoRepo.finalizarAfectacion(estado.afectacionId, params.usuarioId);
        }
        return { ...duplicate, reutilizada: true };
      }
      throw error;
    }
  }
}

function parsePeriodo(periodo: string): { quincena: number; anio: number; fechaInicioPeriodo: string; fechaFinalPeriodo: string } {
  if (!/^\d{4}$/.test(periodo)) throw new Error('PERIODO_INVALIDO');
  const quincena = Number(periodo.slice(0, 2));
  if (quincena < 1 || quincena > 24) throw new Error('PERIODO_INVALIDO');

  const anio = 2000 + Number(periodo.slice(2, 4));
  const monthIndex = Math.ceil(quincena / 2) - 1;
  const isFirstHalf = quincena % 2 === 1;
  const startDay = isFirstHalf ? 1 : 16;
  const endDay = isFirstHalf ? 15 : new Date(anio, monthIndex + 1, 0).getDate();

  return {
    quincena,
    anio,
    fechaInicioPeriodo: formatDate(anio, monthIndex + 1, startDay),
    fechaFinalPeriodo: formatDate(anio, monthIndex + 1, endDay)
  };
}

function formatDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
