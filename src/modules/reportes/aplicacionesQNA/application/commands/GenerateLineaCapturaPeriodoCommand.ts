import { LineaCapturaService } from '../../domain/services/LineaCapturaService.js';
import { LineaCapturaPeriodoRepository, LineaCapturaPeriodoRecord } from '../../infrastructure/persistence/LineaCapturaPeriodoRepository.js';
import { getMexicoTodayDateOnly } from '../../../../../utils/sqlServerDate.js';
import { RevisionScheduler } from '../../../revision/application/RevisionScheduler.js';
import type { ILiquidacionQnaRepository } from '../../../../liquidacionQna/domain/repositories/ILiquidacionQnaRepository.js';

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

export interface GenerateLineaCapturaPeriodoFromSnapshotParams extends GenerateLineaCapturaPeriodoParams {
  liquidacionSnapshotId: string;
}

export class GenerateLineaCapturaPeriodoCommand {
  constructor(
    private lineaCapturaPeriodoRepo: LineaCapturaPeriodoRepository,
    private lineaCapturaService: LineaCapturaService,
    private revisionScheduler: RevisionScheduler,
    private liquidacionQnaRepo: ILiquidacionQnaRepository
  ) {}

  async executeFromSnapshot(params: GenerateLineaCapturaPeriodoFromSnapshotParams): Promise<GenerateLineaCapturaPeriodoResult> {
    const periodoInfo = parsePeriodo(params.periodo);
    const estado = params.omitirValidacionEstado
      ? null
      : await this.lineaCapturaPeriodoRepo.findEstadoPeriodo(params.org0, params.org1, params.periodo);
    if (!params.omitirValidacionEstado && !estado?.habilitaLineaPago) {
      throw new Error('APLICACION_QNA_NO_HABILITA_LINEA_PAGO');
    }

    const snapshot = await this.liquidacionQnaRepo.resolveOfficialById(params.liquidacionSnapshotId);
    if (!snapshot) throw new Error('QNA_SNAPSHOT_NOT_OFFICIAL_COMPLETE');
    if (snapshot.periodo !== params.periodo
      || snapshot.organica0.trim() !== params.org0.trim()
      || snapshot.organica1.trim() !== params.org1.trim()) {
      throw new Error('QNA_SNAPSHOT_SCOPE_MISMATCH');
    }

    const importeA2 = snapshot.totales.totalGeneralA2;
    if (!/^\d+\.\d{2}$/.test(importeA2) || BigInt(importeA2.replace('.', '')) <= 0n) {
      throw new Error('QNA_SNAPSHOT_TOTAL_INVALID');
    }

    const existing = await this.lineaCapturaPeriodoRepo.findVigenteBySnapshotId(params.liquidacionSnapshotId);
    if (existing) {
      this.assertSnapshotLine(existing, params, importeA2);
      await this.finalizarYProgramar(params, estado);
      return { ...existing, reutilizada: true };
    }

    const periodLine = await this.lineaCapturaPeriodoRepo.findVigente(params.org0, params.org1, params.periodo);
    if (periodLine) this.throwPeriodConflict(periodLine, params.liquidacionSnapshotId, importeA2);

    const today = getMexicoTodayDateOnly();
    const fechaPago = await this.lineaCapturaPeriodoRepo.findPrimerPagoDesde(today);
    if (!fechaPago) throw new Error('PAGO_EVENT_NOT_FOUND');

    const referencia4 = `${params.org0}${params.org1}`.toUpperCase();
    const lineaCaptura = this.lineaCapturaService.generarReferencia11({
      referencia4,
      periodo: params.periodo,
      quincena: periodoInfo.quincena,
      fechaLimite: fechaPago,
      importe: importeA2
    });
    const fechaCondensada = this.lineaCapturaService.calcularFechaCondensada(fechaPago);
    const montoCondensado = this.lineaCapturaService.calcularMontoCondensado(importeA2);

    try {
      const created = await this.lineaCapturaPeriodoRepo.create({
        org0: params.org0,
        org1: params.org1,
        periodo: params.periodo,
        quincena: periodoInfo.quincena,
        anio: periodoInfo.anio,
        importeA2,
        liquidacionSnapshotId: params.liquidacionSnapshotId,
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
        digitoVerificador: lineaCaptura.substring(13, 15),
        usuarioId: params.usuarioId
      });
      await this.finalizarYProgramar(params, estado);
      return { ...created, reutilizada: false };
    } catch (error) {
      const duplicate = await this.lineaCapturaPeriodoRepo.findVigenteBySnapshotId(params.liquidacionSnapshotId);
      if (duplicate) {
        this.assertSnapshotLine(duplicate, params, importeA2);
        await this.finalizarYProgramar(params, estado);
        return { ...duplicate, reutilizada: true };
      }
      const conflicting = await this.lineaCapturaPeriodoRepo.findVigente(params.org0, params.org1, params.periodo);
      if (conflicting) this.throwPeriodConflict(conflicting, params.liquidacionSnapshotId, importeA2);
      throw error;
    }
  }

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
    const importeA2 = importe.toFixed(2);
    const existing = await this.lineaCapturaPeriodoRepo.findVigente(params.org0, params.org1, params.periodo);

    if (existing) {
      const existingImporte = existing.importeA2;
      if (existingImporte !== importeA2) {
        const error = new Error('LINEA_CAPTURA_IMPORTE_MISMATCH') as Error & {
          details?: { importeLinea: number; importeHistorico: number };
        };
        error.details = { importeLinea: Number(existingImporte), importeHistorico: importe };
        throw error;
      }
      if (params.finalizarPendiente && estado?.pendienteLineaPago) {
        await this.lineaCapturaPeriodoRepo.finalizarAfectacion(estado.afectacionId, params.usuarioId);
      }
      await this.programarRevision(params);
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
      importe: importeA2
    });
    const fechaCondensada = this.lineaCapturaService.calcularFechaCondensada(fechaPago);
    const montoCondensado = this.lineaCapturaService.calcularMontoCondensado(importeA2);
    const digitoVerificador = lineaCaptura.substring(13, 15);

    try {
      const created = await this.lineaCapturaPeriodoRepo.create({
        org0: params.org0,
        org1: params.org1,
        periodo: params.periodo,
        quincena: periodoInfo.quincena,
        anio: periodoInfo.anio,
        importeA2,
        liquidacionSnapshotId: null,
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
      await this.programarRevision(params);
      return { ...created, reutilizada: false };
    } catch (error: any) {
      const duplicate = await this.lineaCapturaPeriodoRepo.findVigente(params.org0, params.org1, params.periodo);
      if (duplicate) {
        const duplicateImporte = duplicate.importeA2;
        if (duplicateImporte !== importeA2) {
          const mismatch = new Error('LINEA_CAPTURA_IMPORTE_MISMATCH') as Error & {
            details?: { importeLinea: number; importeHistorico: number };
          };
          mismatch.details = { importeLinea: Number(duplicateImporte), importeHistorico: importe };
          throw mismatch;
        }
        if (params.finalizarPendiente && estado?.pendienteLineaPago) {
          await this.lineaCapturaPeriodoRepo.finalizarAfectacion(estado.afectacionId, params.usuarioId);
        }
        await this.programarRevision(params);
        return { ...duplicate, reutilizada: true };
      }
      throw error;
    }
  }

  private async programarRevision(params: GenerateLineaCapturaPeriodoParams | GenerateLineaCapturaPeriodoFromSnapshotParams): Promise<void> {
    await this.revisionScheduler.programar({
      org0: params.org0,
      org1: params.org1,
      periodo: params.periodo,
      usuarioId: params.usuarioId,
      liquidacionSnapshotId: 'liquidacionSnapshotId' in params ? params.liquidacionSnapshotId : undefined
    });
  }

  private assertSnapshotLine(record: LineaCapturaPeriodoRecord, params: GenerateLineaCapturaPeriodoFromSnapshotParams, importeA2: string): void {
    if (record.estatus !== 'VIGENTE') throw new Error('LINEA_CAPTURA_SNAPSHOT_NO_VIGENTE');
    if (record.org0 !== params.org0 || record.org1 !== params.org1 || record.periodo !== params.periodo) {
      throw new Error('QNA_SNAPSHOT_SCOPE_MISMATCH');
    }
    if (record.importeA2 !== importeA2) this.throwAmountMismatch(record.importeA2, importeA2);
  }

  private throwPeriodConflict(record: LineaCapturaPeriodoRecord, liquidacionSnapshotId: string, importeA2: string): never {
    if (record.importeA2 !== importeA2) this.throwAmountMismatch(record.importeA2, importeA2);
    const error = new Error('LINEA_CAPTURA_SNAPSHOT_CONFLICT') as Error & { details?: Record<string, string | null> };
    error.details = { liquidacionSnapshotId, liquidacionSnapshotIdLinea: record.liquidacionSnapshotId };
    throw error;
  }

  private throwAmountMismatch(importeLineaA2: string, importeSnapshotA2: string): never {
    const error = new Error('LINEA_CAPTURA_IMPORTE_MISMATCH') as Error & {
      details?: { importeLineaA2: string; importeSnapshotA2: string };
    };
    error.details = { importeLineaA2, importeSnapshotA2 };
    throw error;
  }

  private async finalizarYProgramar(params: GenerateLineaCapturaPeriodoParams | GenerateLineaCapturaPeriodoFromSnapshotParams, estado: { afectacionId: number; pendienteLineaPago: boolean } | null): Promise<void> {
    if (params.finalizarPendiente && estado?.pendienteLineaPago) {
      await this.lineaCapturaPeriodoRepo.finalizarAfectacion(estado.afectacionId, params.usuarioId);
    }
    await this.programarRevision(params);
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
