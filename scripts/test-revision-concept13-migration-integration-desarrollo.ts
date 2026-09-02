import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import sql from 'mssql';
import { DATABASE_ENVIRONMENTS, assertDatabaseEnvironment } from '../src/config/databaseEnvironments.js';

const development = DATABASE_ENVIRONMENTS.DESARROLLO;
process.env.SQLSERVER_DB = development.sqlDatabase;
process.env.FIREBIRD_DATABASE = development.firebirdDatabase;
assertDatabaseEnvironment('DESARROLLO', process.env.SQLSERVER_DB, process.env.FIREBIRD_DATABASE);

const { connectDatabase, closeDatabaseConnection } = await import('../src/db/mssql.js');
const pool = await connectDatabase();
const transaction = new sql.Transaction(pool);
let active = false;

try {
  const before = await pool.request().query(`
    SELECT numeroConcepto, concepto, activo
    FROM reportes.catalogoRevision
    WHERE numeroConcepto IN (13, 15, 16)
    ORDER BY numeroConcepto`);
  const migration = await readFile(new URL('../database/migrations/20260827_18_consolidate_revision_retention_release.sql', import.meta.url), 'utf8');
  const verification = await readFile(new URL('../database/migrations/20260827_19_verify_revision_retention_release.sql', import.meta.url), 'utf8');

  await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
  active = true;
  await new sql.Request(transaction).batch(migration);
  await new sql.Request(transaction).batch(verification);
  const changed = await new sql.Request(transaction).query(`
    SELECT numeroConcepto, concepto, activo
    FROM reportes.catalogoRevision WITH (UPDLOCK, HOLDLOCK)
    WHERE numeroConcepto IN (13, 15, 16)
    ORDER BY numeroConcepto`);
  const concept13 = changed.recordset.find((row) => Number(row.numeroConcepto) === 13);
  assert.equal(concept13?.concepto, 'Liberación de retenciones con fondo de Ahorro');
  assert.equal(Boolean(concept13?.activo), true);
  assert(changed.recordset.filter((row) => [15, 16].includes(Number(row.numeroConcepto))).every((row) => !Boolean(row.activo)));

  await transaction.rollback();
  active = false;
  const after = await pool.request().query(`
    SELECT numeroConcepto, concepto, activo
    FROM reportes.catalogoRevision
    WHERE numeroConcepto IN (13, 15, 16)
    ORDER BY numeroConcepto`);
  assert.deepEqual(after.recordset, before.recordset);
  console.log('REVISION_CONCEPT13_MIGRATION_ROLLBACK_DESARROLLO_OK');
} finally {
  if (active) await transaction.rollback().catch(() => undefined);
  await closeDatabaseConnection();
}
