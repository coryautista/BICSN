import assert from 'node:assert/strict';
import { SnapshotCalculoV2DecisionParamsSchema, SnapshotCalculoV2DecisionSchema } from '../src/modules/aportacionesFondos/aportacionesFondos.schemas.js';
import { CreateSnapshotCalculoV2DecisionCommand } from '../src/modules/aportacionesFondos/application/commands/CreateSnapshotCalculoV2DecisionCommand.js';
import { ListSnapshotCalculoV2DecisionsQuery } from '../src/modules/aportacionesFondos/application/queries/ListSnapshotCalculoV2DecisionsQuery.js';
import { AportacionFondoDomainError, AportacionFondoError } from '../src/modules/aportacionesFondos/domain/errors.js';
import type { ISnapshotCalculoV2Repository } from '../src/modules/aportacionesFondos/domain/repositories/ISnapshotCalculoV2Repository.js';

const decision = {
  decisionId: '2', decision: 'APROBADO' as const, politicaVersion: 'MXN-A2-DIFF-0.20-v1',
  comentario: null, usuarioId: '00000000-0000-0000-0000-000000000001', fechaCreacion: '2026-08-17T02:00:00.000Z'
};
const previous = { ...decision, decisionId: '1', decision: 'OBSERVADO' as const, comentario: 'Revisar', fechaCreacion: '2026-08-17T01:00:00.000Z' };

assert.equal(SnapshotCalculoV2DecisionParamsSchema.safeParse({ snapshotId: '1' }).success, true);
assert.equal(SnapshotCalculoV2DecisionParamsSchema.safeParse({ snapshotId: 'x' }).success, false);
assert.equal(SnapshotCalculoV2DecisionSchema.safeParse({ decision: 'OBSERVADO' }).success, false);
assert.equal(SnapshotCalculoV2DecisionSchema.safeParse({ decision: 'OBSERVADO', comentario: ' Revisar diferencia ' }).success, true);
assert.deepEqual(SnapshotCalculoV2DecisionSchema.parse({ decision: 'APROBADO' }), { decision: 'APROBADO', comentario: null });

const historyRepo = { listarDecisiones: async () => [decision, previous] } as unknown as ISnapshotCalculoV2Repository;
const history = await new ListSnapshotCalculoV2DecisionsQuery(historyRepo).execute('1');
assert.equal(history?.total, 2);
assert.equal(history?.ultimaDecision?.decisionId, '2');
assert.deepEqual(history?.datos, [decision, previous]);

const missingHistoryRepo = { listarDecisiones: async () => null } as unknown as ISnapshotCalculoV2Repository;
assert.equal(await new ListSnapshotCalculoV2DecisionsQuery(missingHistoryRepo).execute('999'), null);

let saved = false;
const eligibleRepo = {
  consultarElegibilidadDecision: async () => 'DECIDIBLE' as const,
  guardarDecision: async () => { saved = true; return decision; }
} as unknown as ISnapshotCalculoV2Repository;
assert.equal((await new CreateSnapshotCalculoV2DecisionCommand(eligibleRepo).execute('1', 'APROBADO', null, decision.usuarioId)).decisionId, '2');
assert.equal(saved, true);

for (const [eligibility, code] of [
  ['NO_ENCONTRADO', AportacionFondoError.SNAPSHOT_V2_NO_ENCONTRADO],
  ['NO_DECIDIBLE', AportacionFondoError.SNAPSHOT_V2_NO_DECIDIBLE]
] as const) {
  const repo = { consultarElegibilidadDecision: async () => eligibility } as unknown as ISnapshotCalculoV2Repository;
  await assert.rejects(
    () => new CreateSnapshotCalculoV2DecisionCommand(repo).execute('1', 'APROBADO', null, decision.usuarioId),
    (error: unknown) => error instanceof AportacionFondoDomainError && error.code === code
  );
}

console.log('APORTACIONES_PHASE8_TESTS_OK');
