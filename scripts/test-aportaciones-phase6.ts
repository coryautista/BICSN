import assert from 'node:assert/strict';
import { SnapshotCalculoV2BandejaSchema, SnapshotCalculoV2DecisionSchema } from '../src/modules/aportacionesFondos/aportacionesFondos.schemas.js';
import type { SnapshotCalculoV2ConsultaResultado } from '../src/modules/aportacionesFondos/domain/entities/SnapshotCalculoV2Consulta.js';
import { evaluarSnapshotCalculoV2 } from '../src/modules/aportacionesFondos/domain/services/SnapshotCalculoV2Acceptance.js';

const fondos = ['CAIR', 'FRA', 'FRE', 'FH', 'FV', 'FAA', 'FAE', 'FAT', 'FAI'] as const;
const comparacion = Object.fromEntries(fondos.map((fondo) => [fondo, {
  snapshot: '100.00', revisa: '100.00', diferenciaRevisa: '0.00',
  historico: '100.00', diferenciaHistorico: '0.00'
}])) as SnapshotCalculoV2ConsultaResultado['comparacion'];
const base = {
  snapshot: { estado: 'COMPLETO' },
  comparacion
} as SnapshotCalculoV2ConsultaResultado;

assert.equal(evaluarSnapshotCalculoV2(base).general, 'APROBADO');
assert.equal(evaluarSnapshotCalculoV2(base).fondos.CAIR.revisa, 'COINCIDE');

const expectedPrecision = structuredClone(base);
expectedPrecision.comparacion.FAT.diferenciaRevisa = '-0.20';
assert.equal(evaluarSnapshotCalculoV2(expectedPrecision).fondos.FAT.revisa, 'DIFERENCIA_ESPERADA_PRECISION');
assert.equal(evaluarSnapshotCalculoV2(expectedPrecision).general, 'APROBADO');

const requiresReview = structuredClone(base);
requiresReview.comparacion.FAT.diferenciaRevisa = '0.21';
assert.equal(evaluarSnapshotCalculoV2(requiresReview).fondos.FAT.revisa, 'DIFERENCIA_REVISAR');
assert.equal(evaluarSnapshotCalculoV2(requiresReview).general, 'OBSERVADO');

const noBaseline = structuredClone(base);
noBaseline.comparacion.FAI.revisa = null;
noBaseline.comparacion.FAI.diferenciaRevisa = null;
noBaseline.comparacion.FAI.historico = null;
noBaseline.comparacion.FAI.diferenciaHistorico = null;
assert.equal(evaluarSnapshotCalculoV2(noBaseline).general, 'INCOMPLETO');

const incomplete = structuredClone(base);
incomplete.snapshot.estado = 'INCOMPLETO';
assert.equal(evaluarSnapshotCalculoV2(incomplete).general, 'INCOMPLETO');

assert.deepEqual(SnapshotCalculoV2BandejaSchema.parse({}), { pagina: 1, tamanio: 20 });
assert.equal(SnapshotCalculoV2BandejaSchema.safeParse({ tamanio: '51' }).success, false);
assert.deepEqual(SnapshotCalculoV2DecisionSchema.parse({ decision: 'APROBADO', comentario: '  valido  ' }), {
  decision: 'APROBADO', comentario: 'valido'
});
assert.equal(SnapshotCalculoV2DecisionSchema.safeParse({ decision: 'INVALIDO' }).success, false);

console.log('APORTACIONES_PHASE6_TESTS_OK');
