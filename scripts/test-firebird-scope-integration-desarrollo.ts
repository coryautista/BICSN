import assert from 'node:assert/strict';
import { DATABASE_ENVIRONMENTS, assertDatabaseEnvironment } from '../src/config/databaseEnvironments.js';

const development = DATABASE_ENVIRONMENTS.DESARROLLO;
process.env.SQLSERVER_DB = development.sqlDatabase;
process.env.FIREBIRD_DATABASE = development.firebirdDatabase;
assertDatabaseEnvironment('DESARROLLO', process.env.SQLSERVER_DB, process.env.FIREBIRD_DATABASE);

const mssql = await import('../src/db/mssql.js');
const firebird = await import('../src/db/firebird.js');
const catalog = await import('../src/db/firebirdCatalog.js');

await mssql.connectDatabase();
try {
  const scope = { org0: '04', org1: '24' };
  const credential = await catalog.getFirebirdScopeCredential(scope.org0, scope.org1);
  const rows = await firebird.executeSafeQuery(
    'SELECT CURRENT_USER AS USUARIO FROM RDB$DATABASE',
    [],
    undefined,
    scope
  );
  assert.equal(String(rows[0]?.USUARIO ?? '').trim().toUpperCase(), credential.user.trim().toUpperCase());
  const callbackRows = await firebird.executeSerializedQuery((db) => new Promise<any[]>((resolve, reject) => {
    db.query('SELECT CURRENT_USER AS USUARIO FROM RDB$DATABASE', [], (error, result) => {
      if (error) reject(error);
      else resolve(result ?? []);
    });
  }), scope);
  assert.equal(String(callbackRows[0]?.USUARIO ?? '').trim().toUpperCase(), credential.user.trim().toUpperCase());

  const configured = await mssql.getPool().request().query(`
    SELECT Org0, Org1
    FROM config.FirebirdOrganicaCredential
    WHERE Activo=1;
  `);
  const active = new Set(configured.recordset.map((row) => `${row.Org0}|${row.Org1}`));
  let missingScope: { org0: string; org1: string } | undefined;
  for (let value = 0; value <= 99 && !missingScope; value += 1) {
    const org = String(value).padStart(2, '0');
    if (!active.has(`${org}|${org}`)) missingScope = { org0: org, org1: org };
  }
  assert.ok(missingScope, 'NO_SE_ENCONTRO_SCOPE_SIN_CATALOGO');
  await assert.rejects(
    firebird.executeSafeQuery('SELECT 1 AS OK FROM RDB$DATABASE', [], undefined, missingScope),
    (error: any) => error?.code === 'FIREBIRD_CREDENCIAL_ORGANICA_NO_CONFIGURADA'
  );

  console.log('FIREBIRD_SCOPE_CURRENT_USER_DESARROLLO_OK');
  console.log('FIREBIRD_SCOPE_MISSING_REJECTED_DESARROLLO_OK');
} finally {
  await firebird.closeFirebirdPool();
  await mssql.closeDatabaseConnection();
}
