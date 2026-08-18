import { readFile } from 'node:fs/promises';
import { DATABASE_ENVIRONMENTS, assertDatabaseEnvironment } from '../src/config/databaseEnvironments.js';

const EXECUTE = process.argv.includes('--execute');
const QUALITY = DATABASE_ENVIRONMENTS.CALIDAD;

process.env.SQLSERVER_DB = QUALITY.sqlDatabase;
process.env.FIREBIRD_DATABASE = QUALITY.firebirdDatabase;
assertDatabaseEnvironment('CALIDAD', process.env.SQLSERVER_DB, process.env.FIREBIRD_DATABASE);

async function main(): Promise<void> {
  const { connectDatabase, closeDatabaseConnection } = await import('../src/db/mssql.js');
  const pool = await connectDatabase();
  try {
    const databaseResult = await pool.request().query('SELECT DB_NAME() AS BaseDatos');
    const databaseName = String(databaseResult.recordset[0]?.BaseDatos ?? '');
    if (databaseName !== QUALITY.sqlDatabase) throw new Error(`DESTINO_SQL_NO_PERMITIDO:${databaseName}`);

    if (!EXECUTE) {
      console.log(`DRY_RUN_OK: destino=${databaseName}; use --execute para aplicar la migracion aditiva.`);
      return;
    }

    for (const file of [
      '../database/migrations/20260816_create_aportaciones_snapshot_v2.sql',
      '../database/migrations/20260816_verify_aportaciones_snapshot_v2.sql',
      '../database/migrations/20260817_create_snapshot_v2_decision.sql',
      '../database/migrations/20260817_verify_snapshot_v2_decision.sql'
    ]) {
      const source = await readFile(new URL(file, import.meta.url), 'utf8');
      const batches = source.split(/^\s*GO\s*$/gim).map((batch) => batch.trim()).filter(Boolean);
      for (const batch of batches) await pool.request().batch(batch);
    }
    console.log('APORTACIONES_SNAPSHOT_V2_MIGRATION_OK');
  } finally {
    await closeDatabaseConnection();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
