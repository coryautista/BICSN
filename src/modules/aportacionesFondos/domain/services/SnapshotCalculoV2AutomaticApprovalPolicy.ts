import { SNAPSHOT_V2_ACCEPTANCE_POLICY, type SnapshotDecisionRegistro } from '../entities/SnapshotCalculoV2Bandeja.js';

export const SNAPSHOT_V2_EXPLICIT_APPROVAL_REQUIRED = 'SNAPSHOT_V2_APROBACION_EXPLICITA_REQUERIDA';

export class SnapshotCalculoV2AutomaticApprovalError extends Error {
  readonly code = SNAPSHOT_V2_EXPLICIT_APPROVAL_REQUIRED;
  readonly statusCode = 409;

  constructor(readonly reason: 'ULTIMA_DECISION_OBSERVADO' | 'POLITICA_APROBACION_DESACTUALIZADA') {
    super(`${SNAPSHOT_V2_EXPLICIT_APPROVAL_REQUIRED}:${reason}`);
    this.name = 'SnapshotCalculoV2AutomaticApprovalError';
  }
}

export function resolveSnapshotV2AutomaticApproval(
  latest: Pick<SnapshotDecisionRegistro, 'decision' | 'politicaVersion'> | null
): 'APPEND_APPROVED' | 'REUSE_APPROVED' {
  if (!latest) return 'APPEND_APPROVED';
  if (latest.decision === 'OBSERVADO') {
    throw new SnapshotCalculoV2AutomaticApprovalError('ULTIMA_DECISION_OBSERVADO');
  }
  if (latest.politicaVersion !== SNAPSHOT_V2_ACCEPTANCE_POLICY) {
    throw new SnapshotCalculoV2AutomaticApprovalError('POLITICA_APROBACION_DESACTUALIZADA');
  }
  return 'REUSE_APPROVED';
}
