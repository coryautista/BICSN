import { createHash } from 'node:crypto';
import { DATABASE_ENVIRONMENTS, assertDatabaseEnvironment } from '../src/config/databaseEnvironments.js';

const development = DATABASE_ENVIRONMENTS.DESARROLLO;
process.env.SQLSERVER_DB = development.sqlDatabase;
process.env.FIREBIRD_DATABASE = development.firebirdDatabase;
assertDatabaseEnvironment('DESARROLLO', process.env.SQLSERVER_DB, process.env.FIREBIRD_DATABASE);

const tables = [
  'aportaciones.IndividualesAhorroHistorico',
  'aportaciones.IndividualesViviendaHistorico',
  'aportaciones.IndividualesPrestacionesHistorico',
  'aportaciones.IndividualesCairHistorico',
  'aportaciones.PensionNominaTransitorioHistorico',
  'aportaciones.GuarderiasHistorico',
  'aportaciones.AguinaldoHistorico',
  'aportaciones.DetalleHistoricoAguinaldo',
  'retenciones.PrestamosCortoPlazoHistorico',
  'retenciones.PrestamosMedianoPlazoHistorico',
  'retenciones.PrestamosHipotecariosHistorico',
  'aportaciones.ResumenHistorico',
  'conciliacion.RevisionAplicacionHistorico'
] as const;

async function main(): Promise<void> {
  const { connectDatabase, closeDatabaseConnection } = await import('../src/db/mssql.js');
  const pool = await connectDatabase();
  try {
    const database = String((await pool.request().query('SELECT DB_NAME() AS BaseDatos')).recordset[0].BaseDatos);
    if (database !== development.sqlDatabase) throw new Error(`DESTINO_SQL_NO_PERMITIDO:${database}`);

    const values = tables.map((table) => `(N'${table}')`).join(',');
    const result = await pool.request().query(`
      SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;
      DECLARE @T TABLE (Nombre SYSNAME NOT NULL);
      INSERT @T VALUES ${values};

      SELECT DB_NAME() AS BaseDatos,t.Nombre AS Tabla,o.object_id AS ObjectId
      FROM @T t LEFT JOIN sys.objects o ON o.object_id=OBJECT_ID(t.Nombre)
      ORDER BY t.Nombre;

      SELECT CONCAT(OBJECT_SCHEMA_NAME(c.object_id),N'.',OBJECT_NAME(c.object_id)) AS Tabla,
        c.column_id AS Orden,c.name AS Columna,ty.name AS Tipo,c.max_length AS Longitud,
        c.precision AS Precision,c.scale AS Escala,c.is_nullable AS Nullable,c.is_identity AS Identidad,
        c.is_computed AS Calculada,
        dc.definition AS Predeterminado
      FROM sys.columns c
      JOIN sys.types ty ON ty.user_type_id=c.user_type_id
      LEFT JOIN sys.default_constraints dc ON dc.parent_object_id=c.object_id AND dc.parent_column_id=c.column_id
      WHERE EXISTS(SELECT 1 FROM @T t WHERE OBJECT_ID(t.Nombre)=c.object_id)
      ORDER BY Tabla,c.column_id;

      SELECT CONCAT(OBJECT_SCHEMA_NAME(i.object_id),N'.',OBJECT_NAME(i.object_id)) AS Tabla,
        i.name AS Indice,i.is_primary_key AS Primaria,i.is_unique AS Unico,i.has_filter AS Filtrado,
        i.filter_definition AS Filtro,
        STRING_AGG(CONVERT(NVARCHAR(MAX),CONCAT(ic.key_ordinal,N':',c.name,N':',ic.is_included_column)),N'|')
          WITHIN GROUP(ORDER BY ic.key_ordinal,ic.index_column_id) AS Columnas
      FROM sys.indexes i
      JOIN sys.index_columns ic ON ic.object_id=i.object_id AND ic.index_id=i.index_id
      JOIN sys.columns c ON c.object_id=ic.object_id AND c.column_id=ic.column_id
      WHERE EXISTS(SELECT 1 FROM @T t WHERE OBJECT_ID(t.Nombre)=i.object_id)
      GROUP BY i.object_id,i.name,i.is_primary_key,i.is_unique,i.has_filter,i.filter_definition
      ORDER BY Tabla,i.name;

      SELECT CONCAT(OBJECT_SCHEMA_NAME(m.object_id),N'.',OBJECT_NAME(m.object_id)) AS Modulo,
        o.type_desc AS Tipo,CONVERT(VARCHAR(64),HASHBYTES('SHA2_256',CONVERT(VARBINARY(MAX),m.definition)),2) AS DefinicionHash,
        (SELECT STRING_AGG(CONVERT(NVARCHAR(MAX),CONCAT(p.parameter_id,N':',p.name,N':',TYPE_NAME(p.user_type_id),N':',p.max_length,N':',p.precision,N':',p.scale,N':',p.is_output,N':',p.is_readonly)),N'|')
          WITHIN GROUP(ORDER BY p.parameter_id) FROM sys.parameters p WHERE p.object_id=m.object_id) AS Parametros
      FROM sys.sql_modules m JOIN sys.objects o ON o.object_id=m.object_id
      WHERE EXISTS(SELECT 1 FROM @T t WHERE m.definition LIKE N'%'+PARSENAME(t.Nombre,1)+N'%')
      ORDER BY Modulo;

      SELECT CONCAT(OBJECT_SCHEMA_NAME(cc.parent_object_id),N'.',OBJECT_NAME(cc.parent_object_id)) AS Tabla,
        cc.name AS Restriccion,cc.definition AS Definicion
      FROM sys.check_constraints cc
      WHERE EXISTS(SELECT 1 FROM @T t WHERE OBJECT_ID(t.Nombre)=cc.parent_object_id)
      ORDER BY Tabla,cc.name;
    `);

    const sets = result.recordsets as unknown as Array<Array<Record<string, unknown>>>;
    const inventory = {
      environment: 'DESARROLLO',
      sqlDatabase: database,
      firebirdDatabase: development.firebirdDatabase,
      objects: sets[0],
      columns: columnSignatures(sets[1]),
      indexes: sets[2],
      modules: sets[3],
      constraints: sets[4]
    };
    console.log(JSON.stringify(process.argv.includes('--computed-only')
      ? { environment: inventory.environment, sqlDatabase: inventory.sqlDatabase, columns: inventory.columns.map(({ table, computed }) => ({ table, computed })) }
      : inventory, null, 2));
    console.log('QNA_PHASE8_LEGACY_INVENTORY_DESARROLLO_READONLY_OK');
  } finally {
    await closeDatabaseConnection();
  }
}

function columnSignatures(columns: Array<Record<string, unknown>>): Array<Record<string, string>> {
  const grouped = new Map<string, Array<Record<string, unknown>>>();
  for (const column of columns) {
    const table = String(column.Tabla);
    grouped.set(table, [...(grouped.get(table) ?? []), column]);
  }
  return [...grouped].map(([table, tableColumns]) => {
    const signature = tableColumns.map((column) => `${column.Orden}:${column.Columna}:${column.Tipo}:${column.Longitud}:${column.Precision}:${column.Escala}:${Number(column.Nullable)}:${Number(column.Identidad)}`).join('|');
    return {
      table,
      signature,
      signatureHash: createHash('sha256').update(signature).digest('hex').toUpperCase(),
      computed: tableColumns.filter((column) => Boolean(column.Calculada)).map((column) => String(column.Columna)).join('|')
    };
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
