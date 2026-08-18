import assert from 'node:assert/strict';
import { connectDatabase, closeDatabaseConnection } from '/app/dist/db/mssql.js';
import { signAccessToken } from '/app/dist/modules/auth/infrastructure/security/AuthTokenService.js';

const expectedEnabled = process.env.EXPECTED_OFFICIAL_ENABLED === 'true';
const baseUrl = 'http://127.0.0.1:8080/v1/aportacionesFondos/snapshots/v2';
const officialEndpoint = `${baseUrl}/oficial`;
const comparisonEndpoint = `${baseUrl}/comparacion`;
const historyEndpoint = `${baseUrl}/1/decisiones`;
const params = new URLSearchParams({
  entidadId: '1', anio: '2026', quincena: '14',
  organica0: '04', organica1: '24', organica2: '01', organica3: '01',
  fuente: 'HISTORICO_SQL', revision: '1'
});
const fondos = ['CAIR', 'FRA', 'FRE', 'FH', 'FV', 'FAA', 'FAE', 'FAT'];

const pool = await connectDatabase();
const userResult = await pool.request().query('SELECT TOP (1) CONVERT(NVARCHAR(36),id) AS id FROM auth.[user] ORDER BY id');
const userId = String(userResult.recordset[0]?.id ?? '');
assert.ok(userId, 'USUARIO_PROBE_NO_ENCONTRADO');

const decisionCount = async () => {
  const result = await pool.request().query(`
    SELECT COUNT(*) AS Total
    FROM aportaciones.SnapshotCalculoV2Decision
    WHERE SnapshotId=1;
  `);
  return Number(result.recordset[0]?.Total ?? 0);
};

const request = async (roles, endpoint = officialEndpoint) => {
  const token = signAccessToken(userId, roles, [false]).token;
  const response = await fetch(`${endpoint}?${params}`, { headers: { authorization: `Bearer ${token}` } });
  return { status: response.status, body: await response.json() };
};

try {
  const decisionsBefore = await decisionCount();
  assert.equal(decisionsBefore, 0, 'SNAPSHOT_1_TIENE_DECISION_PREVIA');

  const missingToken = await fetch(`${officialEndpoint}?${params}`);
  assert.equal(missingToken.status, 401);
  const forbidden = await request(['usuario']);
  assert.equal(forbidden.status, 403);
  const admin = await request(['admin']);

  if (!expectedEnabled) {
    assert.equal(admin.status, 404);
    assert.equal(admin.body.error?.code, 'SNAPSHOT_V2_OFFICIAL_READ_DISABLED');
  } else {
    assert.equal(admin.status, 200, JSON.stringify(admin.body));
    assert.equal(admin.body.data.origen, 'HISTORICO_SQL');
    assert.deepEqual(admin.body.data.fallback, { aplicado: true, motivo: 'SNAPSHOT_SIN_DECISION' });
    assert.equal(admin.body.data.snapshot, null);
    assert.equal(admin.body.data.registros, 169);
    assert.equal(admin.body.data.totalesA2.FAT, '103261.12');
    assert.equal(admin.body.data.totalesA2.FAI, null);

    const comparison = await request(['admin'], comparisonEndpoint);
    assert.equal(comparison.status, 200);
    for (const fondo of fondos) {
      assert.equal(admin.body.data.totalesA2[fondo], comparison.body.data.historico[fondo], `FONDO_${fondo}_NO_COINCIDE`);
    }

    const historyMissingToken = await fetch(historyEndpoint);
    assert.equal(historyMissingToken.status, 401);
    const historyForbidden = await request(['usuario'], historyEndpoint);
    assert.equal(historyForbidden.status, 403);
    const history = await request(['admin'], historyEndpoint);
    assert.equal(history.status, 200);
    assert.deepEqual(history.body.data, { datos: [], total: 0, ultimaDecision: null });

    const adminToken = signAccessToken(userId, ['admin'], [false]).token;
    const invalidObservation = await fetch(`${baseUrl}/1/decision`, {
      method: 'POST',
      headers: { authorization: `Bearer ${adminToken}`, 'content-type': 'application/json' },
      body: JSON.stringify({ decision: 'OBSERVADO' })
    });
    assert.equal(invalidObservation.status, 400);
  }

  const decisionsAfter = await decisionCount();
  assert.equal(decisionsAfter, decisionsBefore);
  console.log(JSON.stringify({
    expectedEnabled,
    missingToken: missingToken.status,
    forbidden: forbidden.status,
    admin: admin.status,
    ...(expectedEnabled ? {
      origen: admin.body.data.origen,
      fallback: admin.body.data.fallback,
      registros: admin.body.data.registros,
      fat: admin.body.data.totalesA2.FAT,
      fai: admin.body.data.totalesA2.FAI
    } : { error: admin.body.error?.code }),
    decisionesSnapshot1: decisionsAfter
  }, null, 2));
  console.log('APORTACIONES_PHASE7_ENDPOINT_OK');
} finally {
  await closeDatabaseConnection();
}
