import assert from 'node:assert/strict';
import { DATABASE_ENVIRONMENTS, assertDatabaseEnvironment } from '../src/config/databaseEnvironments.js';

const production = DATABASE_ENVIRONMENTS.PRODUCCION;
process.env.SQLSERVER_DB = production.sqlDatabase;
process.env.FIREBIRD_DATABASE = production.firebirdDatabase;
process.env.FIREBIRD_READ_ONLY = 'true';
assertDatabaseEnvironment('PRODUCCION', process.env.SQLSERVER_DB, process.env.FIREBIRD_DATABASE);

const [mssql, firebird] = await Promise.all([
  import('../src/db/mssql.js'),
  import('../src/db/firebird.js'),
]);
const pool = await mssql.connectDatabase();

try {
  const sqlResult = await pool.request().query(`
    SELECT DB_NAME() AS BaseDatos,
      CAST(DATABASEPROPERTYEX(DB_NAME(), 'Updateability') AS VARCHAR(30)) AS Updateability;

    SELECT TipoFondo,AnioVigencia,
      CONVERT(VARCHAR(40),PorcentajePatron) AS PorcentajePatron,
      CONVERT(VARCHAR(40),PorcentajeAfiliado) AS PorcentajeAfiliado,Vigente
    FROM aportaciones.CatalogoPorcentajeFondo
    WHERE AnioVigencia=2026 AND Vigente=1
    ORDER BY TipoFondo;

    SELECT FormulaCalculoVersionId,ClaveFormula,AnioVigencia,NumeroVersion,
      QuincenaDesde,QuincenaHasta,PrecisionPolicy,Estado
    FROM aportaciones.FormulaCalculoVersion
    WHERE ClaveFormula='APORTACIONES-NOMINA' AND AnioVigencia=2026
    ORDER BY NumeroVersion DESC;

    SELECT v.Objeto,CASE WHEN OBJECT_ID(v.Objeto,v.Tipo) IS NULL THEN 0 ELSE 1 END AS Existe
    FROM (VALUES
      (N'aportaciones.SnapshotCalculoV2',N'U'),
      (N'aportaciones.SnapshotCalculoV2Detalle',N'U'),
      (N'aportaciones.SnapshotCalculoV2Decision',N'U'),
      (N'dbo.NominaAplicacionQnalCarga',N'U'),
      (N'dbo.NominaAplicacionQnalDetalle',N'U')
    ) v(Objeto,Tipo);

    SELECT COUNT(*) AS LiquidacionesExistentes
    FROM sys.tables t JOIN sys.schemas s ON s.schema_id=t.schema_id
    WHERE s.name='liquidacion';

    SELECT v.Objeto,v.Columna,CASE WHEN COL_LENGTH(v.Objeto,v.Columna) IS NULL THEN 0 ELSE 1 END AS Existe
    FROM (VALUES
      (N'dbo.NominaAplicacionQnalCarga',N'TipoCarga'),
      (N'dbo.NominaAplicacionQnalCarga',N'EsVigente'),
      (N'dbo.NominaAplicacionQnalDetalle',N'RfcNormalizado'),
      (N'dbo.NominaAplicacionQnalDetalle',N'BaseCotizacionQuinquenios')
    ) v(Objeto,Columna);

    SELECT COUNT(*) AS RfcDuplicados
    FROM (
      SELECT EntidadId,Anio,Quincena,Organica0,Organica1,Organica2,Organica3,
        UPPER(LTRIM(RTRIM(RFC))) AS RfcNormalizado
      FROM dbo.NominaAplicacionQnalDetalle
      WHERE RFC IS NOT NULL
      GROUP BY EntidadId,Anio,Quincena,Organica0,Organica1,Organica2,Organica3,UPPER(LTRIM(RTRIM(RFC)))
      HAVING COUNT(*) > 1
    ) d;

    SELECT v.Objeto,v.Indice,CASE WHEN i.index_id IS NULL THEN 0 ELSE 1 END AS Existe
    FROM (VALUES
      (N'dbo.NominaAplicacionQnalCarga',N'UX_NominaAplicacionQnalCarga_TxtVigente'),
      (N'dbo.NominaAplicacionQnalCarga',N'IX_NominaAplicacionQnalCarga_Seleccion'),
      (N'dbo.NominaAplicacionQnalDetalle',N'UX_NominaAplicacionQnalDetalle_AmbitoRfc')
    ) v(Objeto,Indice)
    LEFT JOIN sys.indexes i ON i.object_id=OBJECT_ID(v.Objeto) AND i.name=v.Indice;
  `);
  assert.equal(String(sqlResult.recordsets[0][0]?.BaseDatos), production.sqlDatabase);

  const firebirdResult = await firebird.executeSafeQuery(
    'SELECT CURRENT_TIMESTAMP AS FECHA_SERVIDOR FROM RDB$DATABASE',
    [],
  );
  assert.equal(firebirdResult.length, 1, 'Firebird Produccion no respondio');

  console.log(JSON.stringify({
    environment: 'PRODUCCION',
    readOnly: true,
    sqlDatabase: production.sqlDatabase,
    firebirdDatabase: production.firebirdDatabase,
    catalogo2026: sqlResult.recordsets[1],
    formulas2026: sqlResult.recordsets[2],
    prerrequisitos: sqlResult.recordsets[3],
    liquidacionesExistentes: Number(sqlResult.recordsets[4][0]?.LiquidacionesExistentes ?? 0),
    columnasNomina: sqlResult.recordsets[5],
    rfcDuplicados: Number(sqlResult.recordsets[6][0]?.RfcDuplicados ?? 0),
    indicesNomina: sqlResult.recordsets[7],
    firebirdOk: true,
  }, null, 2));
  assert.equal(sqlResult.recordsets[1].length, 4, 'CatalogoPorcentajeFondo 2026 debe contener cuatro fondos vigentes');
  assert.ok(sqlResult.recordsets[3]
    .filter((row) => String(row.Objeto).startsWith('dbo.Nomina'))
    .every((row) => Number(row.Existe) === 1), 'Faltan tablas de nomina requeridas para V3');
  assert.equal(Number(sqlResult.recordsets[6][0]?.RfcDuplicados ?? 0), 0, 'Existen RFC duplicados que impedirian crear el indice unico de nomina');
  assert.ok(sqlResult.recordsets[7].every((row) => Number(row.Existe) === 1), 'Faltan indices de nomina requeridos para seleccion determinista');
  console.log('PRODUCTION_PREFLIGHT_READONLY_OK');
} finally {
  await Promise.allSettled([mssql.closeDatabaseConnection(), firebird.closeFirebirdConnection()]);
}
