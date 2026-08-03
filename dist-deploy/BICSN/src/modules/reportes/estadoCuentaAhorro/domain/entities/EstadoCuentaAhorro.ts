export const FONDOS_ESTADO_CUENTA = ['CAIR', 'FRA', 'FRE', 'FH', 'FV', 'FAA', 'FAE', 'FAT', 'FAI'] as const;

export type FondoEstadoCuenta = typeof FONDOS_ESTADO_CUENTA[number];
export type ImportesEstadoCuenta = Record<FondoEstadoCuenta, number> & { total: number };
export type TipoMovimientoEstadoCuenta = 'ENTRADA' | 'SALIDA' | 'AJUSTE' | 'INFORMATIVO';

export interface ParametrosEstadoCuentaAhorro {
  quincena: number;
  anio: number;
  org0: string;
  org1: string;
  org2: string;
  org3: string;
}

export interface ConceptoEstadoCuentaAhorro {
  orden: number;
  clave: string;
  concepto: string;
  tipoMovimiento: TipoMovimientoEstadoCuenta;
  signo: -1 | 0 | 1;
  importes: ImportesEstadoCuenta;
  procedimientoOrigen?: string;
  campoOrigen?: string;
  tieneAdvertencia: boolean;
}

export interface DetalleEstadoCuentaAhorro {
  conceptoClave: string;
  procedimientoOrigen: string;
  campoOrigen?: string;
  registroOrigenClave?: string;
  registroOrigen: Record<string, unknown>;
  fondo?: FondoEstadoCuenta;
  importe?: number;
  signo: -1 | 0 | 1;
  tipoMovimiento: TipoMovimientoEstadoCuenta;
}

export interface IncidenciaEstadoCuentaAhorro {
  severidad: 'INFO' | 'ADVERTENCIA' | 'ERROR';
  codigo: string;
  mensaje: string;
  procedimientoOrigen?: string;
  parametros?: Record<string, unknown>;
}

export interface EstadoCuentaAhorro {
  idHistorico: number;
  version: number;
  estatus: 'GENERADO' | 'INCOMPLETO' | 'ERROR';
  estadoConciliacion: 'CONCILIADO' | 'CON_DIFERENCIA' | 'NO_VERIFICABLE';
  periodo: string;
  fechaCorte: string;
  parametros: ParametrosEstadoCuentaAhorro;
  conceptos: ConceptoEstadoCuentaAhorro[];
  saldoCalculado: ImportesEstadoCuenta;
  saldoReportado: ImportesEstadoCuenta | null;
  diferencia: ImportesEstadoCuenta | null;
  incidencias: IncidenciaEstadoCuentaAhorro[];
}

export const crearImportesCero = (): ImportesEstadoCuenta => ({
  CAIR: 0,
  FRA: 0,
  FRE: 0,
  FH: 0,
  FV: 0,
  FAA: 0,
  FAE: 0,
  FAT: 0,
  FAI: 0,
  total: 0
});

export const recalcularTotal = (importes: Omit<ImportesEstadoCuenta, 'total'>): ImportesEstadoCuenta => ({
  ...importes,
  total: FONDOS_ESTADO_CUENTA.reduce((total, fondo) => total + importes[fondo], 0)
});
