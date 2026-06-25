import { LineaCapturaService } from '../../domain/services/LineaCapturaService.js';
import { LineaCapturaPeriodoRepository, LineaCapturaPeriodoRecord } from '../../infrastructure/persistence/LineaCapturaPeriodoRepository.js';
import { getMexicoTodayDateOnly } from '../../../../../utils/sqlServerDate.js';

export interface GenerateLineaCapturaPeriodoParams {
  org0: string;
  org1: string;
  periodo: string;
  importe: number;
  usuarioId?: string;
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
    const existing = await this.lineaCapturaPeriodoRepo.findVigente(params.org0, params.org1, params.periodo);

    if (existing) {
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
      fechaLimite: fechaPago,
      importe: params.importe
    });
    const fechaCondensada = this.lineaCapturaService.calcularFechaCondensada(fechaPago);
    const montoCondensado = this.lineaCapturaService.calcularMontoCondensado(params.importe);
    const digitoVerificador = lineaCaptura.substring(13, 15);

    try {
      const created = await this.lineaCapturaPeriodoRepo.create({
        org0: params.org0,
        org1: params.org1,
        periodo: params.periodo,
        quincena: periodoInfo.quincena,
        anio: periodoInfo.anio,
        importe: params.importe,
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

      return { ...created, reutilizada: false };
    } catch (error: any) {
      const duplicate = await this.lineaCapturaPeriodoRepo.findVigente(params.org0, params.org1, params.periodo);
      if (duplicate) return { ...duplicate, reutilizada: true };
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
