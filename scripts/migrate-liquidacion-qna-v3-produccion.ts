import { readFile } from 'node:fs/promises';
import sql from 'mssql';
import { DATABASE_ENVIRONMENTS, assertDatabaseEnvironment } from '../src/config/databaseEnvironments.js';

const execute = process.argv.includes('--execute');
const confirmed = process.argv.includes('--confirm-production=SII-ISSSSPEA-PROD');
const production = DATABASE_ENVIRONMENTS.PRODUCCION;
const files = [
  '../database/migrations/20260816_verify_nomina_carga_tipo_vigente.sql',
  '../database/migrations/20260816_create_aportaciones_snapshot_v2.sql',
  '../database/migrations/20260816_verify_aportaciones_snapshot_v2.sql',
  '../database/migrations/20260817_create_snapshot_v2_decision.sql',
  '../database/migrations/20260817_verify_snapshot_v2_decision.sql',
  '../database/migrations/20260818_01_create_liquidacion_qna_snapshot.sql',
  '../database/migrations/20260818_02_create_liquidacion_qna_workflow.sql',
  '../database/migrations/20260818_03_create_retenciones_v3.sql',
  '../database/migrations/20260818_04_add_liquidacion_snapshot_links.sql',
  '../database/migrations/20260818_06_add_official_fund_totals.sql',
  '../database/migrations/20260818_07_allow_qna_v3_decision_policy.sql',
  '../database/migrations/20260818_05_verify_liquidacion_v3.sql',
] as const;

process.env.SQLSERVER_DB = production.sqlDatabase;
process.env.FIREBIRD_DATABASE = production.firebirdDatabase;
assertDatabaseEnvironment('PRODUCCION', process.env.SQLSERVER_DB, process.env.FIREBIRD_DATABASE);

if (execute && !confirmed) {
  throw new Error('CONFIRMACION_PRODUCCION_REQUERIDA:--confirm-production=SII-ISSSSPEA-PROD');
}

const { connectDatabase, closeDatabaseConnection } = await import('../src/db/mssql.js');
const pool = await connectDatabase();

try {
  const result = await pool.request().query('SELECT DB_NAME() AS BaseDatos');
  const databaseName = String(result.recordset[0]?.BaseDatos ?? '');
  if (databaseName !== production.sqlDatabase) throw new Error(`DESTINO_SQL_NO_PERMITIDO:${databaseName}`);

  const migrations = await Promise.all(files.map(async (file) => ({
    file,
    batches: (await readFile(new URL(file, import.meta.url), 'utf8'))
      .split(/^\s*GO\s*$/gim)
      .map((batch) => batch.trim())
      .filter(Boolean),
  })));
  if (!execute) {
    console.log(`PRODUCTION_DRY_RUN_OK: destino=${databaseName}; firebird=${production.firebirdDatabase}; archivos=${migrations.length}; lotes=${migrations.reduce((sum, item) => sum + item.batches.length, 0)}`);
  } else {
    for (const migration of migrations) {
      const transaction = new sql.Transaction(pool);
      await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
      try {
        for (const batch of migration.batches) await new sql.Request(transaction).batch(batch);
        await transaction.commit();
        console.log(`PRODUCTION_MIGRATION_OK:${migration.file}`);
      } catch (error) {
        await transaction.rollback().catch(() => undefined);
        throw new Error(`PRODUCTION_MIGRATION_FAILED:${migration.file}:${error instanceof Error ? error.message : String(error)}`);
      }
    }
    console.log(`PRODUCTION_LIQUIDACION_QNA_V3_MIGRATION_OK:${databaseName}`);
  }
} finally {
  await closeDatabaseConnection();
}
