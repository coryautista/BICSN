export const LEGACY_PRECISION_POLICY = 'MXN-DETAIL6-AGG2-TRUNC-v1' as const;
export const PRECISION_POLICY = 'MXN-BASE2-LEAF2-FUND2-APSFONDOS-v3' as const;
export type QnaPrecisionPolicy = typeof LEGACY_PRECISION_POLICY | typeof PRECISION_POLICY;

export const QNA_DOMAINS = [
  'AHORRO', 'VIVIENDA', 'PRESTACIONES', 'CAIR', 'GUARDERIAS',
  'TRANSITORIO', 'AGUINALDO', 'PCP', 'PMP', 'HIP',
] as const;

export type QnaDomain = typeof QNA_DOMAINS[number];
export type QnaEnvironment = 'DESARROLLO' | 'CALIDAD' | 'PRODUCCION';
export type QnaSourceType = 'TXT_NOMINA' | 'FIREBIRD' | 'SQL_HISTORICO' | 'MOVIMIENTO';
export type QnaSourceState = 'COMPLETE' | 'EMPTY' | 'NOT_APPLICABLE' | 'ERROR';
export type QnaDecision = 'APROBADO' | 'OBSERVADO';
export type QnaProcessState =
  | 'OFICIAL' | 'APLICANDO_FIREBIRD' | 'FIREBIRD_CONFIRMADO' | 'FIREBIRD_REVERTIDO'
  | 'APLICACION_INCIERTA' | 'LINEA_CONFIRMADA' | 'REVISA_PROGRAMADA' | 'TERMINADO';
export type MoneyA2 = string;
export type MoneyD6 = string;

export interface QnaScope {
  entidadId: number;
  anio: number;
  quincena: number;
  organica0: string;
  organica1: string;
  organica2: string;
  organica3: string;
}

export interface QnaSource {
  dominio: QnaDomain;
  tipoFuente: QnaSourceType;
  estado: QnaSourceState;
  requerida: boolean;
  identificadorFuente: string;
  hashFuente: string | null;
  sourceScale: 2 | 6;
  registros: number;
  notApplicableAprobado: boolean;
  aprobadoPor: string | null;
  evidencia: string | null;
  errorCode: string | null;
}

export interface QnaRevisaControlsA2 {
  cairA2: MoneyA2;
  fraA2: MoneyA2;
  freA2: MoneyA2;
  fhA2: MoneyA2;
  fvA2: MoneyA2;
  faaA2: MoneyA2;
  faeA2: MoneyA2;
  fatA2: MoneyA2;
  faiA2: MoneyA2;
}

export interface QnaPayableContributionsA2 {
  ahorroA2: MoneyA2;
  viviendaA2: MoneyA2;
  prestacionesA2: MoneyA2;
  cairFondoA2: MoneyA2;
  guarderiasA2: MoneyA2;
  transitorioA2: MoneyA2;
  aguinaldoA2: MoneyA2;
}

export interface QnaRetentionsA2 {
  retencionPcpA2: MoneyA2;
  retencionPmpA2: MoneyA2;
  retencionHipA2: MoneyA2;
}

export interface QnaTotals extends QnaRevisaControlsA2, QnaPayableContributionsA2, QnaRetentionsA2 {
  registros: number;
  totalAportacionesA2: MoneyA2;
  totalRetencionesA2: MoneyA2;
  totalGeneralA2: MoneyA2;
}

export interface QnaSourceDetail {
  dominio: Extract<QnaDomain, 'GUARDERIAS' | 'TRANSITORIO' | 'AGUINALDO' | 'PCP' | 'PMP' | 'HIP'>;
  orden: number;
  claveFilaHash: string;
  sourceScale: 2 | 6;
  importeOficialD6: MoneyD6;
  payloadCanonico: Record<string, unknown>;
  hashFila: string;
}

export interface CreateQnaCandidateInput extends QnaScope {
  ambiente: QnaEnvironment;
  snapshotCalculoV2Id: string | null;
  nominaCargaId: string | null;
  formulaCalculoVersionId: string | null;
  fuentes: QnaSource[];
  totales: QnaTotals;
  detalles: QnaSourceDetail[];
  usuarioId: string | null;
}

export interface QnaDecisionRecord {
  qnaSnapshotDecisionId: string;
  decision: QnaDecision;
  politicaVersion: QnaPrecisionPolicy;
  comentario: string | null;
  usuarioId: string;
  fechaCreacion: string;
}

export interface QnaSnapshot extends CreateQnaCandidateInput {
  liquidacionSnapshotId: string;
  periodo: string;
  estado: 'COMPLETO' | 'INCOMPLETO';
  revision: number;
  precisionPolicy: QnaPrecisionPolicy;
  versionEsquema: 3 | 4;
  hashContenido: string;
  fuentesEsperadas: 10;
  fuentesCompletas: number;
  fechaCreacion: string;
  ultimaDecision: QnaDecisionRecord | null;
  esOficial: boolean;
}

export interface QnaListFilter {
  pagina: number;
  tamanio: number;
  entidadId?: number;
  anio?: number;
  quincena?: number;
  estado?: 'COMPLETO' | 'INCOMPLETO';
}

export interface QnaListResult {
  items: QnaSnapshot[];
  pagina: number;
  tamanio: number;
  total: number;
}

export interface CreateQnaCandidateResult {
  liquidacionSnapshotId: string;
  revision: number;
  hashContenido: string;
  estado: 'COMPLETO' | 'INCOMPLETO';
  idempotente: boolean;
}

export interface PromoteQnaResult {
  liquidacionSnapshotId: string;
  qnaProcesoId: string;
  qnaSnapshotSeleccionEventoId: string;
  tipoEvento: 'SELECCIONADO' | 'REEMPLAZADO';
  idempotente: boolean;
}
