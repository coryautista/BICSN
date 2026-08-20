import { readFile } from 'node:fs/promises';
import sql from 'mssql';
import { DATABASE_ENVIRONMENTS, assertDatabaseEnvironment } from '../src/config/databaseEnvironments.js';

const environmentArg = process.argv.find((arg) => arg.startsWith('--environment='))?.split('=')[1]?.toUpperCase();
if (environmentArg !== 'CALIDAD' && environmentArg !== 'PRODUCCION') {
  throw new Error('AMBIENTE_REQUERIDO:--environment=calidad|produccion');
}

const execute = process.argv.includes('--execute');
const target = DATABASE_ENVIRONMENTS[environmentArg];
const expectedConfirmation = environmentArg === 'CALIDAD'
  ? '--confirm-quality=SII-ISSSSPEA'
  : '--confirm-production=SII-ISSSSPEA-PROD';
if (execute && !process.argv.includes(expectedConfirmation)) {
  throw new Error(`CONFIRMACION_REQUERIDA:${expectedConfirmation}`);
}

process.env.SQLSERVER_DB = target.sqlDatabase;
process.env.FIREBIRD_DATABASE = target.firebirdDatabase;
assertDatabaseEnvironment(environmentArg, process.env.SQLSERVER_DB, process.env.FIREBIRD_DATABASE);

const migrationUrl = new URL('../database/migrations/20260819_08_add_snapshot_base_cotizacion_sueldo.sql', import.meta.url);
const batches = (await readFile(migrationUrl, 'utf8'))
  .split(/^\s*GO\s*$/gim)
  .map((batch) => batch.trim())
  .filter(Boolean);
const { connectDatabase, closeDatabaseConnection } = await import('../src/db/mssql.js');
const pool = await connectDatabase();

try {
  const databaseResult = await pool.request().query('SELECT DB_NAME() AS BaseDatos');
  const databaseName = String(databaseResult.recordset[0]?.BaseDatos ?? '');
  if (databaseName !== target.sqlDatabase) throw new Error(`DESTINO_SQL_NO_PERMITIDO:${databaseName}`);

  const countQuery = `
    SELECT
      COL_LENGTH(N'aportaciones.SnapshotCalculoV2Detalle', N'BaseCotizacionSueldoD6') AS LongitudColumna,
      (SELECT COUNT_BIG(1) FROM aportaciones.SnapshotCalculoV2) AS Snapshots,
      (SELECT COUNT_BIG(1) FROM aportaciones.SnapshotCalculoV2Detalle) AS Detalles;
  `;
  const before = (await pool.request().query(countQuery)).recordset[0];
  if (!execute) {
    console.log(JSON.stringify({ environment: environmentArg, databaseName, execute, batches: batches.length, before }, null, 2));
  } else {
    const transaction = new sql.Transaction(pool);
    await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
    try {
      for (const batch of batches) await new sql.Request(transaction).batch(batch);
      await transaction.commit();
    } catch (error) {
      await transaction.rollback().catch(() => undefined);
      throw error;
    }

    const after = (await pool.request().query(countQuery)).recordset[0];
    if (after.LongitudColumna === null) throw new Error('BASE_COTIZACION_SUELDO_D6_NO_CREADA');
    if (String(after.Snapshots) !== String(before.Snapshots) || String(after.Detalles) !== String(before.Detalles)) {
      throw new Error('CONTEOS_SNAPSHOT_MODIFICADOS');
    }
    console.log(JSON.stringify({ environment: environmentArg, databaseName, execute, before, after }, null, 2));
    console.log(`SNAPSHOT_BASE_COTIZACION_SUELDO_MIGRATION_OK:${environmentArg}`);
  }
} finally {
  await closeDatabaseConnection();
}
