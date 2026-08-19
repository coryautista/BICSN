import assert from 'node:assert/strict';

process.env.SQLSERVER_DB = 'SII-ISSSSPEA-DES';
process.env.FIREBIRD_DATABASE = '/db/db/dbRestaura.fdb';

const { CreateAndPromoteQnaCandidateCommand } = await import('../src/modules/liquidacionQna/application/commands/CreateAndPromoteQnaCandidateCommand.js');
const { validateQnaCandidate } = await import('../src/modules/liquidacionQna/domain/services/LiquidacionQnaContracts.js');

const totals = {
  CAIR: '1.00', CAIR_FONDO: '1.01', FRA: '2.00', FRE: '3.00', PRESTACIONES: '5.01',
  FH: '4.00', FV: '5.00', VIVIENDA: '9.01', FAA: '6.00', FAE: '7.00', FAT: '13.01', FAI: '8.00'
};
const latest = { snapshot: { snapshotId: '10', revision: 2, hashContenido: 'A'.repeat(64), nominaCargaId: '20', formulaCalculoVersionId: '30' } };
const official = { origen: 'SNAPSHOT_V2', fallback: { aplicado: false, motivo: null }, snapshot: { snapshotId: '10', revision: 2, hashContenido: 'A'.repeat(64), registros: 1 }, totalesA2: totals };
const pendingApproval = { origen: 'HISTORICO_SQL', fallback: { aplicado: true, motivo: 'SNAPSHOT_SIN_DECISION' }, snapshot: null, totalesA2: totals };
let captured: any;
const calls: string[] = [];
let officialReads = 0;

const aportacionFondoRepo = {
  obtenerAportacionGuarderias: async () => [{ titular_no_empleado: 'E1', titular_rfc: 'RFC1', recibo_folio: 'F1', menor_id: 1, recibo_total_d6: '1.111111' }],
  obtenerPensionNominaTransitorio: async () => [{ interno: 1, rfc: 'RFC1', cconcepto: 'C1', total_d6: '2.222222' }],
  obtenerAguinaldo: async () => [{ interno: 1, rfc: 'RFC1', movimiento: 'A', general_d6: '3.333333' }],
  obtenerPrestamos: async () => [{ interno: 1, rfc: 'RFC1', prestamo: 1, letra: 1, plazo: 1, total_d6: '4.444444' }],
  obtenerPrestamosMedianoPlazo: async () => [{ interno: 1, rfc: 'RFC1', prestamo: 2, letra: 1, folio: 2, total_d6: '5.555555' }],
  obtenerPrestamosHipotecarios: async () => [{ interno: 1, rfc: 'RFC1', pno_solicitud: 3, pano: 2026, cantidad_d6: '6.666666' }],
};
const liquidacionQnaRepo = {
  getById: async () => ({ estado: 'COMPLETO', fuentesCompletas: 10, esOficial: false, ultimaDecision: null }),
  resolveOfficialById: async () => ({ liquidacionSnapshotId: '100', esOficial: true }),
};
const command = new CreateAndPromoteQnaCandidateCommand(
  aportacionFondoRepo as any,
  { execute: async () => latest } as any,
  { execute: async () => officialReads++ === 0 ? pendingApproval : official } as any,
  { execute: async (snapshotId: string, decision: string, _comentario: string, usuarioId: string) => {
    assert.equal(snapshotId, '10');
    assert.equal(decision, 'APROBADO');
    assert.equal(usuarioId, '99');
    calls.push('aprobar-snapshot');
  } } as any,
  { execute: async (input: any) => {
    captured = input;
    const validation = validateQnaCandidate(input);
    calls.push('crear');
    return { liquidacionSnapshotId: '100', revision: 1, hashContenido: validation.hashContenido, estado: 'COMPLETO', idempotente: false };
  } } as any,
  { execute: async () => { calls.push('aprobar'); } } as any,
  { execute: async () => { calls.push('promover'); } } as any,
  liquidacionQnaRepo as any,
);

const result = await command.execute({ entidadId: 1, anio: 2026, quincena: 15, organica0: '4', organica1: '24', organica2: '1', organica3: '1', usuarioId: '99' });

assert.deepEqual(calls, ['aprobar-snapshot', 'crear', 'aprobar', 'promover']);
assert.equal(officialReads, 2);
assert.equal(result.liquidacionSnapshotId, '100');
assert.equal(result.promovido, true);
assert.equal(captured.fuentes.length, 10);
assert.equal(captured.detalles.length, 6);
assert.equal(captured.totales.guarderiasA2, '1.11');
assert.equal(captured.totales.retencionHipA2, '6.66');
assert.equal(captured.organica0, '04');
assert.equal(captured.organica2, '01');

console.log('Liquidacion QNA automatic orchestration: OK');
