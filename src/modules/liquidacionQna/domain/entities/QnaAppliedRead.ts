import type { QnaDomain, QnaEnvironment, QnaSourceState, QnaSourceType, QnaTotals } from './LiquidacionQna.js';

export type QnaAppliedScope = {
  entidadId: number;
  organica0: string;
  organica1: string;
  organica2: string;
  organica3: string;
};

export type QnaAppliedPeriod = { anio: number; quincena: number };
export type QnaAppliedWarning = { code: string; message: string; dominio?: QnaDomain };
export type QnaAppliedReconstructionStrategy = 'SNAPSHOT_V3_V4_PERSISTED_V2_FUNDS' | 'LEGACY_EXACT_FULL_SCOPE';
export type QnaAppliedTotalStrategy = 'PERSISTED' | 'PERSISTED_CAIR_CONTROL_FALLBACK' | 'DERIVED_DETAIL' | 'UNAVAILABLE';

export type QnaAppliedSource = {
  dominio: QnaDomain;
  tipoFuente: QnaSourceType;
  estado: QnaSourceState | 'ABSENT_UNVERIFIED';
  requerida: boolean;
  sourceScale: 2 | 6;
  registros: number;
  notApplicableAprobado: boolean;
  errorCode: string | null;
  identificadorFuente?: string;
  hashFuente?: string | null;
  aprobadoPor?: string | null;
  evidencia?: string | null;
};

type QnaAppliedMetadataBase = QnaAppliedScope & QnaAppliedPeriod & {
  periodo: string;
  fuente: 'SNAPSHOT_OFICIAL' | 'SNAPSHOT_OFICIAL_RECONSTRUIDO' | 'HISTORICO_LEGACY';
  estadoProceso: 'TERMINADO';
  reconstructionStrategy: QnaAppliedReconstructionStrategy | null;
};

export type QnaAppliedOfficialMetadata = QnaAppliedMetadataBase & {
  liquidacionSnapshotId: string;
  ambiente: QnaEnvironment;
  revision: number;
  snapshotCalculoV2Id: string;
  nominaCargaId: string;
  formulaCalculoVersionId: string;
  precisionPolicy: string;
  hashContenido: string;
  fechaAplicacion: string;
  fechaCreacion: string;
  fuente: 'SNAPSHOT_OFICIAL';
  reconstructionStrategy: null;
};

export type QnaAppliedReconstructedMetadata = QnaAppliedMetadataBase & {
  liquidacionSnapshotId: string;
  ambiente: QnaEnvironment;
  revision: number;
  snapshotCalculoV2Id: string | null;
  nominaCargaId: string | null;
  formulaCalculoVersionId: string | null;
  precisionPolicy: string;
  hashContenido: string;
  fechaAplicacion: string;
  fechaCreacion: string;
  fuente: 'SNAPSHOT_OFICIAL_RECONSTRUIDO';
  reconstructionStrategy: 'SNAPSHOT_V3_V4_PERSISTED_V2_FUNDS';
};

export type QnaAppliedLegacyMetadata = QnaAppliedMetadataBase & {
  liquidacionSnapshotId: null;
  ambiente: null;
  revision: null;
  snapshotCalculoV2Id: null;
  nominaCargaId: null;
  formulaCalculoVersionId: null;
  precisionPolicy: null;
  hashContenido: null;
  fechaAplicacion: string;
  fechaCreacion: string | null;
  fuente: 'HISTORICO_LEGACY';
  reconstructionStrategy: 'LEGACY_EXACT_FULL_SCOPE';
};

export type QnaAppliedMetadata = QnaAppliedOfficialMetadata | QnaAppliedReconstructedMetadata | QnaAppliedLegacyMetadata;

export type QnaAppliedListFilter = Partial<QnaAppliedScope & QnaAppliedPeriod> & {
  page: number;
  pageSize: number;
  buscar?: string;
  esAdmin: boolean;
};

export type QnaAppliedSelection = QnaAppliedPeriod & Partial<QnaAppliedScope> & { esAdmin: boolean };

export type QnaAppliedListItem = QnaAppliedMetadata & {
  fuentes: QnaAppliedSource[];
  advertencias: QnaAppliedWarning[];
};

export type QnaAppliedListResult = { items: QnaAppliedListItem[]; page: number; pageSize: number; total: number };
export type QnaAppliedNullableTotals = { [K in keyof QnaTotals]: K extends 'registros' ? number | null : string | null };
export type QnaAppliedTotalStrategies = { [K in Exclude<keyof QnaTotals, 'registros'>]: QnaAppliedTotalStrategy };
export type QnaAppliedSummary = QnaAppliedMetadata & { fuentes: QnaAppliedSource[]; totales: QnaTotals | QnaAppliedNullableTotals;
  totalStrategies: QnaAppliedTotalStrategies; advertencias: QnaAppliedWarning[] };

export type QnaAppliedDetailFilter = QnaAppliedSelection & {
  dominio: QnaDomain;
  page: number;
  pageSize: number;
  buscar?: string;
};

export type QnaAppliedDetailRow = Record<string, unknown> & {
  orden: number;
  empleadoClave: string | null;
  rfc: string | null;
  nombre: string | null;
  sourceScale: 2 | 6;
  importeOficialD6: string | null;
  payloadVersion: 1 | null;
  payloadCanonico: Record<string, unknown> | null;
  claveFilaHash?: string;
  hashFila?: string;
};

export type QnaAppliedDetailResult = QnaAppliedMetadata & {
  dominio: QnaDomain;
  totalDominioA2: string | null;
  totalStrategy: QnaAppliedTotalStrategy;
  detalles: QnaAppliedDetailRow[];
  page: number;
  pageSize: number;
  total: number;
  advertencias: QnaAppliedWarning[];
};
