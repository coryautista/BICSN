import sql from 'mssql';
import { readFile } from 'node:fs/promises';
import { DATABASE_ENVIRONMENTS, assertDatabaseEnvironment } from '../src/config/databaseEnvironments.js';

const execute = process.argv.includes('--execute');
const confirmed = process.argv.includes('--confirm-quality=SII-ISSSSPEA');
const backupReference = (
  process.argv.find((argument) => argument.startsWith('--backup-reference='))?.split('=', 2)[1]
  ?? process.argv.slice(2).find((argument) => !argument.startsWith('--'))
)?.trim();
const quality = DATABASE_ENVIRONMENTS.CALIDAD;

if (execute && !confirmed) {
  throw new Error('CONFIRMACION_REQUERIDA:--confirm-quality=SII-ISSSSPEA');
}
if (execute && !backupReference) {
  throw new Error('RESPALDO_REQUERIDO: proporcione la referencia verificable como argumento final');
}

process.env.SQLSERVER_DB = quality.sqlDatabase;
process.env.FIREBIRD_DATABASE = quality.firebirdDatabase;
assertDatabaseEnvironment('CALIDAD', process.env.SQLSERVER_DB, process.env.FIREBIRD_DATABASE);

const files = [
  '../database/migrations/20260902_24_create_firebird_organica_credential.sql',
  '../database/migrations/20260902_25_verify_firebird_organica_credential.sql',
] as const;

const { connectDatabase, closeDatabaseConnection } = await import('../src/db/mssql.js');
const pool = await connectDatabase();

try {
  const actualDatabase = String((await pool.request().query('SELECT DB_NAME() AS BaseDatos')).recordset[0].BaseDatos);
  if (actualDatabase !== quality.sqlDatabase) throw new Error(`DESTINO_SQL_NO_PERMITIDO:${actualDatabase}`);

  const transaction = new sql.Transaction(pool);
  await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
  try {
    const lock = await new sql.Request(transaction).query(`
      DECLARE @Result INT;
      EXEC @Result=sys.sp_getapplock
        @Resource=N'BICSN_CALIDAD_FIREBIRD_CATALOG_24_25',
        @LockMode=N'Exclusive',@LockOwner=N'Transaction',@LockTimeout=0;
      SELECT @Result AS LockResult;
    `);
    if (Number(lock.recordset[0]?.LockResult) < 0) throw new Error('CALIDAD_FIREBIRD_CATALOG_MIGRATION_LOCK_UNAVAILABLE');

    for (const file of files) {
      const source = await readFile(new URL(file, import.meta.url), 'utf8');
      for (const [index, batch] of source.split(/^\s*GO\s*$/gim).map((value) => value.trim()).filter(Boolean).entries()) {
        try {
          await new sql.Request(transaction).batch(batch);
        } catch (error) {
          const detail = error as { message?: string };
          throw new Error(`${file}:BATCH_${index + 1}:${detail.message ?? String(error)}`);
        }
      }
    }

    const evidence = {
      environment: 'CALIDAD',
      sqlDatabase: quality.sqlDatabase,
      firebirdDatabase: quality.firebirdDatabase,
      firebirdModified: false,
      execute,
      backupReference: backupReference ?? null,
      migrations: files.map((file) => file.replace('../database/migrations/', '')),
    };
    if (execute) {
      await transaction.commit();
      console.log(JSON.stringify(evidence, null, 2));
      console.log('CALIDAD_FIREBIRD_ORGANICA_CATALOG_MIGRATION_OK');
    } else {
      await transaction.rollback();
      console.log(JSON.stringify(evidence, null, 2));
      console.log('CALIDAD_FIREBIRD_ORGANICA_CATALOG_MIGRATION_DRY_RUN_OK');
    }
  } catch (error) {
    await transaction.rollback().catch(() => undefined);
    throw error;
  }
} finally {
  await closeDatabaseConnection();
}
