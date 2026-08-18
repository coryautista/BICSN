export const MOVIMIENTO_TIPO = {
  ALTA: 1,
  BAJA_PERMANENTE: 2,
  SUSPENSION: 3,
  TERMINA_SUSPENSION: 4,
  CAMBIO_SUELDO: 5,
  TERMINA_SUSPENSION_Y_BAJA: 6
} as const;

export function parsePeriodoMovimiento(periodo: string): { quincena: number; anio: number } {
  if (!/^\d{4}$/.test(periodo)) throw new Error('MOVIMIENTO_PERIODO_INVALIDO');
  const quincena = Number(periodo.slice(0, 2));
  const anio = 2000 + Number(periodo.slice(2, 4));
  if (quincena < 1 || quincena > 24) throw new Error('MOVIMIENTO_PERIODO_INVALIDO');
  return { quincena, anio };
}

const TIPOS_BAJA = new Set<number>([
  MOVIMIENTO_TIPO.BAJA_PERMANENTE,
  MOVIMIENTO_TIPO.TERMINA_SUSPENSION_Y_BAJA
]);

export function obtenerRangoQuincena(anio: number, quincena: number): { inicio: Date; fin: Date } {
  if (!Number.isInteger(anio) || !Number.isInteger(quincena) || quincena < 1 || quincena > 24) {
    throw new Error('MOVIMIENTO_FECHA_PERIODO_INVALIDO');
  }
  const mes = Math.ceil(quincena / 2) - 1;
  const inicio = new Date(Date.UTC(anio, mes, quincena % 2 === 1 ? 1 : 16));
  const fin = quincena % 2 === 1
    ? new Date(Date.UTC(anio, mes, 15))
    : new Date(Date.UTC(anio, mes + 1, 0));
  return { inicio, fin };
}

export function validarFechaMovimientoPeriodo(
  tipoMovimientoId: number,
  fechaMovimiento: string | null | undefined,
  anio: number,
  quincena: number
): void {
  if (!fechaMovimiento) throw new Error('MOVIMIENTO_FECHA_REQUERIDA');
  const fecha = new Date(`${fechaMovimiento}T00:00:00.000Z`);
  if (Number.isNaN(fecha.getTime())) throw new Error('MOVIMIENTO_FECHA_INVALIDA');
  const { inicio, fin } = obtenerRangoQuincena(anio, quincena);

  if (TIPOS_BAJA.has(tipoMovimientoId)) {
    if (fecha > fin) throw new Error('MOVIMIENTO_FECHA_BAJA_POSTERIOR_QUINCENA');
    return;
  }
  if (fecha < inicio || fecha > fin) throw new Error('MOVIMIENTO_FECHA_FUERA_QUINCENA');
}

export function calcularDiasLaboradosMovimiento(
  tipoMovimientoId: number,
  fechaMovimiento: string,
  anio: number,
  quincena: number
): number | null {
  if (tipoMovimientoId !== MOVIMIENTO_TIPO.ALTA && !TIPOS_BAJA.has(tipoMovimientoId)) return null;
  validarFechaMovimientoPeriodo(tipoMovimientoId, fechaMovimiento, anio, quincena);
  const fecha = new Date(`${fechaMovimiento}T00:00:00.000Z`);
  const { inicio, fin } = obtenerRangoQuincena(anio, quincena);
  const oneDayMs = 24 * 60 * 60 * 1000;
  const rawDias = tipoMovimientoId === MOVIMIENTO_TIPO.ALTA
    ? Math.floor((fin.getTime() - fecha.getTime()) / oneDayMs) + 1
    : Math.floor((fecha.getTime() - inicio.getTime()) / oneDayMs) + 1;
  return Math.min(15, Math.max(0, rawDias));
}

export function resolverFechaEfectivaMovimiento(movimiento: {
  fechaMovimiento?: string | null;
  fecha?: string | null;
  createdAt?: string | null;
}): { valor: string | null; fuente: 'fechaMovimiento' | 'fecha' | 'createdAt' | 'sin_fecha' } {
  if (movimiento.fechaMovimiento) return { valor: movimiento.fechaMovimiento, fuente: 'fechaMovimiento' };
  if (movimiento.fecha) return { valor: movimiento.fecha, fuente: 'fecha' };
  if (movimiento.createdAt) return { valor: movimiento.createdAt, fuente: 'createdAt' };
  return { valor: null, fuente: 'sin_fecha' };
}
