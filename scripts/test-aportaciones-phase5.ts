import assert from 'node:assert/strict';
import { SnapshotCalculoV2ConsultaSchema } from '../src/modules/aportacionesFondos/aportacionesFondos.schemas.js';
import type { SnapshotCalculoV2ConsultaRaw } from '../src/modules/aportacionesFondos/domain/entities/SnapshotCalculoV2Consulta.js';
import { compararSnapshotCalculoV2 } from '../src/modules/aportacionesFondos/domain/services/SnapshotCalculoV2Comparison.js';
import { requireRole } from '../src/modules/auth/auth.middleware.js';

const totales = {
  CAIR: '100.10', FRA: '200.20', FRE: '300.30', FH: '40.40', FV: '160.60',
  FAA: '500.50', FAE: '250.25', FAT: '750.75', FAI: '80.80'
};
const raw: SnapshotCalculoV2ConsultaRaw = {
  snapshot: {
    snapshotId: '1', entidadId: 1, anio: 2026, quincena: 14, periodo: '1426',
    organica0: '04', organica1: '24', organica2: '01', organica3: '01',
    ambiente: 'CALIDAD', fuente: 'HISTORICO_SQL', estado: 'COMPLETO',
    formulaCalculoVersionId: '1', nominaCargaId: '20', precisionPolicy: 'TEST',
    versionEsquema: 1, revision: 1, hashContenido: 'A'.repeat(64), registros: 2,
    esCerrado: true, fechaCreacion: '2026-08-16T00:00:00.000Z', totalesA2: totales
  },
  revisa: { ...totales, FAT: '750.70', FAI: '80.90' },
  historico: { ...totales, FAI: null },
  linea: { estatus: 'VIGENTE', importe: '1000.00' }
};

const result = compararSnapshotCalculoV2(raw);
assert.equal(result.comparacion.FAT.diferenciaRevisa, '0.05');
assert.equal(result.comparacion.FAI.diferenciaRevisa, '-0.10');
assert.equal(result.comparacion.CAIR.diferenciaHistorico, '0.00');
assert.equal(result.comparacion.FAI.diferenciaHistorico, null);

const parsed = SnapshotCalculoV2ConsultaSchema.parse({
  entidadId: '1', anio: '2026', quincena: '14',
  organica0: '04', organica1: '24', organica2: '01', organica3: '01'
});
assert.equal(parsed.entidadId, 1);
assert.equal(parsed.fuente, 'LIQUIDACION_V2');
assert.equal(parsed.incluirDetalles, false);
assert.equal(SnapshotCalculoV2ConsultaSchema.safeParse({ ...parsed, organica0: '4' }).success, false);
assert.equal(SnapshotCalculoV2ConsultaSchema.safeParse({ ...parsed, revision: '0' }).success, false);

const forbidden = { statusCode: 200, body: undefined as unknown, code(value: number) { this.statusCode = value; return this; }, send(value: unknown) { this.body = value; return value; } };
await requireRole('admin')({ user: { roles: ['usuario'] } } as any, forbidden as any);
assert.equal(forbidden.statusCode, 403);
assert.deepEqual(forbidden.body, { ok: false, error: { code: 'FORBIDDEN', message: 'Insufficient role' } });
const allowed = { ...forbidden, statusCode: 200, body: undefined };
assert.equal(await requireRole('admin')({ user: { roles: ['admin'] } } as any, allowed as any), undefined);
assert.equal(allowed.statusCode, 200);

console.log('APORTACIONES_PHASE5_TESTS_OK');
