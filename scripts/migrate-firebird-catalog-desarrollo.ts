import sql from 'mssql';
import { readFile } from 'node:fs/promises';
import { DATABASE_ENVIRONMENTS, assertDatabaseEnvironment } from '../src/config/databaseEnvironments.js';

const execute = process.argv.includes('--execute');
const confirmed = process.argv.includes('--confirm-development=SII-ISSSSPEA-DES');
const development = DATABASE_ENVIRONMENTS.DESARROLLO;

if (execute && !confirmed) {
  throw new Error('CONFIRMACION_REQUERIDA:--confirm-development=SII-ISSSSPEA-DES');
}

process.env.SQLSERVER_DB = development.sqlDatabase;
process.env.FIREBIRD_DATABASE = development.firebirdDatabase;
assertDatabaseEnvironment('DESARROLLO', process.env.SQLSERVER_DB, process.env.FIREBIRD_DATABASE);

const files = [
  '../database/migrations/20260902_24_create_firebird_organica_credential.sql',
  '../database/migrations/20260902_25_verify_firebird_organica_credential.sql',
  '../database/migrations/20260913_26_add_firebird_organica_credential_rol_entidad.sql',
  '../database/migrations/20260913_27_verify_firebird_organica_credential_rol_entidad.sql',
] as const;

const { connectDatabase, closeDatabaseConnection } = await import('../src/db/mssql.js');
const pool = await connectDatabase();

try {
  const actualDatabase = String((await pool.request().query('SELECT DB_NAME() AS BaseDatos')).recordset[0].BaseDatos);
  if (actualDatabase !== development.sqlDatabase) throw new Error(`DESTINO_SQL_NO_PERMITIDO:${actualDatabase}`);

  const transaction = new sql.Transaction(pool);
  await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
  try {
    for (const file of files) {
      const source = await readFile(new URL(file, import.meta.url), 'utf8');
      for (const [index, batch] of source.split(/^\s*GO\s*$/gim).map((batch) => batch.trim()).filter(Boolean).entries()) {
        try {
          await new sql.Request(transaction).batch(batch);
        } catch (error) {
          const detail = error as { message?: string };
          throw new Error(`${file}:BATCH_${index + 1}:${detail.message ?? String(error)}`);
        }
      }
    }
    if (execute) {
      await transaction.commit();
      console.log('FIREBIRD_ORGANICA_CATALOG_MIGRATION_OK');
    } else {
      await transaction.rollback();
      console.log('FIREBIRD_ORGANICA_CATALOG_MIGRATION_DRY_RUN_OK');
    }
  } catch (error) {
    await transaction.rollback().catch(() => undefined);
    throw error;
  }
} finally {
  await closeDatabaseConnection();
}
