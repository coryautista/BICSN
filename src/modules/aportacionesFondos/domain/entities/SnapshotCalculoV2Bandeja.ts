import type { SnapshotCalculoV2ConsultaResultado } from './SnapshotCalculoV2Consulta.js';
import type { SnapshotCalculoV2Estado, SnapshotCalculoV2Fuente, SnapshotTotalesA2 } from './SnapshotCalculoV2.js';

export const SNAPSHOT_V2_ACCEPTANCE_POLICY = 'MXN-A2-DIFF-0.20-v1';

export type SnapshotVeredictoFondo = 'COINCIDE' | 'DIFERENCIA_ESPERADA_PRECISION' | 'DIFERENCIA_REVISAR' | 'SIN_BASELINE';
export type SnapshotVeredictoGeneral = 'APROBADO' | 'OBSERVADO' | 'INCOMPLETO';
export type SnapshotDecision = 'APROBADO' | 'OBSERVADO';

export type SnapshotCalculoV2BandejaFiltro = {
  pagina: number;
  tamanio: number;
  anio?: number;
  quincena?: number;
  entidadId?: number;
  organica0?: string;
  organica1?: string;
  fuente?: SnapshotCalculoV2Fuente;
  estado?: SnapshotCalculoV2Estado;
};

export type SnapshotCalculoV2BandejaReferencia = {
  entidadId: number;
  anio: number;
  quincena: number;
  organica0: string;
  organica1: string;
  organica2: string;
  organica3: string;
  fuente: SnapshotCalculoV2Fuente;
  revision: number;
};

export type SnapshotDecisionRegistro = {
  decisionId: string;
  decision: SnapshotDecision;
  politicaVersion: string;
  comentario: string | null;
  usuarioId: string;
  fechaCreacion: string;
};

export type SnapshotVeredicto = {
  politicaVersion: typeof SNAPSHOT_V2_ACCEPTANCE_POLICY;
  general: SnapshotVeredictoGeneral;
  fondos: Record<keyof SnapshotTotalesA2, {
    revisa: SnapshotVeredictoFondo;
    historico: SnapshotVeredictoFondo;
  }>;
};

export type SnapshotCalculoV2BandejaItem = SnapshotCalculoV2ConsultaResultado & {
  veredicto: SnapshotVeredicto;
  ultimaDecision: SnapshotDecisionRegistro | null;
};

export type SnapshotCalculoV2BandejaResultado = {
  datos: SnapshotCalculoV2BandejaItem[];
  paginacion: { pagina: number; tamanio: number; total: number; paginas: number };
};

export type SnapshotDecisionInput = {
  snapshotId: string;
  decision: SnapshotDecision;
  comentario: string | null;
  usuarioId: string;
};
