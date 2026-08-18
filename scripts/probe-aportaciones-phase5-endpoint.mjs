import assert from 'node:assert/strict';
import { connectDatabase, closeDatabaseConnection } from '/app/dist/db/mssql.js';
import { signAccessToken } from '/app/dist/modules/auth/infrastructure/security/AuthTokenService.js';

const endpoint = 'http://127.0.0.1:8080/v1/aportacionesFondos/snapshots/v2/comparacion';
const inboxEndpoint = 'http://127.0.0.1:8080/v1/aportacionesFondos/snapshots/v2';
const params = new URLSearchParams({
  entidadId: '1', anio: '2026', quincena: '14',
  organica0: '04', organica1: '24', organica2: '01', organica3: '01',
  fuente: 'HISTORICO_SQL'
});

async function request(roles, incluirDetalles = false) {
  const token = signAccessToken(userId, roles, [false]).token;
  const query = new URLSearchParams(params);
  if (incluirDetalles) query.set('incluirDetalles', '1');
  const response = await fetch(`${endpoint}?${query}`, { headers: { authorization: `Bearer ${token}` } });
  return { status: response.status, body: await response.json() };
}

const pool = await connectDatabase();
const userResult = await pool.request().query('SELECT TOP (1) CONVERT(NVARCHAR(36),id) AS id FROM auth.[user] ORDER BY id');
const userId = String(userResult.recordset[0]?.id ?? '');
assert.ok(userId, 'USUARIO_PROBE_NO_ENCONTRADO');

try {
  const missingToken = await fetch(`${endpoint}?${params}`);
  assert.equal(missingToken.status, 401);
  const forbidden = await request(['usuario']);
  assert.equal(forbidden.status, 403);
  const admin = await request(['admin']);
  assert.equal(admin.status, 200);
  assert.equal(admin.body.data.snapshot.snapshotId, '1');
  assert.equal(admin.body.data.snapshot.detalles, undefined);
  assert.equal(admin.body.data.comparacion.FAT.diferenciaRevisa, '0.10');
  const detailed = await request(['admin'], true);
  assert.equal(detailed.status, 200);
  assert.equal(detailed.body.data.snapshot.detalles.length, 169);
  for (const row of detailed.body.data.snapshot.detalles) {
    assert.equal('rfc' in row, false);
    assert.equal('nombre' in row, false);
  }
  const adminToken = signAccessToken(userId, ['admin'], [false]).token;
  const inbox = await fetch(`${inboxEndpoint}?anio=2026&quincena=14&entidadId=1&organica0=04&organica1=24&fuente=HISTORICO_SQL`, {
    headers: { authorization: `Bearer ${adminToken}` }
  });
  const inboxBody = await inbox.json();
  assert.equal(inbox.status, 200);
  assert.equal(inboxBody.data.paginacion.total, 1);
  assert.equal(inboxBody.data.datos[0].veredicto.general, 'APROBADO');
  const missingDecision = await fetch(`${inboxEndpoint}/999999999/decision`, {
    method: 'POST',
    headers: { authorization: `Bearer ${adminToken}`, 'content-type': 'application/json' },
    body: JSON.stringify({ decision: 'OBSERVADO', comentario: 'probe-no-insert' })
  });
  assert.equal(missingDecision.status, 404);
  console.log(JSON.stringify({
    missingToken: missingToken.status,
    forbidden: forbidden.status,
    admin: admin.status,
    snapshotId: admin.body.data.snapshot.snapshotId,
    revision: admin.body.data.snapshot.revision,
    detallesAnonimizados: detailed.body.data.snapshot.detalles.length,
    bandeja: { status: inbox.status, total: inboxBody.data.paginacion.total, veredicto: inboxBody.data.datos[0].veredicto.general },
    decisionSnapshotInexistente: missingDecision.status,
    fat: admin.body.data.comparacion.FAT
  }, null, 2));
  console.log('APORTACIONES_PHASE6_ENDPOINT_OK');
} finally {
  await closeDatabaseConnection();
}
