import assert from 'node:assert/strict';
import {
  resolveSnapshotV2AutomaticApproval,
  SnapshotCalculoV2AutomaticApprovalError
} from '../src/modules/aportacionesFondos/domain/services/SnapshotCalculoV2AutomaticApprovalPolicy.js';

const currentPolicy = 'MXN-A2-DIFF-0.20-v1';

assert.equal(resolveSnapshotV2AutomaticApproval(null), 'APPEND_APPROVED');
assert.equal(resolveSnapshotV2AutomaticApproval({ decision: 'APROBADO', politicaVersion: currentPolicy }), 'REUSE_APPROVED');
assert.equal(resolveSnapshotV2AutomaticApproval({
  decision: 'APROBADO', politicaVersion: currentPolicy,
  usuarioId: 'actor-diferente', comentario: 'comentario diferente'
} as any), 'REUSE_APPROVED');
assert.throws(
  () => resolveSnapshotV2AutomaticApproval({ decision: 'OBSERVADO', politicaVersion: currentPolicy }),
  (error: unknown) => error instanceof SnapshotCalculoV2AutomaticApprovalError
    && error.code === 'SNAPSHOT_V2_APROBACION_EXPLICITA_REQUERIDA'
    && error.reason === 'ULTIMA_DECISION_OBSERVADO'
);
assert.throws(
  () => resolveSnapshotV2AutomaticApproval({ decision: 'APROBADO', politicaVersion: 'POLITICA-ANTERIOR' }),
  (error: unknown) => error instanceof SnapshotCalculoV2AutomaticApprovalError
    && error.code === 'SNAPSHOT_V2_APROBACION_EXPLICITA_REQUERIDA'
    && error.reason === 'POLITICA_APROBACION_DESACTUALIZADA'
);

console.log('SNAPSHOT_V2_AUTOMATIC_APPROVAL_POLICY_TESTS_OK');
