import { DATABASE_ENVIRONMENTS, assertDatabaseEnvironment } from '../src/config/databaseEnvironments.js';

const DEVELOPMENT = DATABASE_ENVIRONMENTS.DESARROLLO;
process.env.SQLSERVER_DB = DEVELOPMENT.sqlDatabase;
process.env.FIREBIRD_DATABASE = DEVELOPMENT.firebirdDatabase;
assertDatabaseEnvironment(
  'DESARROLLO',
  process.env.SQLSERVER_DB,
  process.env.FIREBIRD_DATABASE
);

type DatabaseName = 'SII-ISSSSPEA-DES' | 'SII-ISSSSPEA-PROD';

function difference(reference: Set<string>, actual: Set<string>): string[] {
  return [...reference].filter((value) => !actual.has(value)).sort();
}

async function getTables(pool: any, database: DatabaseName): Promise<Set<string>> {
  const result = await pool.request().query(`
    SELECT s.name AS Esquema, t.name AS Tabla
    FROM [${database}].sys.tables t
    JOIN [${database}].sys.schemas s ON s.schema_id = t.schema_id;
  `);
  return new Set(result.recordset.map((row: any) => `${row.Esquema}.${row.Tabla}`));
}

async function getColumns(pool: any, database: DatabaseName): Promise<Set<string>> {
  const result = await pool.request().query(`
    SELECT s.name AS Esquema, t.name AS Tabla, c.name AS Columna,
      ty.name AS Tipo, c.max_length AS Longitud, c.precision AS Precision,
      c.scale AS Escala, c.is_nullable AS Nullable, c.is_computed AS Computada
    FROM [${database}].sys.tables t
    JOIN [${database}].sys.schemas s ON s.schema_id = t.schema_id
    JOIN [${database}].sys.columns c ON c.object_id = t.object_id
    JOIN [${database}].sys.types ty ON ty.user_type_id = c.user_type_id;
  `);
  return new Set(result.recordset.map((row: any) => [
    row.Esquema,
    row.Tabla,
    row.Columna,
    row.Tipo,
    row.Longitud,
    row.Precision,
    row.Escala,
    row.Nullable,
    row.Computada
  ].join('|')));
}

async function getProgramObjects(pool: any, database: DatabaseName): Promise<Set<string>> {
  const result = await pool.request().query(`
    SELECT s.name AS Esquema, o.name AS Objeto, o.type_desc AS Tipo
    FROM [${database}].sys.objects o
    JOIN [${database}].sys.schemas s ON s.schema_id = o.schema_id
    WHERE o.is_ms_shipped = 0
      AND s.name IN (N'aportaciones', N'liquidacion', N'retenciones')
      AND o.type IN ('P', 'V', 'FN', 'IF', 'TF')
    UNION ALL
    SELECT s.name, tt.name, N'USER_TABLE_TYPE'
    FROM [${database}].sys.table_types tt
    JOIN [${database}].sys.schemas s ON s.schema_id = tt.schema_id
    WHERE s.name IN (N'aportaciones', N'liquidacion', N'retenciones');
  `);
  return new Set(result.recordset.map((row: any) => `${row.Esquema}|${row.Tipo}|${row.Objeto}`));
}

async function getStableSchemaObjects(pool: any, database: DatabaseName): Promise<Set<string>> {
  const result = await pool.request().query(`
    SELECT s.name AS Esquema, t.name AS Tabla, i.name AS Objeto, N'INDEX' AS Tipo
    FROM [${database}].sys.tables t
    JOIN [${database}].sys.schemas s ON s.schema_id = t.schema_id
    JOIN [${database}].sys.indexes i ON i.object_id = t.object_id
    WHERE i.name IS NOT NULL
      AND i.is_hypothetical = 0
      AND i.name NOT LIKE N'PK[_][_]%%'
      AND i.name NOT LIKE N'UQ[_][_]%%'
    UNION ALL
    SELECT s.name, t.name, o.name, o.type_desc
    FROM [${database}].sys.tables t
    JOIN [${database}].sys.schemas s ON s.schema_id = t.schema_id
    JOIN [${database}].sys.objects o ON o.parent_object_id = t.object_id
    WHERE o.type IN ('F', 'C', 'UQ', 'TR')
      AND o.name NOT LIKE N'PK[_][_]%%'
      AND o.name NOT LIKE N'UQ[_][_]%%'
      AND o.name NOT LIKE N'CK[_][_]%%'
      AND o.name NOT LIKE N'FK[_][_]%%';
  `);
  return new Set(result.recordset.map((row: any) => `${row.Esquema}.${row.Tabla}|${row.Tipo}|${row.Objeto}`));
}

async function main(): Promise<void> {
  const { connectDatabase, closeDatabaseConnection } = await import('../src/db/mssql.js');
  const pool = await connectDatabase();

  try {
    const databaseResult = await pool.request().query('SELECT DB_NAME() AS BaseDatos;');
    const databaseName = String(databaseResult.recordset[0]?.BaseDatos ?? '');
    if (databaseName !== DEVELOPMENT.sqlDatabase) {
      throw new Error(`DESTINO_SQL_NO_PERMITIDO:${databaseName}`);
    }

    const [developmentTables, productionTables, developmentColumns, productionColumns,
      developmentPrograms, productionPrograms, developmentObjects, productionObjects] = await Promise.all([
      getTables(pool, 'SII-ISSSSPEA-DES'),
      getTables(pool, 'SII-ISSSSPEA-PROD'),
      getColumns(pool, 'SII-ISSSSPEA-DES'),
      getColumns(pool, 'SII-ISSSSPEA-PROD'),
      getProgramObjects(pool, 'SII-ISSSSPEA-DES'),
      getProgramObjects(pool, 'SII-ISSSSPEA-PROD'),
      getStableSchemaObjects(pool, 'SII-ISSSSPEA-DES'),
      getStableSchemaObjects(pool, 'SII-ISSSSPEA-PROD')
    ]);

    const formulaResult = await pool.request().query(`
      SELECT FormulaCalculoVersionId, NumeroVersion, PrecisionPolicy, Estado
      FROM aportaciones.FormulaCalculoVersion
      WHERE AnioVigencia = 2026
      ORDER BY NumeroVersion;
    `);
    const activeV3 = formulaResult.recordset.filter((row: any) =>
      row.PrecisionPolicy === 'MXN-BASE2-LEAF2-FUND2-APSFONDOS-v3'
      && row.Estado === 'ACTIVA'
    );

    const result = {
      environment: 'DESARROLLO',
      sqlDatabase: databaseName,
      firebirdDatabase: DEVELOPMENT.firebirdDatabase,
      tables: {
        desarrollo: developmentTables.size,
        produccion: productionTables.size,
        faltan: difference(productionTables, developmentTables),
        adicionales: difference(developmentTables, productionTables)
      },
      columns: {
        faltanODifieren: difference(productionColumns, developmentColumns),
        adicionalesODifieren: difference(developmentColumns, productionColumns)
      },
      programObjects: {
        faltan: difference(productionPrograms, developmentPrograms),
        adicionales: difference(developmentPrograms, productionPrograms)
      },
      stableSchemaObjects: {
        faltan: difference(productionObjects, developmentObjects),
        adicionales: difference(developmentObjects, productionObjects)
      },
      formulas2026: formulaResult.recordset
    };

    console.log(JSON.stringify(result, null, 2));

    if (result.tables.faltan.length || result.tables.adicionales.length) {
      throw new Error('DIFERENCIAS_TABLAS_DESARROLLO_PRODUCCION');
    }
    if (result.columns.faltanODifieren.length || result.columns.adicionalesODifieren.length) {
      throw new Error('DIFERENCIAS_COLUMNAS_DESARROLLO_PRODUCCION');
    }
    if (result.programObjects.faltan.length || result.programObjects.adicionales.length) {
      throw new Error('DIFERENCIAS_OBJETOS_PROGRAMABLES_DESARROLLO_PRODUCCION');
    }
    if (result.stableSchemaObjects.faltan.length || result.stableSchemaObjects.adicionales.length) {
      throw new Error('DIFERENCIAS_OBJETOS_ESQUEMA_DESARROLLO_PRODUCCION');
    }
    if (activeV3.length !== 1) throw new Error(`FORMULA_V3_ACTIVA_INVALIDA:${activeV3.length}`);

    console.log('QNA_V3_DESARROLLO_SCHEMA_ALIGNED_OK');
  } finally {
    await closeDatabaseConnection();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
