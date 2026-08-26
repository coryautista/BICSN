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

export type QnaAppliedSource = {
  dominio: QnaDomain;
  tipoFuente: QnaSourceType;
  estado: QnaSourceState;
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

export type QnaAppliedMetadata = QnaAppliedScope & QnaAppliedPeriod & {
  liquidacionSnapshotId: string;
  periodo: string;
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
  estadoProceso: 'TERMINADO';
  reconstructionStrategy: null;
};

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
export type QnaAppliedSummary = QnaAppliedMetadata & { fuentes: QnaAppliedSource[]; totales: QnaTotals; advertencias: QnaAppliedWarning[] };

export type QnaAppliedDetailFilter = QnaAppliedSelection & {
  dominio: QnaDomain;
  page: number;
  pageSize: number;
  buscar?: string;
};

export type QnaAppliedDetailRow = Record<string, unknown> & {
  orden: number;
  empleadoClave: string;
  rfc: string | null;
  nombre: string;
  sourceScale: 2 | 6;
  importeOficialD6: string;
  payloadVersion: 1;
  payloadCanonico: Record<string, unknown>;
  claveFilaHash?: string;
  hashFila?: string;
};

export type QnaAppliedDetailResult = QnaAppliedMetadata & {
  dominio: QnaDomain;
  totalDominioA2: string;
  detalles: QnaAppliedDetailRow[];
  page: number;
  pageSize: number;
  total: number;
  advertencias: QnaAppliedWarning[];
};
