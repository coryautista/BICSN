import { DATABASE_ENVIRONMENTS, assertDatabaseEnvironment } from '../src/config/databaseEnvironments.js';

const QUALITY = DATABASE_ENVIRONMENTS.CALIDAD;
process.env.SQLSERVER_DB = QUALITY.sqlDatabase;
process.env.FIREBIRD_DATABASE = QUALITY.firebirdDatabase;
assertDatabaseEnvironment('CALIDAD', process.env.SQLSERVER_DB, process.env.FIREBIRD_DATABASE);

async function main(): Promise<void> {
  const { connectDatabase, closeDatabaseConnection } = await import('../src/db/mssql.js');
  const pool = await connectDatabase();

  try {
    const result = await pool.request().query(`
      WITH CalidadTablas AS (
        SELECT s.name AS Esquema, t.name AS Tabla
        FROM [SII-ISSSSPEA].sys.tables t
        JOIN [SII-ISSSSPEA].sys.schemas s ON s.schema_id = t.schema_id
      ), ProduccionTablas AS (
        SELECT s.name AS Esquema, t.name AS Tabla
        FROM [SII-ISSSSPEA-PROD].sys.tables t
        JOIN [SII-ISSSSPEA-PROD].sys.schemas s ON s.schema_id = t.schema_id
      ), CalidadColumnas AS (
        SELECT s.name AS Esquema, t.name AS Tabla, c.name AS Columna,
          ty.name AS Tipo, c.max_length AS Longitud, c.precision AS Precision,
          c.scale AS Escala, c.is_nullable AS Nullable, c.is_computed AS Computada
        FROM [SII-ISSSSPEA].sys.tables t
        JOIN [SII-ISSSSPEA].sys.schemas s ON s.schema_id = t.schema_id
        JOIN [SII-ISSSSPEA].sys.columns c ON c.object_id = t.object_id
        JOIN [SII-ISSSSPEA].sys.types ty ON ty.user_type_id = c.user_type_id
      ), ProduccionColumnas AS (
        SELECT s.name AS Esquema, t.name AS Tabla, c.name AS Columna,
          ty.name AS Tipo, c.max_length AS Longitud, c.precision AS Precision,
          c.scale AS Escala, c.is_nullable AS Nullable, c.is_computed AS Computada
        FROM [SII-ISSSSPEA-PROD].sys.tables t
        JOIN [SII-ISSSSPEA-PROD].sys.schemas s ON s.schema_id = t.schema_id
        JOIN [SII-ISSSSPEA-PROD].sys.columns c ON c.object_id = t.object_id
        JOIN [SII-ISSSSPEA-PROD].sys.types ty ON ty.user_type_id = c.user_type_id
      )
      SELECT
        DB_NAME() AS BaseDatos,
        (SELECT COUNT_BIG(1) FROM CalidadTablas) AS TablasCalidad,
        (SELECT COUNT_BIG(1) FROM ProduccionTablas) AS TablasProduccion,
        (SELECT COUNT_BIG(1) FROM (
          SELECT * FROM ProduccionTablas EXCEPT SELECT * FROM CalidadTablas
        ) x) AS TablasFaltantes,
        (SELECT COUNT_BIG(1) FROM (
          SELECT * FROM CalidadTablas EXCEPT SELECT * FROM ProduccionTablas
        ) x) AS TablasAdicionales,
        (SELECT COUNT_BIG(1) FROM (
          SELECT * FROM ProduccionColumnas EXCEPT SELECT * FROM CalidadColumnas
        ) x) AS ColumnasFaltantesODiferentes,
        (SELECT COUNT_BIG(1) FROM (
          SELECT * FROM CalidadColumnas EXCEPT SELECT * FROM ProduccionColumnas
        ) x) AS ColumnasAdicionalesODiferentes,
        (SELECT COUNT_BIG(1) FROM sys.foreign_keys
          WHERE parent_object_id = OBJECT_ID(N'liquidacion.QnaSnapshot')) AS QnaSnapshotForeignKeys,
        (SELECT COUNT_BIG(1) FROM sys.foreign_keys
          WHERE parent_object_id = OBJECT_ID(N'liquidacion.QnaSnapshot')
            AND (is_disabled = 1 OR is_not_trusted = 1)) AS QnaSnapshotForeignKeysInvalidas,
        (SELECT COUNT_BIG(1) FROM liquidacion.QnaSnapshot q
          LEFT JOIN aportaciones.SnapshotCalculoV2 s ON s.SnapshotId = q.SnapshotCalculoV2Id
          WHERE q.SnapshotCalculoV2Id IS NOT NULL AND s.SnapshotId IS NULL) AS Huerfanos,
        (SELECT COUNT_BIG(1) FROM aportaciones.FormulaCalculoVersion
          WHERE AnioVigencia = 2026
            AND PrecisionPolicy = 'MXN-BASE2-LEAF2-FUND2-APSFONDOS-v3'
            AND Estado = 'ACTIVA') AS FormulaV3Activa;
    `);

    const state = result.recordset[0];
    console.log(JSON.stringify({
      environment: 'CALIDAD',
      sqlDatabase: QUALITY.sqlDatabase,
      firebirdDatabase: QUALITY.firebirdDatabase,
      state
    }, null, 2));

    if (String(state.BaseDatos) !== QUALITY.sqlDatabase) throw new Error(`DESTINO_SQL_NO_PERMITIDO:${state.BaseDatos}`);
    if (Number(state.TablasCalidad) !== Number(state.TablasProduccion)) throw new Error('CONTEO_TABLAS_DIFERENTE');
    if (Number(state.TablasFaltantes) !== 0 || Number(state.TablasAdicionales) !== 0) throw new Error('DIFERENCIAS_TABLAS');
    if (Number(state.ColumnasFaltantesODiferentes) !== 0 || Number(state.ColumnasAdicionalesODiferentes) !== 0) throw new Error('DIFERENCIAS_COLUMNAS');
    if (Number(state.QnaSnapshotForeignKeys) !== 3) throw new Error(`QNA_SNAPSHOT_FK_INCOMPLETAS:${state.QnaSnapshotForeignKeys}`);
    if (Number(state.QnaSnapshotForeignKeysInvalidas) !== 0) throw new Error('QNA_SNAPSHOT_FK_INVALIDAS');
    if (Number(state.Huerfanos) !== 0) throw new Error(`REFERENCIAS_HUERFANAS:${state.Huerfanos}`);
    if (Number(state.FormulaV3Activa) !== 1) throw new Error(`FORMULA_V3_ACTIVA_INVALIDA:${state.FormulaV3Activa}`);

    console.log('QNA_V3_CALIDAD_SCHEMA_ALIGNED_OK');
  } finally {
    await closeDatabaseConnection();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
