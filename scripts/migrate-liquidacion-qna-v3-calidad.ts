import { readFile } from 'node:fs/promises';
import sql from 'mssql';
import { DATABASE_ENVIRONMENTS, assertDatabaseEnvironment } from '../src/config/databaseEnvironments.js';

const EXECUTE = process.argv.includes('--execute');
const QUALITY = DATABASE_ENVIRONMENTS.CALIDAD;
const FILES = [
  '../database/migrations/20260818_01_create_liquidacion_qna_snapshot.sql',
  '../database/migrations/20260818_02_create_liquidacion_qna_workflow.sql',
  '../database/migrations/20260818_03_create_retenciones_v3.sql',
  '../database/migrations/20260818_04_add_liquidacion_snapshot_links.sql',
  '../database/migrations/20260818_06_add_official_fund_totals.sql',
  '../database/migrations/20260818_07_allow_qna_v3_decision_policy.sql',
  '../database/migrations/20260818_05_verify_liquidacion_v3.sql',
] as const;

process.env.SQLSERVER_DB = QUALITY.sqlDatabase;
process.env.FIREBIRD_DATABASE = QUALITY.firebirdDatabase;
assertDatabaseEnvironment('CALIDAD', process.env.SQLSERVER_DB, process.env.FIREBIRD_DATABASE);

async function main(): Promise<void> {
  const { connectDatabase, closeDatabaseConnection } = await import('../src/db/mssql.js');
  const pool = await connectDatabase();
  try {
    const result = await pool.request().query('SELECT DB_NAME() AS BaseDatos');
    const databaseName = String(result.recordset[0]?.BaseDatos ?? '');
    if (databaseName !== QUALITY.sqlDatabase) throw new Error(`DESTINO_SQL_NO_PERMITIDO:${databaseName}`);

    const migrations = await Promise.all(FILES.map(async (file) => ({
      file,
      batches: (await readFile(new URL(file, import.meta.url), 'utf8'))
        .split(/^\s*GO\s*$/gim)
        .map((batch) => batch.trim())
        .filter(Boolean),
    })));
    if (!EXECUTE) {
      console.log(`DRY_RUN_OK: destino=${databaseName}; archivos=${migrations.length}; lotes=${migrations.reduce((sum, item) => sum + item.batches.length, 0)}`);
      return;
    }

    for (const migration of migrations) {
      const transaction = new sql.Transaction(pool);
      await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
      try {
        for (const batch of migration.batches) await new sql.Request(transaction).batch(batch);
        await transaction.commit();
        console.log(`MIGRATION_OK:${migration.file}`);
      } catch (error) {
        await transaction.rollback().catch(() => undefined);
        throw new Error(`MIGRATION_FAILED:${migration.file}:${error instanceof Error ? error.message : String(error)}`);
      }
    }
    console.log(`LIQUIDACION_QNA_V3_MIGRATION_OK:${databaseName}`);
  } finally {
    await closeDatabaseConnection();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
