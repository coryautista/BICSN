import assert from 'node:assert/strict';
import { SnapshotCalculoV2OfficialSchema } from '../src/modules/aportacionesFondos/aportacionesFondos.schemas.js';
import { GetSnapshotCalculoV2OfficialQuery } from '../src/modules/aportacionesFondos/application/queries/GetSnapshotCalculoV2OfficialQuery.js';
import { obtenerMotivoFallback } from '../src/modules/aportacionesFondos/domain/entities/SnapshotCalculoV2Official.js';
import type { ISnapshotCalculoV2Repository } from '../src/modules/aportacionesFondos/domain/repositories/ISnapshotCalculoV2Repository.js';

const filtro = {
  entidadId: 1, anio: 2026, quincena: 14,
  organica0: '01', organica1: '01', organica2: '00', organica3: '00',
  fuente: 'LIQUIDACION_V2' as const, revision: 1
};
const totales = { CAIR: '1.00', FRA: '2.00', FRE: '3.00', FH: '4.00', FV: '5.00', FAA: '6.00', FAE: '7.00', FAT: '13.00', FAI: '8.00' };
const historico = { ...totales, FAI: null };
const snapshot = {
  snapshotId: '1', entidadId: 1, anio: 2026, quincena: 14, periodo: '1426',
  organica0: '01', organica1: '01', organica2: '00', organica3: '00', ambiente: 'CALIDAD',
  fuente: 'LIQUIDACION_V2' as const, estado: 'COMPLETO' as const, formulaCalculoVersionId: '1',
  nominaCargaId: '20', precisionPolicy: 'MXN-DETAIL6-AGG2-TRUNC-v1', versionEsquema: 1,
  revision: 1, hashContenido: 'A'.repeat(64), registros: 169, esCerrado: true,
  fechaCreacion: new Date(0).toISOString(), totalesA2: totales
};
const raw = { snapshot, revisa: null, historico, linea: null };
const aprobada = {
  decisionId: '1', decision: 'APROBADO' as const, politicaVersion: 'MXN-A2-DIFF-0.20-v1',
  comentario: null, usuarioId: '00000000-0000-0000-0000-000000000001', fechaCreacion: new Date(0).toISOString()
};

assert.deepEqual(SnapshotCalculoV2OfficialSchema.parse({ ...filtro, entidadId: '1', anio: '2026', quincena: '14', revision: '1' }), filtro);
assert.equal(SnapshotCalculoV2OfficialSchema.safeParse({ ...filtro, revision: undefined }).success, false);
assert.equal(obtenerMotivoFallback(null, null), 'SNAPSHOT_NO_ENCONTRADO');
assert.equal(obtenerMotivoFallback({ estado: 'INCOMPLETO', esCerrado: true }, aprobada), 'SNAPSHOT_NO_COMPLETO');
assert.equal(obtenerMotivoFallback({ estado: 'COMPLETO', esCerrado: false }, aprobada), 'SNAPSHOT_NO_CERRADO');
assert.equal(obtenerMotivoFallback(snapshot, null), 'SNAPSHOT_SIN_DECISION');
assert.equal(obtenerMotivoFallback(snapshot, { ...aprobada, politicaVersion: 'politica-anterior' }), 'SNAPSHOT_DECISION_POLITICA_NO_VIGENTE');
assert.equal(obtenerMotivoFallback(snapshot, { ...aprobada, decision: 'OBSERVADO' }), 'SNAPSHOT_OBSERVADO');
assert.equal(obtenerMotivoFallback(snapshot, aprobada), null);

let historicalReads = 0;
const approvedRepo = {
  consultar: async () => raw,
  consultarUltimaDecision: async () => aprobada,
  consultarTotalesHistoricos: async () => { historicalReads += 1; return { registros: 169, totalesA2: historico }; }
} as unknown as ISnapshotCalculoV2Repository;
const approvedResult = await new GetSnapshotCalculoV2OfficialQuery(approvedRepo).execute(filtro);
assert.equal(approvedResult?.origen, 'SNAPSHOT_V2');
assert.equal(approvedResult?.snapshot?.decision.decision, 'APROBADO');
assert.equal(approvedResult?.registros, 169);
assert.equal(historicalReads, 0);

const fallbackRepo = {
  consultar: async () => raw,
  consultarUltimaDecision: async () => null,
  consultarTotalesHistoricos: async () => ({ registros: 169, totalesA2: historico })
} as unknown as ISnapshotCalculoV2Repository;
const fallbackResult = await new GetSnapshotCalculoV2OfficialQuery(fallbackRepo).execute(filtro);
assert.equal(fallbackResult?.origen, 'HISTORICO_SQL');
assert.deepEqual(fallbackResult?.fallback, { aplicado: true, motivo: 'SNAPSHOT_SIN_DECISION' });
assert.equal(fallbackResult?.totalesA2.FAI, null);
assert.equal(fallbackResult?.registros, 169);

const unavailableRepo = {
  consultar: async () => null,
  consultarUltimaDecision: async () => null,
  consultarTotalesHistoricos: async () => null
} as unknown as ISnapshotCalculoV2Repository;
assert.equal(await new GetSnapshotCalculoV2OfficialQuery(unavailableRepo).execute(filtro), null);

console.log('APORTACIONES_PHASE7_TESTS_OK');
