import assert from 'node:assert/strict';
import { DATABASE_ENVIRONMENTS, assertDatabaseEnvironment } from '../src/config/databaseEnvironments.js';

const quality = DATABASE_ENVIRONMENTS.CALIDAD;
process.env.SQLSERVER_DB = quality.sqlDatabase;
process.env.FIREBIRD_DATABASE = quality.firebirdDatabase;
process.env.FIREBIRD_READ_ONLY = 'true';
assertDatabaseEnvironment('CALIDAD', process.env.SQLSERVER_DB, process.env.FIREBIRD_DATABASE);

const requiredObjects = [
  'aportaciones.SnapshotCalculoV2Detalle',
  'liquidacion.QnaSnapshot',
  'liquidacion.QnaSnapshotFuente',
  'liquidacion.QnaSnapshotDetalle',
  'liquidacion.QnaSnapshotFuenteDetalle',
  'liquidacion.QnaSnapshotTotal',
  'liquidacion.QnaProceso',
  'liquidacion.QnaProcesoTransicion',
  'liquidacion.QnaLegacyProjection',
  'liquidacion.QnaLegacyReconciliacion',
  'liquidacion.QnaAplicacionIntento',
  'liquidacion.QnaAplicacionIntentoEvento',
  'liquidacion.QnaAplicacionResolucion',
  'afec.BitacoraAfectacionOrg',
  'pagos.LineaCapturaPeriodo',
  'conciliacion.RevisionAplicacionHistorico',
] as const;

const requiredV5Columns = [
  ['liquidacion.QnaSnapshotDetalle', 'Interno'],
  ['liquidacion.QnaSnapshotDetalle', 'Nombre'],
  ['liquidacion.QnaSnapshotDetalle', 'DiasLaborados'],
  ['liquidacion.QnaSnapshotDetalle', 'DiasOrigen'],
  ['liquidacion.QnaSnapshotDetalle', 'SueldoMensualD6'],
  ['liquidacion.QnaSnapshotDetalle', 'BaseCotizacionSueldoD6'],
  ['liquidacion.QnaSnapshotDetalle', 'QuinqueniosMensualD6'],
  ['liquidacion.QnaSnapshotDetalle', 'BaseCotizacionQuinqueniosD6'],
  ['liquidacion.QnaSnapshotDetalle', 'HashFila'],
  ['liquidacion.QnaSnapshotFuenteDetalle', 'EmpleadoClave'],
  ['liquidacion.QnaSnapshotFuenteDetalle', 'Rfc'],
  ['liquidacion.QnaSnapshotFuenteDetalle', 'Nombre'],
  ['liquidacion.QnaSnapshotFuenteDetalle', 'PayloadVersion'],
  ['liquidacion.QnaSnapshotFuenteDetalle', 'PayloadCanonico'],
  ['liquidacion.QnaSnapshotFuenteDetalle', 'ClaveFilaHash'],
  ['liquidacion.QnaSnapshotFuenteDetalle', 'HashFila'],
] as const;

const phaseObjects = [
  ['phase7', 'liquidacion.TR_QnaSnapshotDetalle_Inmutable', 'TR', ''],
  ['phase7', 'liquidacion.TR_QnaSnapshotFuenteDetalle_Inmutable', 'TR', ''],
  ['phase7', 'liquidacion.CK_QnaSnapshotDetalle_FAT', 'C', ''],
  ['phase7', 'liquidacion.CK_QnaSnapshotFuenteDetalle_Payload', 'C', ''],
  ['phase7', 'UX_QnaSnapshotDetalle_EmpleadoHash', 'INDEX', 'liquidacion.QnaSnapshotDetalle'],
  ['phase7', 'IX_QnaSnapshotFuenteDetalle_Clave', 'INDEX', 'liquidacion.QnaSnapshotFuenteDetalle'],
  ['phase8', 'liquidacion.spProyectarLegacyDesdeSnapshotV5', 'P', ''],
  ['phase8', 'liquidacion.spConciliarLegacySnapshotV5', 'P', ''],
  ['phase9', 'IX_QnaProcesoTransicion_EstadoProcesoFecha', 'INDEX', 'liquidacion.QnaProcesoTransicion'],
  ['phase11', 'liquidacion.TR_QnaAplicacionIntentoEvento_Inmutable', 'TR', ''],
  ['phase11', 'liquidacion.TR_QnaAplicacionResolucion_Inmutable', 'TR', ''],
] as const;

const [mssql, firebird] = await Promise.all([
  import('../src/db/mssql.js'),
  import('../src/db/firebird.js'),
]);

const pool = await mssql.connectDatabase();

try {
  const inventory = await pool.request().query(`
    SELECT DB_NAME() AS BaseDatos,
      CAST(DATABASEPROPERTYEX(DB_NAME(),'Updateability') AS VARCHAR(30)) AS Updateability,
      SUSER_SNAME() AS LoginName,
      USER_NAME() AS DatabaseUser;

    SELECT v.Objeto,CASE WHEN OBJECT_ID(v.Objeto,N'U') IS NULL THEN 0 ELSE 1 END AS Existe
    FROM (VALUES
      ${requiredObjects.map((name) => `(N'${name}')`).join(',\n      ')}
    ) v(Objeto);

    SELECT v.Objeto,v.Columna,
      CASE WHEN COL_LENGTH(v.Objeto,v.Columna) IS NULL THEN 0 ELSE 1 END AS Existe
    FROM (VALUES
      ${requiredV5Columns.map(([object, column]) => `(N'${object}',N'${column}')`).join(',\n      ')}
    ) v(Objeto,Columna);

    SELECT v.Fase,v.Objeto,v.Tipo,
      CASE WHEN v.Tipo=N'INDEX'
        THEN CASE WHEN EXISTS(
          SELECT 1 FROM sys.indexes i
          WHERE i.object_id=OBJECT_ID(v.Padre)
            AND i.name=v.Objeto
        ) THEN 1 ELSE 0 END
        ELSE CASE WHEN OBJECT_ID(v.Objeto,v.Tipo) IS NULL THEN 0 ELSE 1 END
      END AS Existe
    FROM (VALUES
      ${phaseObjects.map(([phase, object, type, parent]) => `(N'${phase}',N'${object}',N'${type}',N'${parent}')`).join(',\n      ')}
    ) v(Fase,Objeto,Tipo,Padre);

    SELECT CONCAT(QUOTENAME(s.name),N'.',QUOTENAME(t.name),N'.',QUOTENAME(fk.name)) AS Restriccion
    FROM sys.foreign_keys fk
    JOIN sys.tables t ON t.object_id=fk.parent_object_id
    JOIN sys.schemas s ON s.schema_id=t.schema_id
    WHERE s.name IN (N'liquidacion',N'retenciones')
      AND (fk.is_disabled=1 OR fk.is_not_trusted=1)
    ORDER BY s.name,t.name,fk.name;
  `);

  const identity = inventory.recordsets[0][0];
  const objects = inventory.recordsets[1];
  const columns = inventory.recordsets[2];
  const artifacts = inventory.recordsets[3];
  const untrustedConstraints = inventory.recordsets[4].map((row) => String(row.Restriccion));
  const missingObjects = objects.filter((row) => Number(row.Existe) !== 1).map((row) => String(row.Objeto));
  const missingV5Columns = columns
    .filter((row) => Number(row.Existe) !== 1)
    .map((row) => `${row.Objeto}.${row.Columna}`);
  const missingArtifacts = artifacts
    .filter((row) => Number(row.Existe) !== 1)
    .map((row) => `${row.Fase}:${row.Objeto}`);

  assert.equal(String(identity?.BaseDatos), quality.sqlDatabase, 'QNA_PHASE12_SQL_DESTINATION_INVALID');

  const firebirdRows = await firebird.executeSafeQuery(`
    SELECT MON$ATTACHMENT_NAME AS DATABASE_NAME
    FROM MON$ATTACHMENTS
    WHERE MON$ATTACHMENT_ID=CURRENT_CONNECTION
  `, [], 10_000);
  assert.equal(firebirdRows.length, 1, 'QNA_PHASE12_FIREBIRD_IDENTITY_UNAVAILABLE');
  const firebirdActual = normalizePath(String(firebirdRows[0]?.DATABASE_NAME ?? ''));
  const expectedFirebird = normalizePath(quality.firebirdDatabase);
  assert.ok(
    firebirdActual === expectedFirebird || firebirdActual.endsWith(expectedFirebird),
    'QNA_PHASE12_FIREBIRD_DESTINATION_INVALID',
  );

  const fixtureReady = requiredObjects
    .filter((name) => name.startsWith('liquidacion.QnaSnapshot') || name === 'liquidacion.QnaProceso' || name === 'liquidacion.QnaProcesoTransicion')
    .every((name) => !missingObjects.includes(name)) && missingV5Columns.length === 0;
  const fixtures = fixtureReady ? await discoverFixtures() : [];
  const fixture = fixtures[0] ?? null;

  const evidence = {
    check: 'QNA_PHASE12_CALIDAD_PREFLIGHT',
    environment: 'CALIDAD',
    readOnly: true,
    sqlDatabaseConfigured: quality.sqlDatabase,
    sqlDatabaseActual: String(identity?.BaseDatos ?? ''),
    sqlUpdateability: String(identity?.Updateability ?? ''),
    firebirdDatabaseConfigured: quality.firebirdDatabase,
    firebirdDatabaseActual: firebirdActual,
    firebirdStoredProceduresExecuted: 0,
    schema: {
      requiredObjects: requiredObjects.length,
      missingObjects,
      missingV5Columns,
      missingArtifacts,
      untrustedConstraints,
    },
    fixture: fixture ? {
      qnaProcesoId: String(fixture.QnaProcesoId),
      liquidacionSnapshotId: String(fixture.LiquidacionSnapshotId),
      scope: [fixture.EntidadId, fixture.Anio, fixture.Quincena, fixture.Organica0, fixture.Organica1, fixture.Organica2, fixture.Organica3].join('/'),
      periodo: String(fixture.Periodo),
      versionEsquema: Number(fixture.VersionEsquema),
      fuentes: Number(fixture.Fuentes),
      dominios: Number(fixture.Dominios),
      totales: Number(fixture.Totales),
      detallesFondos: Number(fixture.DetallesFondos),
      detallesAuxiliares: Number(fixture.DetallesAuxiliares),
    } : null,
  };

  console.log(JSON.stringify(evidence, null, 2));
  assert.equal(missingObjects.length, 0, 'QNA_PHASE12_REQUIRED_OBJECTS_MISSING');
  assert.equal(missingV5Columns.length, 0, 'QNA_PHASE12_V5_COLUMNS_MISSING');
  assert.equal(missingArtifacts.length, 0, 'QNA_PHASE12_PHASE_ARTIFACTS_MISSING');
  assert.equal(untrustedConstraints.length, 0, 'QNA_PHASE12_UNTRUSTED_CONSTRAINTS');
  assert.ok(fixture, 'QNA_PHASE12_CALIDAD_REAL_V5_TERMINADO_FIXTURE_NOT_FOUND');
  assert.equal(Number(fixture.Dominios), 10, 'QNA_PHASE12_FIXTURE_DOMAINS_INCOMPLETE');
  assert.equal(Number(fixture.Totales), 1, 'QNA_PHASE12_FIXTURE_TOTAL_INVALID');
  assert.ok(Number(fixture.DetallesFondos) > 0, 'QNA_PHASE12_FIXTURE_FUND_DETAILS_EMPTY');
  assert.ok(Number(fixture.DetallesAuxiliares) > 0, 'QNA_PHASE12_FIXTURE_AUXILIARY_DETAILS_EMPTY');
  console.log('QNA_PHASE12_CALIDAD_PREFLIGHT_READONLY_OK');

  async function discoverFixtures(): Promise<any[]> {
    const result = await pool.request().query(`
      WITH UltimaTransicion AS (
        SELECT tr.*,
          ROW_NUMBER() OVER (
            PARTITION BY tr.QnaProcesoId
            ORDER BY tr.FechaCreacion DESC,tr.QnaProcesoTransicionId DESC
          ) AS rn
        FROM liquidacion.QnaProcesoTransicion tr
      )
      SELECT TOP (20)
        p.QnaProcesoId,s.LiquidacionSnapshotId,s.EntidadId,s.Anio,s.Quincena,s.Periodo,
        s.Organica0,s.Organica1,s.Organica2,s.Organica3,s.VersionEsquema,
        (SELECT COUNT(*) FROM liquidacion.QnaSnapshotFuente f
          WHERE f.LiquidacionSnapshotId=s.LiquidacionSnapshotId) AS Fuentes,
        (SELECT COUNT(DISTINCT f.Dominio) FROM liquidacion.QnaSnapshotFuente f
          WHERE f.LiquidacionSnapshotId=s.LiquidacionSnapshotId) AS Dominios,
        (SELECT COUNT(*) FROM liquidacion.QnaSnapshotTotal t
          WHERE t.LiquidacionSnapshotId=s.LiquidacionSnapshotId) AS Totales,
        (SELECT COUNT(*) FROM liquidacion.QnaSnapshotDetalle d
          WHERE d.LiquidacionSnapshotId=s.LiquidacionSnapshotId
            AND d.Interno IS NOT NULL AND d.Nombre IS NOT NULL
            AND d.DiasLaborados IS NOT NULL AND d.DiasOrigen IS NOT NULL
            AND d.HashFila IS NOT NULL) AS DetallesFondos,
        (SELECT COUNT(*) FROM liquidacion.QnaSnapshotFuenteDetalle d
          WHERE d.LiquidacionSnapshotId=s.LiquidacionSnapshotId
            AND d.EmpleadoClave IS NOT NULL AND d.Nombre IS NOT NULL
            AND d.PayloadVersion=1 AND d.PayloadCanonico IS NOT NULL
            AND d.ClaveFilaHash IS NOT NULL AND d.HashFila IS NOT NULL) AS DetallesAuxiliares,
        u.FechaCreacion AS FechaAplicacion
      FROM UltimaTransicion u
      JOIN liquidacion.QnaProceso p ON p.QnaProcesoId=u.QnaProcesoId
      JOIN liquidacion.QnaSnapshot s ON s.LiquidacionSnapshotId=u.LiquidacionSnapshotId
      WHERE u.rn=1 AND u.EstadoDestino=N'TERMINADO'
        AND s.VersionEsquema=5 AND s.Ambiente=N'CALIDAD' AND s.Estado=N'COMPLETO'
        AND s.FuentesEsperadas=10 AND s.FuentesCompletas=10
        AND s.EntidadId=p.EntidadId AND s.Anio=p.Anio AND s.Quincena=p.Quincena
        AND s.Organica0=p.Organica0 AND s.Organica1=p.Organica1
        AND s.Organica2=p.Organica2 AND s.Organica3=p.Organica3
      ORDER BY u.FechaCreacion DESC,u.QnaProcesoTransicionId DESC;
    `);
    return result.recordset;
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await Promise.allSettled([mssql.closeDatabaseConnection(), firebird.closeFirebirdConnection()]);
}

function normalizePath(value: string): string {
  return value.trim().replaceAll('\\', '/');
}
