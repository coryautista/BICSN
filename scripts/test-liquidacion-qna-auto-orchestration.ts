import assert from 'node:assert/strict';

process.env.SQLSERVER_DB = 'SII-ISSSSPEA-DES';
process.env.FIREBIRD_DATABASE = '/db/db/dbRestaura.fdb';

const { CreateAndPromoteQnaCandidateCommand } = await import('../src/modules/liquidacionQna/application/commands/CreateAndPromoteQnaCandidateCommand.js');

const calls: string[] = [];
const capture = { captureId: 'capture-1' };
let written: any;
const command = new CreateAndPromoteQnaCandidateCommand(
  { execute: async () => { calls.push('capturar'); return capture; } } as any,
  { execute: async () => { calls.push('aprobar'); } } as any,
  { execute: async () => { calls.push('promover'); } } as any,
  {
    createOfficialV5FromCapture: async (_scope: any, captureWriter: () => Promise<any>) => {
      const input = await captureWriter();
      written = input;
      calls.push('escribir-v2-v5');
      return { liquidacionSnapshotId: '100', revision: 1, hashContenido: 'A'.repeat(64), estado: 'COMPLETO', idempotente: false };
    },
    getById: async () => ({ estado: 'COMPLETO', fuentesCompletas: 10, esOficial: false, ultimaDecision: null }),
    resolveOfficialById: async () => ({ liquidacionSnapshotId: '100', esOficial: true })
  } as any
);
(command as any).factory = { create: (value: unknown) => {
  assert.equal(value, capture);
  return { snapshotV2: { versionEsquema: 5 }, candidate: { versionEsquema: 5 } };
} };

await assert.rejects(() => command.execute({ entidadId: 1, anio: 2026, quincena: 15,
  organica0: '4', organica1: '24', organica2: '1', organica3: '1', usuarioId: '99',
  notApplicableApprovals: [{ dominio: 'PMP', motivo: 'No aplica', evidencia: 'Acta' }] }),
/rol administrativo/);

const result = await command.execute({ entidadId: 1, anio: 2026, quincena: 15,
  organica0: '4', organica1: '24', organica2: '1', organica3: '1', usuarioId: '99' });

assert.deepEqual(calls, ['capturar', 'escribir-v2-v5', 'aprobar', 'promover']);
assert.equal(written.snapshotV2.versionEsquema, 5);
assert.equal(written.candidate.versionEsquema, 5);
assert.equal(result.liquidacionSnapshotId, '100');
assert.equal(result.promovido, true);

let writerAttempts = 0;
let decisionAttempts = 0;
let promoted = false;
const recoveryCommand = new CreateAndPromoteQnaCandidateCommand(
  { execute: async () => capture } as any,
  { execute: async () => {
    decisionAttempts += 1;
    if (decisionAttempts === 1) throw new Error('SIMULATED_FAILURE_AFTER_PERSISTENCE');
  } } as any,
  { execute: async (id: string) => { assert.equal(id, '200'); promoted = true; } } as any,
  {
    createOfficialV5FromCapture: async (_scope: any, captureWriter: () => Promise<any>) => {
      await captureWriter();
      writerAttempts += 1;
      return { liquidacionSnapshotId: '200', revision: 3, hashContenido: 'B'.repeat(64), estado: 'COMPLETO', idempotente: writerAttempts > 1 };
    },
    getById: async () => ({ estado: 'COMPLETO', fuentesCompletas: 10, esOficial: false, ultimaDecision: null }),
    resolveOfficialById: async () => promoted ? ({ liquidacionSnapshotId: '200', esOficial: true }) : null
  } as any
);
(recoveryCommand as any).factory = { create: () => ({ snapshotV2: { versionEsquema: 5 }, candidate: { versionEsquema: 5 } }) };
const recoveryInput = { entidadId: 1, anio: 2026, quincena: 15, organica0: '04', organica1: '24', organica2: '01', organica3: '01', usuarioId: '99' };
await assert.rejects(() => recoveryCommand.execute(recoveryInput), /SIMULATED_FAILURE_AFTER_PERSISTENCE/);
const recovered = await recoveryCommand.execute(recoveryInput);
assert.equal(writerAttempts, 2);
assert.equal(recovered.liquidacionSnapshotId, '200');
assert.equal(recovered.revision, 3);
assert.equal(recovered.idempotente, true);
assert.equal(recovered.promovido, true);

console.log('Liquidacion QNA automatic orchestration: OK');
