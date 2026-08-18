import { createHash } from 'node:crypto';
import sql, { type config as SqlConfig } from 'mssql';
import { env } from '../src/config/env.js';
import { DATABASE_ENVIRONMENTS } from '../src/config/databaseEnvironments.js';

const DATABASES = Object.entries(DATABASE_ENVIRONMENTS).map(([environment, config]) => ({
  environment,
  database: config.sqlDatabase
}));

const sha256 = (value: unknown): string =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex').toUpperCase();

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
        DB_NAME() AS BaseDatos,
        OBJECT_ID('aportaciones.FormulaCalculoVersion', 'U') AS TablaVersion,
        OBJECT_ID('aportaciones.FormulaCalculoParametro', 'U') AS TablaParametro,
        OBJECT_ID('aportaciones.spObtenerFormulaCalculoPeriodo', 'P') AS SpResolver,
        OBJECT_ID('aportaciones.spClonarFormulaCalculoVersion', 'P') AS SpClonar;

      SELECT
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
        AND t.name IN ('FormulaCalculoVersion', 'FormulaCalculoParametro')
      ORDER BY t.name, c.column_id;

      SELECT
        OBJECT_NAME(cc.parent_object_id) AS Tabla,
        cc.name AS Restriccion,
        cc.definition AS Definicion
      FROM sys.check_constraints cc
      WHERE cc.parent_object_id IN (
        OBJECT_ID('aportaciones.FormulaCalculoVersion'),
        OBJECT_ID('aportaciones.FormulaCalculoParametro')
      )
      ORDER BY Tabla, Restriccion;

      SELECT
        OBJECT_NAME(i.object_id) AS Tabla,
        i.name AS Indice,
        i.is_unique AS EsUnico,
        i.type_desc AS Tipo,
        STRING_AGG(CONCAT(ic.key_ordinal, ':', c.name), '|')
          WITHIN GROUP (ORDER BY ic.key_ordinal) AS Columnas
      FROM sys.indexes i
      JOIN sys.index_columns ic ON ic.object_id = i.object_id AND ic.index_id = i.index_id
      JOIN sys.columns c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
      WHERE i.object_id IN (
        OBJECT_ID('aportaciones.FormulaCalculoVersion'),
        OBJECT_ID('aportaciones.FormulaCalculoParametro')
      )
        AND i.is_hypothetical = 0
      GROUP BY i.object_id, i.name, i.is_unique, i.type_desc
      ORDER BY Tabla, Indice;

      SELECT
        o.name AS Procedimiento,
        REPLACE(REPLACE(OBJECT_DEFINITION(o.object_id), CHAR(13), ''), CHAR(10), '') AS Definicion
      FROM sys.objects o
      JOIN sys.schemas s ON s.schema_id = o.schema_id
      WHERE s.name = 'aportaciones'
        AND o.name IN ('spObtenerFormulaCalculoPeriodo', 'spClonarFormulaCalculoVersion')
      ORDER BY o.name;

      SELECT
        v.ClaveFormula,
        v.AnioVigencia,
        v.NumeroVersion,
        v.QuincenaDesde,
        v.QuincenaHasta,
        v.PrecisionPolicy,
        v.Estado,
        p.ClaveParametro,
        CONVERT(VARCHAR(40), p.Valor) AS Valor,
        p.Unidad,
        p.Fuente,
        p.Observaciones
      FROM aportaciones.FormulaCalculoVersion v
      JOIN aportaciones.FormulaCalculoParametro p
        ON p.FormulaCalculoVersionId = v.FormulaCalculoVersionId
      WHERE v.ClaveFormula = 'APORTACIONES-NOMINA'
        AND v.AnioVigencia = 2026
        AND v.Estado = 'ACTIVA'
      ORDER BY v.NumeroVersion, p.ClaveParametro;
    `);

    const sets = result.recordsets as Array<Array<Record<string, unknown>>>;
    const objects = sets[0][0];
    if (!objects?.TablaVersion || !objects?.TablaParametro || !objects?.SpResolver || !objects?.SpClonar) {
      throw new Error(`${environment}: faltan objetos de formula versionada`);
    }
    if (sets[5].length !== 15) {
      throw new Error(`${environment}: se esperaban 15 parametros activos y se encontraron ${sets[5].length}`);
    }

    const schemaContract = {
      columns: sets[1],
      checks: sets[2],
      indexes: sets[3]
    };
    const procedureContract = sets[4];
    const formulaContract = sets[5];

    return {
      environment,
      database,
      formula: {
        key: formulaContract[0].ClaveFormula,
        year: formulaContract[0].AnioVigencia,
        version: formulaContract[0].NumeroVersion,
        from: formulaContract[0].QuincenaDesde,
        to: formulaContract[0].QuincenaHasta,
        state: formulaContract[0].Estado,
        precisionPolicy: formulaContract[0].PrecisionPolicy,
        parameters: formulaContract.length
      },
      hashes: {
        schema: sha256(schemaContract),
        procedures: sha256(procedureContract),
        formula: sha256(formulaContract)
      }
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

  const baseline = inspections[0].hashes;
  const differences = inspections.filter((item) =>
    item.hashes.schema !== baseline.schema
    || item.hashes.procedures !== baseline.procedures
    || item.hashes.formula !== baseline.formula
  );

  console.log(JSON.stringify(inspections, null, 2));
  if (differences.length > 0) {
    throw new Error(`DATABASE_PARITY_FAILED: ${differences.map((item) => item.environment).join(', ')}`);
  }
  console.log('DATABASE_PARITY_OK');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
