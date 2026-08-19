export const FONDOS_REVISION = [
  'CAIR', 'FRA', 'FRE', 'PRESTACIONES', 'FH', 'FV', 'VIVIENDA', 'FAA', 'FAE', 'FAT', 'FAI'
] as const;

export type FondoRevision = (typeof FONDOS_REVISION)[number];
export type ImportesRevision = Record<FondoRevision, number>;
export type ImportesRevisionSnapshot = Record<FondoRevision, string>;
export type ImportesRevisionPersistencia = ImportesRevision | ImportesRevisionSnapshot;
export type EstatusProcesoRevision = 'PENDIENTE' | 'PROCESANDO' | 'COMPLETADA' | 'ERROR';
export type TipoFondoLiberacionPcp = 'LFA' | 'LFM' | 'LFP';

export interface CatalogoRevisionActivo {
  numeroConcepto: number;
  concepto: string;
}

export interface ParametrosReporteRevision {
  org0: string;
  org1: string;
  org2: string;
  org3: string;
  periodo: string;
}

export interface GuardarAjusteRevisionData extends ParametrosReporteRevision {
  importes: ImportesRevision;
  usuarioId: string;
}

export interface GuardarAjusteRevisionResultado {
  operacion: 'INSERT' | 'UPDATE' | 'SIN_CAMBIOS';
  idRevision: number;
  idRevisionHistorico?: number;
}

export interface ConceptoReporteRevision {
  idRevision: number;
  numeroConcepto: number;
  concepto: string;
  cair: number;
  fra: number;
  fre: number;
  prestaciones: number;
  fh: number;
  fv: number;
  vivienda: number;
  faa: number;
  fae: number;
  fat: number;
  fai: number;
  estatus: string;
}

export interface ReporteRevision {
  organica: {
    org0: string;
    org1: string;
    org2: string;
    org3: string;
    clave: string;
  };
  periodo: string;
  quincena: number;
  anio: number;
  estatusProceso: EstatusProcesoRevision;
  intentos: number;
  fechaActualizacion?: string;
  conceptos: ConceptoReporteRevision[];
}

export interface RevisionTarea {
  idRevisionTarea: number;
  org0: string;
  org1: string;
  org2: string;
  org3: string;
  periodo: string;
  usuarioId: string;
  intentos: number;
  claimToken: string;
  liquidacionSnapshotId: string | null;
}

export interface RevisionSnapshotMetadata {
  liquidacionSnapshotId: string;
  hashContenido: string;
  revision: number;
  precisionPolicy: string;
}

export interface ResultadoConceptoRevision {
  numeroConcepto: number;
  concepto: string;
  fuente: string;
  registrosOrigen: number;
  importes: ImportesRevisionPersistencia;
  importesAnteriores?: ImportesRevision;
  operacion: 'INSERT' | 'UPDATE' | 'SIN_CAMBIOS';
  idRevision: number;
  idRevisionHistorico?: number;
  duracionMs: number;
  liquidacionSnapshot?: RevisionSnapshotMetadata;
}

export function crearImportesRevision(): ImportesRevision {
  return {
    CAIR: 0,
    FRA: 0,
    FRE: 0,
    PRESTACIONES: 0,
    FH: 0,
    FV: 0,
    VIVIENDA: 0,
    FAA: 0,
    FAE: 0,
    FAT: 0,
    FAI: 0
  };
}
