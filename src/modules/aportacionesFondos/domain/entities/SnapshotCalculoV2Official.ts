import type { SnapshotCalculoV2Estado, SnapshotCalculoV2Fuente, SnapshotTotalesA2 } from './SnapshotCalculoV2.js';
import type { SnapshotDecisionRegistro } from './SnapshotCalculoV2Bandeja.js';
import { SNAPSHOT_V2_ACCEPTANCE_POLICY } from './SnapshotCalculoV2Bandeja.js';
import { FORMULA_PRECISION_POLICY, FORMULA_PRECISION_POLICY_LEGACY } from './FormulaCalculo.js';

export type SnapshotLecturaOficialFiltro = {
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

export type SnapshotTotalesHistoricos = Omit<SnapshotTotalesA2, 'FAI'> & { FAI: null };

export type SnapshotHistoricoAgregado = {
  registros: number;
  totalesA2: SnapshotTotalesHistoricos;
};

export type SnapshotLecturaOficialMotivoFallback =
  | 'SNAPSHOT_NO_ENCONTRADO'
  | 'SNAPSHOT_NO_COMPLETO'
  | 'SNAPSHOT_POLITICA_PRECISION_NO_VIGENTE'
  | 'SNAPSHOT_NO_CERRADO'
  | 'SNAPSHOT_SIN_DECISION'
  | 'SNAPSHOT_DECISION_POLITICA_NO_VIGENTE'
  | 'SNAPSHOT_OBSERVADO';

export type SnapshotLecturaOficialResultado = {
  origen: 'SNAPSHOT_V2' | 'HISTORICO_SQL';
  seleccionSolicitada: { fuente: SnapshotCalculoV2Fuente; revision: number };
  fallback: { aplicado: boolean; motivo: SnapshotLecturaOficialMotivoFallback | null };
  snapshot: {
    snapshotId: string;
    revision: number;
    fuente: SnapshotCalculoV2Fuente;
    estado: SnapshotCalculoV2Estado;
    registros: number;
    hashContenido: string;
    decision: SnapshotDecisionRegistro;
  } | null;
  registros: number;
  totalesA2: SnapshotTotalesA2 | SnapshotTotalesHistoricos;
};

export function obtenerMotivoFallback(
  snapshot: { estado: SnapshotCalculoV2Estado; esCerrado: boolean; precisionPolicy: string; versionEsquema?: number } | null,
  decision: SnapshotDecisionRegistro | null
): SnapshotLecturaOficialMotivoFallback | null {
  if (!snapshot) return 'SNAPSHOT_NO_ENCONTRADO';
  if (snapshot.estado !== 'COMPLETO') return 'SNAPSHOT_NO_COMPLETO';
  if (!snapshot.esCerrado) return 'SNAPSHOT_NO_CERRADO';
  const policyIsValid = snapshot.versionEsquema === 1
    ? snapshot.precisionPolicy === FORMULA_PRECISION_POLICY_LEGACY
    : snapshot.precisionPolicy === FORMULA_PRECISION_POLICY;
  if (!policyIsValid) return 'SNAPSHOT_POLITICA_PRECISION_NO_VIGENTE';
  if (!decision) return 'SNAPSHOT_SIN_DECISION';
  if (decision.politicaVersion !== SNAPSHOT_V2_ACCEPTANCE_POLICY) return 'SNAPSHOT_DECISION_POLITICA_NO_VIGENTE';
  return decision.decision === 'APROBADO' ? null : 'SNAPSHOT_OBSERVADO';
}
