import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sql, { type config as SqlConfig } from 'mssql';
import { env } from '../src/config/env.js';
import { DATABASE_ENVIRONMENTS } from '../src/config/databaseEnvironments.js';

const DATABASES = Object.entries(DATABASE_ENVIRONMENTS).map(([environment, config]) => ({
  environment,
  database: config.sqlDatabase
}));

const PROCEDURES = [
  'spGuardarIndividualesAhorroHistorico_Lote',
  'spGuardarIndividualesCairHistorico_Lote',
  'spGuardarIndividualesPrestacionesHistorico_Lote',
  'spGuardarIndividualesViviendaHistorico_Lote'
] as const;

const TABLE_TYPES = [
  'TVP_AhorroLoteDetalle_V2',
  'TVP_AhorroLoteHeader_V2',
  'TVP_CairLoteDetalle_V2',
  'TVP_CairLoteHeader_V2',
  'TVP_PrestacionesLoteDetalle_V2',
  'TVP_PrestacionesLoteHeader_V2',
  'TVP_ViviendaLoteDetalle_V2',
  'TVP_ViviendaLoteHeader_V2'
] as const;

const HISTORY_TABLES = [
  'IndividualesAhorroHistorico',
  'IndividualesCairHistorico',
  'IndividualesPrestacionesHistorico',
  'IndividualesViviendaHistorico',
  'ResumenHistorico'
] as const;

const normalizeDefinition = (value: unknown): string =>
  String(value ?? '').replace(/\r\n/g, '\n').replace(/[ \t]+$/gm, '').trim();

const sha256 = (value: unknown): string =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex').toUpperCase();

const sqlList = (values: readonly string[]) => values.map((value) => `'${value}'`).join(', ');

async function inspectDatabase(environment: string, database: string) {
  const config: SqlConfig = {
    server: env.sql.server,
    database,
    user: env.sql.user,
    password: env.sql.password,
    port: env.sql.port,
    options: env.sql.options,
    pool: { max: 1, min: 0, idleTimeoutMillis: 5000 }
  };
  const pool = await new sql.ConnectionPool(config).connect();

  try {
    const result = await pool.request().query(`
      SELECT
        SCHEMA_NAME(tt.schema_id) AS Esquema,
        tt.name AS TipoTabla,
        c.column_id AS Orden,
        c.name AS Columna,
        TYPE_NAME(c.user_type_id) AS Tipo,
        c.max_length AS Longitud,
        c.precision AS Precision,
        c.scale AS Escala,
        c.is_nullable AS PermiteNull
      FROM sys.table_types tt
      JOIN sys.columns c ON c.object_id = tt.type_table_object_id
      WHERE SCHEMA_NAME(tt.schema_id) = 'aportaciones'
        AND tt.name IN (${sqlList(TABLE_TYPES)})
      ORDER BY tt.name, c.column_id;

      SELECT
        SCHEMA_NAME(o.schema_id) AS Esquema,
        o.name AS Procedimiento,
        p.parameter_id AS Orden,
        p.name AS Parametro,
        TYPE_NAME(p.user_type_id) AS Tipo,
        p.max_length AS Longitud,
        p.precision AS Precision,
        p.scale AS Escala,
        p.is_output AS EsSalida
      FROM sys.objects o
      JOIN sys.parameters p ON p.object_id = o.object_id
      WHERE SCHEMA_NAME(o.schema_id) = 'aportaciones'
        AND o.name IN (${sqlList(PROCEDURES)})
      ORDER BY o.name, p.parameter_id;

      SELECT
        SCHEMA_NAME(o.schema_id) AS Esquema,
        o.name AS Procedimiento,
        OBJECT_DEFINITION(o.object_id) AS Definicion
      FROM sys.objects o
      WHERE SCHEMA_NAME(o.schema_id) = 'aportaciones'
        AND o.name IN (${sqlList(PROCEDURES)})
      ORDER BY o.name;

      SELECT
        s.name AS Esquema,
        t.name AS Tabla,
        c.column_id AS Orden,
        c.name AS Columna,
        TYPE_NAME(c.user_type_id) AS Tipo,
        c.max_length AS Longitud,
        c.precision AS Precision,
        c.scale AS Escala,
        c.is_nullable AS PermiteNull,
        c.is_identity AS EsIdentity
      FROM sys.tables t
      JOIN sys.schemas s ON s.schema_id = t.schema_id
      JOIN sys.columns c ON c.object_id = t.object_id
      WHERE s.name = 'aportaciones'
        AND t.name IN (${sqlList(HISTORY_TABLES)})
      ORDER BY t.name, c.column_id;

      SELECT
        OBJECT_NAME(i.object_id) AS Tabla,
        i.name AS Indice,
        i.is_unique AS EsUnico,
        i.type_desc AS Tipo,
        i.filter_definition AS Filtro,
        STRING_AGG(CONCAT(ic.key_ordinal, ':', c.name, ':', ic.is_included_column), '|')
          WITHIN GROUP (ORDER BY ic.key_ordinal, ic.index_column_id) AS Columnas
      FROM sys.indexes i
      JOIN sys.index_columns ic ON ic.object_id = i.object_id AND ic.index_id = i.index_id
      JOIN sys.columns c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
      WHERE i.object_id IN (
        SELECT t.object_id
        FROM sys.tables t
        JOIN sys.schemas s ON s.schema_id = t.schema_id
        WHERE s.name = 'aportaciones' AND t.name IN (${sqlList(HISTORY_TABLES)})
      )
        AND i.is_hypothetical = 0
      GROUP BY i.object_id, i.name, i.is_unique, i.type_desc, i.filter_definition
      ORDER BY Tabla, Indice;
    `);

    const sets = result.recordsets as Array<Array<Record<string, unknown>>>;
    const typeNames = new Set(sets[0].map((row) => String(row.TipoTabla)));
    const procedureNames = new Set(sets[2].map((row) => String(row.Procedimiento)));
    const tableNames = new Set(sets[3].map((row) => String(row.Tabla)));

    const missingTypes = TABLE_TYPES.filter((name) => !typeNames.has(name));
    const missingProcedures = PROCEDURES.filter((name) => !procedureNames.has(name));
    const missingTables = HISTORY_TABLES.filter((name) => !tableNames.has(name));
    if (missingTypes.length || missingProcedures.length || missingTables.length) {
      throw new Error(`${environment}: objetos faltantes: ${[
        ...missingTypes,
        ...missingProcedures,
        ...missingTables
      ].join(', ')}`);
    }

    const contract = {
      tableTypes: sets[0],
      procedureParameters: sets[1],
      procedures: sets[2].map((row) => ({
        schema: row.Esquema,
        name: row.Procedimiento,
        definition: normalizeDefinition(row.Definicion)
      })),
      historyTables: sets[3],
      historyIndexes: sets[4]
    };

    return {
      environment,
      database,
      counts: {
        tableTypes: typeNames.size,
        procedures: procedureNames.size,
        historyTables: tableNames.size
      },
      hash: sha256(contract),
      contract
    };
  } finally {
    await pool.close();
  }
}

async function main(): Promise<void> {
  const inspections = [];
  for (const target of DATABASES) {
    inspections.push(await inspectDatabase(target.environment, target.database));
  }

  const expectedHash = inspections[0].hash;
  const differences = inspections.filter((item) => item.hash !== expectedHash);
  if (differences.length > 0) {
    console.log(JSON.stringify(inspections.map(({ contract: _, ...item }) => item), null, 2));
    throw new Error(`HISTORICO_CONTRACT_PARITY_FAILED: ${differences.map((item) => item.environment).join(', ')}`);
  }

  const baseline = {
    schemaVersion: 1,
    contractId: 'APORTACIONES-HISTORICO-V2',
    hash: expectedHash,
    environments: inspections.map(({ environment, database, counts, hash }) => ({
      environment,
      database,
      counts,
      hash
    })),
    contract: inspections[0].contract
  };

  const outputDirectory = new URL('./fixtures/aportaciones/', import.meta.url);
  const output = new URL('./fixtures/aportaciones/historico-contracts.golden.json', import.meta.url);
  await mkdir(fileURLToPath(outputDirectory), { recursive: true });
  await writeFile(fileURLToPath(output), `${JSON.stringify(baseline, null, 2)}\n`, 'utf8');

  console.log(JSON.stringify(baseline.environments, null, 2));
  console.log(`HISTORICO_CONTRACT_PARITY_OK ${expectedHash}`);
  console.log(`Baseline generado: ${fileURLToPath(output)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
