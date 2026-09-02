import { DATABASE_ENVIRONMENTS, assertDatabaseEnvironment } from '../src/config/databaseEnvironments.js';

const quality = DATABASE_ENVIRONMENTS.CALIDAD;
process.env.SQLSERVER_DB = quality.sqlDatabase;
process.env.FIREBIRD_DATABASE = quality.firebirdDatabase;
assertDatabaseEnvironment('CALIDAD', process.env.SQLSERVER_DB, process.env.FIREBIRD_DATABASE);

const legacyHashes: Record<string, string> = {
  'aportaciones.IndividualesAhorroHistorico': 'E6535BBC747A656828D164C73CBB69A4408D901FA4D54E1A6AD54E5272448762',
  'aportaciones.IndividualesViviendaHistorico': '3854BC085CED6F2C378362FF63793133877C26F819E5489A33F0360908DBD036',
  'aportaciones.IndividualesPrestacionesHistorico': '7F19A377C521A4CC204F6DC95FB5E0FF653DA8117895D97D220A2024CDECC18A',
  'aportaciones.IndividualesCairHistorico': '33B28E1201D2EB7D71A609B3D24D5FBF83555880915479DD1EC882A0643D3495',
  'aportaciones.PensionNominaTransitorioHistorico': '447BC79736F44BB4D63692CBC624F21CDFB5D696E99317B562C9623634EAB358',
  'aportaciones.GuarderiasHistorico': '2B6B270C4ADD793CC4FCF841BBA75D9CFFB8CB432BC60F760AE3119C5A23F000',
  'aportaciones.AguinaldoHistorico': '2C6859DA2C729C56DBBFF4A8A4294B4AE4D18E16751DF93E881F2FC583BC94AC',
  'retenciones.PrestamosCortoPlazoHistorico': '56BF1684AB7499EB432729E72718EF7F7654BADAB991E49ED7894F7B34831881',
  'retenciones.PrestamosMedianoPlazoHistorico': '1A57593DF1F61288DC94CCE760380B63B25CD0385C727CC01A1FAECA7F20735F',
  'retenciones.PrestamosHipotecariosHistorico': '813A86E952FAB69B6E663A66C402F13C5524B676D22BE84DF78EB725286B2A28',
  'aportaciones.ResumenHistorico': 'F1588AA4F91B3D3CBF5DC94253F23B45A6B09C6893B12029A845D11AA0B27ABB',
  'conciliacion.RevisionAplicacionHistorico': 'B14B66F4FB7179CF4B46DFAA025A3E4DDDC9A410BECD207A2547637CC4FCF8AD',
};

const prerequisites = [
  ['phase7', 'liquidacion.QnaSnapshot', 'U'],
  ['phase7', 'liquidacion.QnaSnapshotDetalle', 'U'],
  ['phase7', 'liquidacion.QnaSnapshotFuenteDetalle', 'U'],
  ['phase7', 'aportaciones.SnapshotCalculoV2Detalle', 'U'],
  ['phase7', 'liquidacion.TR_QnaSnapshotDetalle_Inmutable', 'TR'],
  ['phase7', 'liquidacion.TR_QnaSnapshotFuenteDetalle_Inmutable', 'TR'],
  ['retenciones', 'retenciones.RetencionPCPHistoricoV3', 'U'],
  ['retenciones', 'retenciones.RetencionPMPHistoricoV3', 'U'],
  ['retenciones', 'retenciones.RetencionHIPHistoricoV3', 'U'],
  ['retenciones', 'retenciones.TVP_RetencionPCPHeader_V3', 'TT'],
  ['retenciones', 'retenciones.TVP_RetencionPCPDetalle_V3', 'TT'],
  ['retenciones', 'retenciones.TVP_RetencionPMPHeader_V3', 'TT'],
  ['retenciones', 'retenciones.TVP_RetencionPMPDetalle_V3', 'TT'],
  ['retenciones', 'retenciones.TVP_RetencionHIPHeader_V3', 'TT'],
  ['retenciones', 'retenciones.TVP_RetencionHIPDetalle_V3', 'TT'],
  ['phase9', 'liquidacion.QnaProcesoTransicion', 'U'],
  ['phase11', 'liquidacion.QnaProceso', 'U'],
  ['phase11', 'afec.BitacoraAfectacionOrg', 'U'],
] as const;

const legacyWriters = [
  'aportaciones.spGuardarIndividualesAhorroHistorico_Lote',
  'aportaciones.spGuardarIndividualesViviendaHistorico_Lote',
  'aportaciones.spGuardarIndividualesPrestacionesHistorico_Lote',
  'aportaciones.spGuardarIndividualesCairHistorico_Lote',
  'aportaciones.spGuardarPensionNominaTransitorioHistorico_Lote',
  'aportaciones.spGuardarGuarderiasHistorico_Lote',
  'aportaciones.spGuardarAguinaldoHistorico_Lote',
  'retenciones.spGuardarPrestamosCortoPlazoHistorico_Lote',
  'retenciones.spGuardarPrestamosMedianoPlazoHistorico_Lote',
  'retenciones.spGuardarPrestamosHipotecariosHistorico_Lote',
] as const;

const { connectDatabase, closeDatabaseConnection } = await import('../src/db/mssql.js');
const pool = await connectDatabase();

try {
  const result = await pool.request().query(`
    SELECT DB_NAME() AS BaseDatos,USER_NAME() AS DatabaseUser,
      CONVERT(BIT,IIF(IS_ROLEMEMBER(N'db_owner')=1,1,0)) AS IsDbOwner;

    SELECT v.Fase,v.Objeto,v.Tipo,
      CASE WHEN v.Tipo=N'TT'
        THEN CASE WHEN TYPE_ID(v.Objeto) IS NULL THEN 0 ELSE 1 END
        ELSE CASE WHEN OBJECT_ID(v.Objeto,v.Tipo) IS NULL THEN 0 ELSE 1 END
      END AS Existe
    FROM (VALUES
      ${prerequisites.map(([phase, object, type]) => `(N'${phase}',N'${object}',N'${type}')`).join(',\n      ')}
    ) v(Fase,Objeto,Tipo);

    DECLARE @Legacy TABLE(Tabla SYSNAME NOT NULL PRIMARY KEY,FirmaEsperada CHAR(64) NOT NULL);
    INSERT @Legacy VALUES
      ${Object.entries(legacyHashes).map(([table, hash]) => `(N'${table}','${hash}')`).join(',\n      ')};
    SELECT l.Tabla,l.FirmaEsperada,
      CONVERT(CHAR(64),HASHBYTES('SHA2_256',CONVERT(VARBINARY(MAX),CONVERT(VARCHAR(MAX),x.Cadena))),2) AS FirmaActual,
      CASE WHEN OBJECT_ID(l.Tabla,N'U') IS NULL THEN 0 ELSE 1 END AS Existe,
      CASE WHEN l.Tabla IN(N'aportaciones.ResumenHistorico',N'aportaciones.IndividualesViviendaHistorico',N'aportaciones.IndividualesAhorroHistorico')
        THEN COLUMNPROPERTY(OBJECT_ID(l.Tabla),N'periodo',N'IsComputed') ELSE 1 END AS PeriodoCalculado
    FROM @Legacy l
    OUTER APPLY (
      SELECT STRING_AGG(CONVERT(NVARCHAR(MAX),CONCAT(c.column_id,':',c.name,':',t.name,':',c.max_length,':',c.precision,':',c.scale,':',CONVERT(INT,c.is_nullable),':',CONVERT(INT,c.is_identity))),'|')
        WITHIN GROUP(ORDER BY c.column_id) AS Cadena
      FROM sys.columns c JOIN sys.types t ON t.user_type_id=c.user_type_id
      WHERE c.object_id=OBJECT_ID(l.Tabla)
        AND c.name NOT IN(N'QnaLiquidacionSnapshotId',N'QnaSourceOrden')
    ) x
    ORDER BY l.Tabla;

    SELECT v.Objeto,CASE WHEN OBJECT_ID(v.Objeto,N'P') IS NULL THEN 0 ELSE 1 END AS Existe
    FROM (VALUES
      ${legacyWriters.map((name) => `(N'${name}')`).join(',\n      ')}
    ) v(Objeto);

    SELECT
      CASE WHEN EXISTS(
        SELECT 1 FROM sys.indexes i
        JOIN sys.index_columns ic ON ic.object_id=i.object_id AND ic.index_id=i.index_id
        JOIN sys.columns c ON c.object_id=ic.object_id AND c.column_id=ic.column_id
        WHERE i.object_id=OBJECT_ID(N'afec.BitacoraAfectacionOrg') AND i.is_unique=1
          AND ic.key_ordinal=1 AND c.name=N'AfectacionId'
          AND 1=(SELECT COUNT(*) FROM sys.index_columns x WHERE x.object_id=i.object_id AND x.index_id=i.index_id AND x.key_ordinal>0)
      ) THEN 1 ELSE 0 END AS BitacoraAfectacionUnique,
      CASE WHEN EXISTS(SELECT 1 FROM sys.certificates WHERE name=N'QnaLegacyProjectorCertificate') THEN 1 ELSE 0 END AS ProjectorCertificateExists,
      CASE WHEN EXISTS(SELECT 1 FROM sys.certificates WHERE name=N'QnaLegacyGuardCertificate') THEN 1 ELSE 0 END AS GuardCertificateExists,
      CASE WHEN OBJECT_ID(N'liquidacion.spProyectarLegacyDesdeSnapshotV5',N'P') IS NULL THEN 0 ELSE 1 END AS Phase8Installed;
  `);

  const identity = result.recordsets[0][0];
  const missingPrerequisites = result.recordsets[1]
    .filter((row) => Number(row.Existe) !== 1)
    .map((row) => `${row.Fase}:${row.Objeto}`);
  const incompatibleLegacyStores = result.recordsets[2]
    .filter((row) => Number(row.Existe) !== 1 || String(row.FirmaActual ?? '') !== String(row.FirmaEsperada) || Number(row.PeriodoCalculado) !== 1)
    .map((row) => ({
      table: String(row.Tabla),
      exists: Number(row.Existe) === 1,
      expectedHash: String(row.FirmaEsperada),
      actualHash: row.FirmaActual ? String(row.FirmaActual) : null,
      computedPeriod: Number(row.PeriodoCalculado) === 1,
    }));
  const missingLegacyWriters = result.recordsets[3]
    .filter((row) => Number(row.Existe) !== 1)
    .map((row) => String(row.Objeto));
  const security = result.recordsets[4][0];
  const blockers = [
    ...missingPrerequisites,
    ...incompatibleLegacyStores.map((item) => `phase8:${item.table}`),
    ...missingLegacyWriters.map((name) => `phase8:${name}`),
    ...(Number(security.BitacoraAfectacionUnique) === 1 ? [] : ['phase11:afec.BitacoraAfectacionOrg.AfectacionId:not-unique']),
    ...(Number(security.ProjectorCertificateExists) === 1 && Number(security.Phase8Installed) !== 1 ? ['phase8:existing-projector-certificate-requires-private-key-validation'] : []),
    ...(Number(security.GuardCertificateExists) === 1 && Number(security.Phase8Installed) !== 1 ? ['phase8:existing-guard-certificate-requires-private-key-validation'] : []),
  ];

  console.log(JSON.stringify({
    check: 'QNA_PHASE12_CALIDAD_MIGRATION_PREFLIGHT',
    environment: 'CALIDAD',
    readOnly: true,
    sqlDatabase: String(identity.BaseDatos),
    applicationPrincipal: String(identity.DatabaseUser),
    deploymentRisk: Number(identity.IsDbOwner) === 1 ? 'DB_OWNER_EXCEPTION_SQL_ISOLATION_NOT_ENFORCEABLE' : 'NONE',
    missingPrerequisites,
    incompatibleLegacyStores,
    missingLegacyWriters,
    security: {
      bitacoraAfectacionUnique: Number(security.BitacoraAfectacionUnique) === 1,
      projectorCertificateExists: Number(security.ProjectorCertificateExists) === 1,
      guardCertificateExists: Number(security.GuardCertificateExists) === 1,
      phase8Installed: Number(security.Phase8Installed) === 1,
    },
    blockers,
  }, null, 2));

  if (String(identity.BaseDatos) !== quality.sqlDatabase) throw new Error('QNA_PHASE12_SQL_DESTINATION_INVALID');
  if (blockers.length > 0) throw new Error('QNA_PHASE12_CALIDAD_MIGRATION_PREFLIGHT_BLOCKED');
  console.log('QNA_PHASE12_CALIDAD_MIGRATION_PREFLIGHT_READONLY_OK');
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await closeDatabaseConnection();
}
