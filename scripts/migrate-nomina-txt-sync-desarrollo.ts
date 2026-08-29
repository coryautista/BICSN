import { readFile } from 'node:fs/promises';
import sql from 'mssql';
import { DATABASE_ENVIRONMENTS, assertDatabaseEnvironment } from '../src/config/databaseEnvironments.js';

const execute = process.argv.includes('--execute');
const confirmed = process.argv.includes('--confirm-development=SII-ISSSSPEA-DES');
if (execute && !confirmed) throw new Error('CONFIRMACION_REQUERIDA');
const development = DATABASE_ENVIRONMENTS.DESARROLLO;
process.env.SQLSERVER_DB = development.sqlDatabase;
process.env.FIREBIRD_DATABASE = development.firebirdDatabase;
assertDatabaseEnvironment('DESARROLLO', process.env.SQLSERVER_DB, process.env.FIREBIRD_DATABASE);

const { connectDatabase, closeDatabaseConnection } = await import('../src/db/mssql.js');
const pool = await connectDatabase();
const files = [
  '../database/migrations/20260827_20_create_nomina_txt_sync_ledger_staging.sql',
  '../database/migrations/20260827_21_verify_nomina_txt_sync_ledger_staging.sql',
];

try {
  const sources = await Promise.all(files.map((file) => readFile(new URL(file, import.meta.url), 'utf8')));
  const transaction = new sql.Transaction(pool);
  await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
  try {
    for (const source of sources) {
      for (const batch of source.split(/^\s*GO\s*$/gim).map((value) => value.trim()).filter(Boolean)) {
        await new sql.Request(transaction).batch(batch);
      }
    }
    if (execute) {
      await transaction.commit();
      console.log('NOMINA_TXT_SYNC_MIGRATION_DESARROLLO_OK');
    } else {
      await transaction.rollback();
      console.log('NOMINA_TXT_SYNC_MIGRATION_ROLLBACK_DESARROLLO_OK');
    }
  } catch (error) {
    await transaction.rollback().catch(() => undefined);
    throw error;
  }
} finally {
  await closeDatabaseConnection();
}
