import { readFile } from 'node:fs/promises';
import { DATABASE_ENVIRONMENTS, assertDatabaseEnvironment } from '../src/config/databaseEnvironments.js';

const quality = DATABASE_ENVIRONMENTS.CALIDAD;
process.env.SQLSERVER_DB = quality.sqlDatabase;
process.env.FIREBIRD_DATABASE = quality.firebirdDatabase;
assertDatabaseEnvironment('CALIDAD', process.env.SQLSERVER_DB, process.env.FIREBIRD_DATABASE);

const { connectDatabase, closeDatabaseConnection } = await import('../src/db/mssql.js');
const pool = await connectDatabase();

try {
  const database = await pool.request().query('SELECT DB_NAME() AS BaseDatos');
  const databaseName = String(database.recordset[0]?.BaseDatos ?? '');
  if (databaseName !== quality.sqlDatabase) throw new Error(`DESTINO_SQL_NO_PERMITIDO:${databaseName}`);

  const sqlText = await readFile(
    new URL('../database/migrations/20260818_07_allow_qna_v3_decision_policy.sql', import.meta.url),
    'utf8',
  );
  const batches = sqlText.split(/^\s*GO\s*$/gim).map((batch) => batch.trim()).filter(Boolean);
  for (const batch of batches) await pool.request().batch(batch);

  const verification = await pool.request().query(`
    SELECT definition
    FROM sys.check_constraints
    WHERE parent_object_id = OBJECT_ID(N'liquidacion.QnaSnapshotDecision')
      AND name = N'CK_QnaSnapshotDecision_Politica';
  `);
  const definition = String(verification.recordset[0]?.definition ?? '');
  if (!definition.includes('MXN-BASE2-LEAF2-FUND2-APSFONDOS-v3')) {
    throw new Error('QNA_V3_DECISION_POLICY_NO_CONFIRMADA');
  }
  console.log(`QNA_V3_DECISION_POLICY_MIGRATION_OK:${databaseName}`);
} finally {
  await closeDatabaseConnection();
}
