import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { DATABASE_ENVIRONMENTS, assertDatabaseEnvironment } from '../src/config/databaseEnvironments.js';

const production = DATABASE_ENVIRONMENTS.PRODUCCION;
process.env.SQLSERVER_DB = production.sqlDatabase;
process.env.FIREBIRD_DATABASE = production.firebirdDatabase;
assertDatabaseEnvironment('PRODUCCION', process.env.SQLSERVER_DB, process.env.FIREBIRD_DATABASE);

const verificationFiles = [
  '../database/migrations/20260816_verify_nomina_carga_tipo_vigente.sql',
  '../database/migrations/20260816_verify_aportaciones_snapshot_v2.sql',
  '../database/migrations/20260817_verify_snapshot_v2_decision.sql',
  '../database/migrations/20260818_05_verify_liquidacion_v3.sql',
] as const;

const { connectDatabase, closeDatabaseConnection } = await import('../src/db/mssql.js');
const pool = await connectDatabase();
try {
  const database = await pool.request().query('SELECT DB_NAME() AS BaseDatos');
  assert.equal(String(database.recordset[0]?.BaseDatos), production.sqlDatabase);

  for (const file of verificationFiles) {
    const source = await readFile(new URL(file, import.meta.url), 'utf8');
    const batches = source.split(/^\s*GO\s*$/gim).map((batch) => batch.trim()).filter(Boolean);
    for (const batch of batches) await pool.request().batch(batch);
  }

  const result = await pool.request().query(`
    SELECT FormulaCalculoVersionId,NumeroVersion,PrecisionPolicy,Estado
    FROM aportaciones.FormulaCalculoVersion
    WHERE ClaveFormula='APORTACIONES-NOMINA' AND AnioVigencia=2026 AND Estado='ACTIVA';

    SELECT definition,is_disabled,is_not_trusted
    FROM sys.check_constraints
    WHERE parent_object_id=OBJECT_ID(N'liquidacion.QnaSnapshotDecision')
      AND name=N'CK_QnaSnapshotDecision_Politica';
  `);
  assert.equal(result.recordsets[0].length, 1, 'Debe existir exactamente una formula activa 2026');
  assert.equal(String(result.recordsets[0][0].PrecisionPolicy), 'MXN-BASE2-LEAF2-FUND2-APSFONDOS-v3');
  const decisionCheck = result.recordsets[1][0];
  assert.ok(String(decisionCheck?.definition ?? '').includes('MXN-BASE2-LEAF2-FUND2-APSFONDOS-v3'));
  assert.equal(Boolean(decisionCheck?.is_disabled), false);
  assert.equal(Boolean(decisionCheck?.is_not_trusted), false);
  console.log(JSON.stringify({
    environment: 'PRODUCCION',
    sqlDatabase: production.sqlDatabase,
    firebirdDatabase: production.firebirdDatabase,
    readOnly: true,
    formula: result.recordsets[0][0],
    verificaciones: verificationFiles,
  }, null, 2));
  console.log('PRODUCTION_V3_POSTMIGRATION_READONLY_OK');
} finally {
  await closeDatabaseConnection();
}
