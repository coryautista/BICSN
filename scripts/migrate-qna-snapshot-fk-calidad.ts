import sql from 'mssql';
import { DATABASE_ENVIRONMENTS, assertDatabaseEnvironment } from '../src/config/databaseEnvironments.js';

const EXECUTE = process.argv.includes('--execute');
const CONFIRMED = process.argv.includes('--confirm-quality=SII-ISSSSPEA');
const QUALITY = DATABASE_ENVIRONMENTS.CALIDAD;
const FK_NAME = 'FK_QnaSnapshot_SnapshotCalculoV2';

if (EXECUTE && !CONFIRMED) {
  throw new Error('CONFIRMACION_REQUERIDA:--confirm-quality=SII-ISSSSPEA');
}

process.env.SQLSERVER_DB = QUALITY.sqlDatabase;
process.env.FIREBIRD_DATABASE = QUALITY.firebirdDatabase;
assertDatabaseEnvironment('CALIDAD', process.env.SQLSERVER_DB, process.env.FIREBIRD_DATABASE);

async function inspect(pool: sql.ConnectionPool): Promise<Record<string, unknown>> {
  const result = await pool.request().query(`
    SELECT
      DB_NAME() AS BaseDatos,
      OBJECT_ID(N'aportaciones.SnapshotCalculoV2', N'U') AS SnapshotCalculoV2,
      OBJECT_ID(N'liquidacion.QnaSnapshot', N'U') AS QnaSnapshot,
      OBJECT_ID(N'liquidacion.${FK_NAME}', N'F') AS ForeignKeyId,
      COALESCE((
        SELECT is_disabled
        FROM sys.foreign_keys
        WHERE parent_object_id = OBJECT_ID(N'liquidacion.QnaSnapshot')
          AND name = N'${FK_NAME}'
      ), 0) AS ForeignKeyDisabled,
      COALESCE((
        SELECT is_not_trusted
        FROM sys.foreign_keys
        WHERE parent_object_id = OBJECT_ID(N'liquidacion.QnaSnapshot')
          AND name = N'${FK_NAME}'
      ), 0) AS ForeignKeyNotTrusted,
      (
        SELECT COUNT_BIG(1)
        FROM liquidacion.QnaSnapshot q
        LEFT JOIN aportaciones.SnapshotCalculoV2 s ON s.SnapshotId = q.SnapshotCalculoV2Id
        WHERE q.SnapshotCalculoV2Id IS NOT NULL
          AND s.SnapshotId IS NULL
      ) AS Huerfanos,
      (SELECT COUNT_BIG(1) FROM liquidacion.QnaSnapshot) AS Liquidaciones,
      (SELECT COUNT_BIG(1) FROM aportaciones.SnapshotCalculoV2) AS Snapshots;
  `);
  return result.recordset[0];
}

async function main(): Promise<void> {
  const { connectDatabase, closeDatabaseConnection } = await import('../src/db/mssql.js');
  const pool = await connectDatabase();

  try {
    const before = await inspect(pool);
    if (String(before.BaseDatos) !== QUALITY.sqlDatabase) {
      throw new Error(`DESTINO_SQL_NO_PERMITIDO:${before.BaseDatos}`);
    }
    if (before.SnapshotCalculoV2 == null || before.QnaSnapshot == null) {
      throw new Error('TABLAS_REQUERIDAS_INEXISTENTES');
    }
    if (Number(before.Huerfanos) !== 0) {
      throw new Error(`QNA_SNAPSHOT_CON_REFERENCIAS_HUERFANAS:${before.Huerfanos}`);
    }

    if (!EXECUTE) {
      console.log(JSON.stringify({
        environment: 'CALIDAD',
        sqlDatabase: QUALITY.sqlDatabase,
        firebirdDatabase: QUALITY.firebirdDatabase,
        execute: false,
        before
      }, null, 2));
      console.log('QNA_SNAPSHOT_FK_CALIDAD_DRY_RUN_OK');
      return;
    }

    const transaction = new sql.Transaction(pool);
    await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
    try {
      await new sql.Request(transaction).batch(`
        IF OBJECT_ID(N'liquidacion.${FK_NAME}', N'F') IS NULL
          ALTER TABLE liquidacion.QnaSnapshot WITH CHECK
            ADD CONSTRAINT ${FK_NAME}
            FOREIGN KEY (SnapshotCalculoV2Id)
            REFERENCES aportaciones.SnapshotCalculoV2 (SnapshotId);

        ALTER TABLE liquidacion.QnaSnapshot WITH CHECK
          CHECK CONSTRAINT ${FK_NAME};
      `);
      await transaction.commit();
    } catch (error) {
      await transaction.rollback().catch(() => undefined);
      throw error;
    }

    const after = await inspect(pool);
    if (after.ForeignKeyId == null) throw new Error('FOREIGN_KEY_NO_CREADA');
    if (Number(after.ForeignKeyDisabled) !== 0) throw new Error('FOREIGN_KEY_DESHABILITADA');
    if (Number(after.ForeignKeyNotTrusted) !== 0) throw new Error('FOREIGN_KEY_NO_CONFIABLE');
    if (Number(after.Huerfanos) !== 0) throw new Error('REFERENCIAS_HUERFANAS_POSTERIORES');

    console.log(JSON.stringify({
      environment: 'CALIDAD',
      sqlDatabase: QUALITY.sqlDatabase,
      firebirdDatabase: QUALITY.firebirdDatabase,
      execute: true,
      before,
      after
    }, null, 2));
    console.log('QNA_SNAPSHOT_FK_CALIDAD_MIGRATION_OK');
  } finally {
    await closeDatabaseConnection();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
