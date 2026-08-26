import assert from 'node:assert/strict';
import sql from 'mssql';
import { DATABASE_ENVIRONMENTS, assertDatabaseEnvironment } from '../src/config/databaseEnvironments.js';

const development = DATABASE_ENVIRONMENTS.DESARROLLO;
process.env.SQLSERVER_DB = development.sqlDatabase;
process.env.FIREBIRD_DATABASE = development.firebirdDatabase;
process.env.FIREBIRD_READ_ONLY = 'true';
assertDatabaseEnvironment('DESARROLLO', process.env.SQLSERVER_DB, process.env.FIREBIRD_DATABASE);

const actor = '00000000-0000-0000-0000-000000000087';
const projectorUser = 'QnaPhase8ProjectorFixture';
const repairUser = 'QnaPhase8RepairFixture';

type Fixture = {
  LiquidacionSnapshotId: string;
  QnaProcesoId: string;
  EntidadId: number;
  Organica0: string;
  Organica1: string;
  Organica2: string;
  Organica3: string;
  Anio: number;
  Quincena: number;
  Periodo: string;
};

async function main(): Promise<void> {
  const { connectDatabase, closeDatabaseConnection } = await import('../src/db/mssql.js');
  let pool = await connectDatabase();
  const before = await globalCounts(pool);
  const transaction = new sql.Transaction(pool);
  let active = false;
  let stage = 'setup';
  try {
    await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
    active = true;
    await createPrincipals(transaction);

    stage = 'first owner projection';
    const first = await createFixture(transaction, { label: 'FIRST', entidadId: 980001, org2: '01', org3: '01', revision: 1, pcpSubcent: true, hipComp: true });
    await projectAsRole(transaction, first.LiquidacionSnapshotId);
    const firstHeader = await projectionHeader(transaction, first.LiquidacionSnapshotId);
    assert.equal(firstHeader?.Estado, 'COMPLETE', JSON.stringify(firstHeader));

    const hip = await new sql.Request(transaction).input('Id', sql.BigInt, first.LiquidacionSnapshotId)
      .query(`SELECT computadora_antigua FROM retenciones.PrestamosHipotecariosHistorico WHERE QnaLiquidacionSnapshotId=@Id;`);
    assert.deepEqual(hip.recordset.map((row) => Boolean(row.computadora_antigua)), [true], 'AP_S_COMP_QNA debe persistir computadora_antigua=1');

    const normalization = await new sql.Request(transaction).input('Id', sql.BigInt, first.LiquidacionSnapshotId).query(`
      SELECT e.TotalV5A2,e.TotalNormalizadoA2,e.DiferenciaNormalizacionA2,e.NormalizacionVersion
      FROM liquidacion.QnaLegacyExpectedDomain e JOIN liquidacion.QnaLegacyProjection p ON p.QnaLegacyProjectionId=e.QnaLegacyProjectionId
      WHERE p.LiquidacionSnapshotId=@Id AND e.Dominio='PCP';`);
    assert.deepEqual(normalization.recordset.map((row) => [String(row.TotalV5A2), String(row.TotalNormalizadoA2), String(row.DiferenciaNormalizacionA2), row.NormalizacionVersion]),
      [['0.01', '0', '-0.01', 'LEGACY-PROJECTION-v1']], 'Dos filas D6 sub-cent deben conservar diferencia de normalizacion nombrada y no cero');

    const firstRows = await projectedRowIdentity(transaction, first.LiquidacionSnapshotId);
    assert.ok(firstRows.length > 0);

    stage = 'reduced-scope collision';
    const collision = await createFixture(transaction, { label: 'COLLISION', entidadId: 980002, org2: '02', org3: '02', revision: 1 });
    await projectAsRole(transaction, collision.LiquidacionSnapshotId);
    const collisionHeader = await projectionHeader(transaction, collision.LiquidacionSnapshotId);
    assert.equal(collisionHeader.Estado, 'WARNING');
    assert.match(String(collisionHeader.Detalle), /LEGACY_SCOPE_COLLISION/);
    assert.deepEqual(await projectedRowIdentity(transaction, first.LiquidacionSnapshotId), firstRows, 'La colision reducida debe preservar las primeras filas');
    assert.equal(await ownershipSnapshot(transaction, first), first.LiquidacionSnapshotId, 'La colision reducida debe preservar el primer owner');

    stage = 'same-scope replacement';
    const replacement = await createFixture(transaction, { label: 'REPLACEMENT', entidadId: first.EntidadId, org2: first.Organica2, org3: first.Organica3, revision: 2, pcpSubcent: true, hipComp: true });
    await projectAsRole(transaction, replacement.LiquidacionSnapshotId);
    assert.equal(await projectionState(transaction, first.LiquidacionSnapshotId), 'SUPERSEDED');
    assert.equal(await projectionState(transaction, replacement.LiquidacionSnapshotId), 'COMPLETE');
    assert.equal(await ownershipSnapshot(transaction, replacement), replacement.LiquidacionSnapshotId, 'El reemplazo legitimo debe transferir ownership');
    const replacementRows = await projectedRowIdentity(transaction, replacement.LiquidacionSnapshotId);
    assert.ok(replacementRows.length > 0);
    assert.ok(replacementRows.every((row) => row.snapshotId === replacement.LiquidacionSnapshotId));

    stage = 'signed repair';
    await tamperSigned(transaction, replacement);
    await projectAsRole(transaction, replacement.LiquidacionSnapshotId);
    assert.equal(await projectionState(transaction, replacement.LiquidacionSnapshotId), 'WARNING');
    await repairAsRole(transaction, replacement.LiquidacionSnapshotId);
    assert.equal(await projectionState(transaction, replacement.LiquidacionSnapshotId), 'COMPLETE');

    stage = 'explicit rollback';
    await transaction.rollback();
    active = false;
    assert.deepEqual(await globalCounts(pool), before, 'La ruta exitosa debe ejecutar rollback explicito y no retener filas');

    stage = 'role plus db_datawriter direct dml';
    const guardTransaction = new sql.Transaction(pool);
    await guardTransaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
    const guarded = await createFixture(guardTransaction, { label: 'GUARD', entidadId: 980003, org2: '03', org3: '03', revision: 1, hipComp: true });
    await createPrincipals(guardTransaction);
    await projectAsRole(guardTransaction, guarded.LiquidacionSnapshotId);
    await assertRoleDirectDmlRejected(guardTransaction, guarded);
    await guardTransaction.rollback().catch((error: any) => {
      if (error?.code !== 'EABORT') throw error;
    });
    await closeDatabaseConnection();
    pool = await connectDatabase();
    assert.deepEqual(await globalCounts(pool), before, 'El guard debe revertir su fixture y no retener filas');

    console.log(JSON.stringify({
      result: 'QNA_PHASE8_LEGACY_INTEGRATION_DESARROLLO_ROLLBACK_OK',
      collision: 'WARNING_FIRST_OWNER_PRESERVED',
      replacement: 'SUPERSEDED_AND_OWNERSHIP_TRANSFERRED',
      hip: 'AP_S_COMP_QNA_COMPUTADORA_ANTIGUA_1',
      normalization: 'PCP_D6_0.009_X2_V5_0.01_NORMALIZED_0.00_DIFF_-0.01',
      security: 'PROJECTOR_ROLE_DB_DATAWRITER_DIRECT_DML_REJECTED',
      rollback: 'EXPLICIT_BEFORE_RETAINED_COUNTS'
    }, null, 2));
  } catch (error) {
    const sqlError = error as any;
    const details = [sqlError?.message, ...(sqlError?.precedingErrors ?? []).map((item: any) => item.message)].filter(Boolean).join(' | ');
    throw new Error(`QNA_PHASE8_LEGACY_INTEGRATION_STAGE:${stage}:${details}`, { cause: error });
  } finally {
    if (active) await transaction.rollback().catch(() => undefined);
    await closeDatabaseConnection();
  }
}

async function createPrincipals(transaction: sql.Transaction): Promise<void> {
  await new sql.Request(transaction).query(`
    IF DATABASE_PRINCIPAL_ID(N'${projectorUser}') IS NULL CREATE USER ${projectorUser} WITHOUT LOGIN;
    IF IS_ROLEMEMBER(N'qna_legacy_projector_executor',N'${projectorUser}')<>1 ALTER ROLE qna_legacy_projector_executor ADD MEMBER ${projectorUser};
    IF IS_ROLEMEMBER(N'db_datawriter',N'${projectorUser}')<>1 ALTER ROLE db_datawriter ADD MEMBER ${projectorUser};
    IF IS_ROLEMEMBER(N'db_datareader',N'${projectorUser}')<>1 ALTER ROLE db_datareader ADD MEMBER ${projectorUser};
    IF DATABASE_PRINCIPAL_ID(N'${repairUser}') IS NULL CREATE USER ${repairUser} WITHOUT LOGIN;
    IF IS_ROLEMEMBER(N'qna_legacy_repair_executor',N'${repairUser}')<>1 ALTER ROLE qna_legacy_repair_executor ADD MEMBER ${repairUser};`);
}

async function createFixture(transaction: sql.Transaction, options: {
  label: string;
  entidadId: number;
  org2: string;
  org3: string;
  revision: number;
  pcpSubcent?: boolean;
  hipComp?: boolean;
}): Promise<Fixture> {
  const request = new sql.Request(transaction)
    .input('Label', sql.VarChar(30), options.label)
    .input('EntidadId', sql.Int, options.entidadId)
    .input('Org2', sql.Char(2), options.org2)
    .input('Org3', sql.Char(2), options.org3)
    .input('Revision', sql.Int, options.revision)
    .input('PcpSubcent', sql.Bit, options.pcpSubcent ?? false)
    .input('HipComp', sql.Bit, options.hipComp ?? false)
    .input('Actor', sql.NVarChar(100), actor);
  const result = await request.query(`
    DECLARE @Org0 CHAR(2)='98',@Org1 CHAR(2)='71',@Anio SMALLINT=2098,@Qna TINYINT=23,@Periodo CHAR(4)='2398';
    DECLARE @Hash CHAR(64)=CONVERT(CHAR(64),HASHBYTES('SHA2_256',CONVERT(VARBINARY(MAX),CONCAT(@Label,'|',@EntidadId,'|',@Org2,'|',@Org3,'|',@Revision))),2);
    INSERT liquidacion.QnaSnapshot(EntidadId,Anio,Quincena,Periodo,Organica0,Organica1,Organica2,Organica3,Ambiente,Estado,Revision,VersionEsquema,HashContenido,FuentesCompletas,UsuarioId)
      VALUES(@EntidadId,@Anio,@Qna,@Periodo,@Org0,@Org1,@Org2,@Org3,'DESARROLLO','COMPLETO',@Revision,5,@Hash,10,@Actor);
    DECLARE @SnapshotId BIGINT=SCOPE_IDENTITY();
    INSERT liquidacion.QnaSnapshotFuente(LiquidacionSnapshotId,Dominio,TipoFuente,Estado,Requerida,IdentificadorFuente,HashFuente,SourceScale,Registros)
    SELECT @SnapshotId,v.Dominio,'FIREBIRD',
      IIF((v.Dominio='PCP' AND @PcpSubcent=1) OR (v.Dominio='HIP' AND @HipComp=1),'COMPLETE','EMPTY'),1,
      CASE WHEN v.Dominio='HIP' AND @HipComp=1 THEN CONCAT('FIREBIRD:AP_S_COMP_QNA:',@Label) ELSE CONCAT('FIXTURE:',v.Dominio,':',@Label) END,
      CASE WHEN (v.Dominio='PCP' AND @PcpSubcent=1) OR (v.Dominio='HIP' AND @HipComp=1) THEN CONVERT(CHAR(64),HASHBYTES('SHA2_256',CONVERT(VARBINARY(MAX),CONCAT(@Label,'|',v.Dominio))),2) END,
      IIF(v.Dominio='PCP',6,2),CASE WHEN v.Dominio='PCP' AND @PcpSubcent=1 THEN 2 WHEN v.Dominio='HIP' AND @HipComp=1 THEN 1 ELSE 0 END
    FROM(VALUES('AHORRO'),('VIVIENDA'),('PRESTACIONES'),('CAIR'),('GUARDERIAS'),('TRANSITORIO'),('AGUINALDO'),('PCP'),('PMP'),('HIP'))v(Dominio);

    IF @PcpSubcent=1
      INSERT liquidacion.QnaSnapshotFuenteDetalle(LiquidacionSnapshotId,Dominio,Orden,ClaveFilaHash,SourceScale,ImporteOficialD6,PayloadCanonico,HashFila,EmpleadoClave,Nombre,PayloadVersion)
      SELECT @SnapshotId,'PCP',v.Orden,CONVERT(CHAR(64),HASHBYTES('SHA2_256',CONVERT(VARBINARY(MAX),CONCAT(@Label,'|PCP|',v.Orden,'|KEY'))),2),6,CONVERT(DECIMAL(19,6),0.009),
        (SELECT v.Orden interno,CONCAT('RFC',v.Orden) rfc,CONCAT('PCP ',v.Orden) nombre,100+v.Orden prestamo,1 letra,10 plazo,'2398' periodo_c,CONVERT(DATETIME2,'2098-12-01') fecha_c,CONVERT(DECIMAL(19,6),0.009) monto_d6 FOR JSON PATH,WITHOUT_ARRAY_WRAPPER,INCLUDE_NULL_VALUES),
        CONVERT(CHAR(64),HASHBYTES('SHA2_256',CONVERT(VARBINARY(MAX),CONCAT(@Label,'|PCP|',v.Orden,'|ROW'))),2),CONVERT(NVARCHAR(50),v.Orden),CONCAT('PCP ',v.Orden),1
      FROM(VALUES(1),(2))v(Orden);
    IF @HipComp=1
      INSERT liquidacion.QnaSnapshotFuenteDetalle(LiquidacionSnapshotId,Dominio,Orden,ClaveFilaHash,SourceScale,ImporteOficialD6,PayloadCanonico,HashFila,EmpleadoClave,Nombre,PayloadVersion)
      SELECT @SnapshotId,'HIP',1,CONVERT(CHAR(64),HASHBYTES('SHA2_256',CONVERT(VARBINARY(MAX),CONCAT(@Label,'|HIP|KEY'))),2),2,CONVERT(DECIMAL(19,6),1.23),
        (SELECT 9001 interno,'HIP Fixture' nombre,'9001' noempleado,'HIPRFC' rfc,77 pno_solicitud,2098 pano,'H1' pclave_prestamo,10 plazo FOR JSON PATH,WITHOUT_ARRAY_WRAPPER,INCLUDE_NULL_VALUES),
        CONVERT(CHAR(64),HASHBYTES('SHA2_256',CONVERT(VARBINARY(MAX),CONCAT(@Label,'|HIP|ROW'))),2),'9001','HIP Fixture',1;

    DECLARE @PcpA2 DECIMAL(19,2)=IIF(@PcpSubcent=1,0.01,0),@HipA2 DECIMAL(19,2)=IIF(@HipComp=1,1.23,0);
    INSERT liquidacion.QnaSnapshotTotal(LiquidacionSnapshotId,Registros,CAIRA2,FRAA2,FREA2,FHA2,FVA2,FAAA2,FAEA2,FATA2,FAIA2,AhorroA2,ViviendaA2,PrestacionesA2,GuarderiasA2,TransitorioA2,AguinaldoA2,RetencionPCPA2,RetencionPMPA2,RetencionHIPA2,TotalAportacionesA2,TotalRetencionesA2,TotalGeneralA2,CAIRFondoA2)
      VALUES(@SnapshotId,IIF(@PcpSubcent=1,2,0)+IIF(@HipComp=1,1,0),0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,@PcpA2,0,@HipA2,0,@PcpA2+@HipA2,@PcpA2+@HipA2,0);

    DECLARE @ProcesoId BIGINT=(SELECT QnaProcesoId FROM liquidacion.QnaProceso WHERE EntidadId=@EntidadId AND Anio=@Anio AND Quincena=@Qna AND Organica0=@Org0 AND Organica1=@Org1 AND Organica2=@Org2 AND Organica3=@Org3);
    IF @ProcesoId IS NULL
    BEGIN
      INSERT liquidacion.QnaProceso(EntidadId,Anio,Quincena,Organica0,Organica1,Organica2,Organica3,UsuarioId) VALUES(@EntidadId,@Anio,@Qna,@Org0,@Org1,@Org2,@Org3,@Actor);
      SET @ProcesoId=SCOPE_IDENTITY();
    END;
    DECLARE @Tipo VARCHAR(20)=IIF(EXISTS(SELECT 1 FROM liquidacion.QnaSnapshotOficialActual WHERE QnaProcesoId=@ProcesoId),'REEMPLAZADO','SELECCIONADO');
    INSERT liquidacion.QnaSnapshotSeleccionEvento(QnaProcesoId,LiquidacionSnapshotId,TipoEvento,Motivo,UsuarioId) VALUES(@ProcesoId,@SnapshotId,@Tipo,'Fixture deterministico fase 8',@Actor);
    DECLARE @EventoId BIGINT=SCOPE_IDENTITY();
    IF EXISTS(SELECT 1 FROM liquidacion.QnaSnapshotOficialActual WHERE QnaProcesoId=@ProcesoId)
      UPDATE liquidacion.QnaSnapshotOficialActual SET LiquidacionSnapshotId=@SnapshotId,QnaSnapshotSeleccionEventoId=@EventoId,FechaActualizacion=SYSDATETIME() WHERE QnaProcesoId=@ProcesoId;
    ELSE INSERT liquidacion.QnaSnapshotOficialActual(QnaProcesoId,LiquidacionSnapshotId,QnaSnapshotSeleccionEventoId) VALUES(@ProcesoId,@SnapshotId,@EventoId);
    SELECT CONVERT(VARCHAR(30),@SnapshotId) LiquidacionSnapshotId,CONVERT(VARCHAR(30),@ProcesoId) QnaProcesoId,@EntidadId EntidadId,@Org0 Organica0,@Org1 Organica1,@Org2 Organica2,@Org3 Organica3,@Anio Anio,@Qna Quincena,@Periodo Periodo;`);
  return result.recordset[0] as Fixture;
}

async function projectAsRole(transaction: sql.Transaction, snapshotId: string): Promise<void> {
  await new sql.Request(transaction).input('Id', sql.BigInt, snapshotId).input('Actor', sql.NVarChar(100), actor).query(`
    EXECUTE AS USER=N'${projectorUser}';
    BEGIN TRY EXEC liquidacion.spProyectarLegacyDesdeSnapshotV5 @LiquidacionSnapshotId=@Id,@UsuarioId=@Actor; REVERT; END TRY
    BEGIN CATCH REVERT; THROW; END CATCH;`);
}

async function repairAsRole(transaction: sql.Transaction, snapshotId: string): Promise<void> {
  await new sql.Request(transaction).input('Id', sql.BigInt, snapshotId).input('Actor', sql.NVarChar(100), actor).query(`
    EXECUTE AS USER=N'${repairUser}';
    BEGIN TRY EXEC liquidacion.spRepararLegacyDesdeSnapshotV5 @LiquidacionSnapshotId=@Id,@UsuarioId=@Actor,@Motivo=N'Reparacion deterministica fase 8'; REVERT; END TRY
    BEGIN CATCH REVERT; THROW; END CATCH;`);
}

async function tamperSigned(transaction: sql.Transaction, fixture: Fixture): Promise<void> {
  await new sql.Request(transaction).input('Id', sql.BigInt, fixture.LiquidacionSnapshotId).query(`
    EXEC(N'CREATE PROCEDURE liquidacion.spQnaLegacyIntegrationTamper @Id BIGINT AS
    BEGIN
      EXEC liquidacion.spQnaLegacyCapabilityMarker 1;
      UPDATE retenciones.PrestamosHipotecariosHistorico SET nombre=N''ALTERACION FASE 8'' WHERE QnaLiquidacionSnapshotId=@Id;
      EXEC liquidacion.spQnaLegacyCapabilityMarker 0;
    END;');
    ADD SIGNATURE TO OBJECT::liquidacion.spQnaLegacyIntegrationTamper BY CERTIFICATE QnaLegacyProjectorCertificate WITH PASSWORD='BICSN-QNA-Legacy-Projection-v1-Certificate';
    EXEC liquidacion.spQnaLegacyIntegrationTamper @Id;
    DROP PROCEDURE liquidacion.spQnaLegacyIntegrationTamper;`);
}

async function assertRoleDirectDmlRejected(transaction: sql.Transaction, fixture: Fixture): Promise<void> {
  const request = new sql.Request(transaction).input('Id', sql.BigInt, fixture.LiquidacionSnapshotId);
  await assert.rejects(request.query(`
    EXECUTE AS USER=N'${projectorUser}';
    BEGIN TRY UPDATE retenciones.PrestamosHipotecariosHistorico SET nombre=nombre WHERE QnaLiquidacionSnapshotId=@Id; REVERT; END TRY
    BEGIN CATCH REVERT; THROW; END CATCH;`), /QNA_V5_LEGACY_WRITE_REQUIERE_PROYECTOR|QNA_LEGACY.*CAPACIDAD_FIRMADA/i);
}

async function projectionHeader(transaction: sql.Transaction, snapshotId: string): Promise<any> {
  const result = await new sql.Request(transaction).input('Id', sql.BigInt, snapshotId).query(`SELECT * FROM liquidacion.QnaLegacyProjection WHERE LiquidacionSnapshotId=@Id;`);
  return result.recordset[0];
}

async function projectionState(transaction: sql.Transaction, snapshotId: string): Promise<string> {
  return String((await projectionHeader(transaction, snapshotId))?.Estado);
}

async function ownershipSnapshot(transaction: sql.Transaction, fixture: Fixture): Promise<string> {
  const result = await new sql.Request(transaction).input('O0', sql.Char(2), fixture.Organica0).input('O1', sql.Char(2), fixture.Organica1)
    .input('A', sql.Int, fixture.Anio).input('Q', sql.Int, fixture.Quincena)
    .query(`SELECT LiquidacionSnapshotId FROM liquidacion.QnaLegacyScopeOwnership WHERE Organica0=@O0 AND Organica1=@O1 AND Anio=@A AND Quincena=@Q;`);
  return String(result.recordset[0]?.LiquidacionSnapshotId);
}

async function projectedRowIdentity(transaction: sql.Transaction, snapshotId: string): Promise<Array<{ domain: string; id: string; snapshotId: string }>> {
  const result = await new sql.Request(transaction).input('Id', sql.BigInt, snapshotId).query(`
    SELECT 'PCP' domain,CONVERT(VARCHAR(30),id) id,CONVERT(VARCHAR(30),QnaLiquidacionSnapshotId) snapshotId FROM retenciones.PrestamosCortoPlazoHistorico WHERE QnaLiquidacionSnapshotId=@Id
    UNION ALL SELECT 'HIP',CONVERT(VARCHAR(30),id),CONVERT(VARCHAR(30),QnaLiquidacionSnapshotId) FROM retenciones.PrestamosHipotecariosHistorico WHERE QnaLiquidacionSnapshotId=@Id
    ORDER BY domain,id;`);
  return result.recordset;
}

async function globalCounts(pool: sql.ConnectionPool): Promise<string[]> {
  const result = await pool.request().query(`SELECT
    (SELECT COUNT_BIG(*) FROM liquidacion.QnaLegacyProjection) Headers,
    (SELECT COUNT_BIG(*) FROM liquidacion.QnaLegacyReconciliacion) Reconciliaciones,
    (SELECT COUNT_BIG(*) FROM liquidacion.QnaLegacyRepairAudit) Reparaciones,
    (SELECT COUNT_BIG(*) FROM liquidacion.QnaLegacyCapabilityLease) CapabilityLeases,
    (SELECT COUNT_BIG(*) FROM aportaciones.IndividualesAhorroHistorico)+(SELECT COUNT_BIG(*) FROM aportaciones.IndividualesViviendaHistorico)+(SELECT COUNT_BIG(*) FROM aportaciones.IndividualesPrestacionesHistorico)+(SELECT COUNT_BIG(*) FROM aportaciones.IndividualesCairHistorico) Fondos,
    (SELECT COUNT_BIG(*) FROM aportaciones.PensionNominaTransitorioHistorico)+(SELECT COUNT_BIG(*) FROM aportaciones.GuarderiasHistorico)+(SELECT COUNT_BIG(*) FROM aportaciones.AguinaldoHistorico) Auxiliares,
    (SELECT COUNT_BIG(*) FROM retenciones.PrestamosCortoPlazoHistorico)+(SELECT COUNT_BIG(*) FROM retenciones.PrestamosMedianoPlazoHistorico)+(SELECT COUNT_BIG(*) FROM retenciones.PrestamosHipotecariosHistorico) Retenciones,
    (SELECT COUNT_BIG(*) FROM aportaciones.ResumenHistorico) Resumen,(SELECT COUNT_BIG(*) FROM conciliacion.RevisionAplicacionHistorico) Revision;`);
  return Object.values(result.recordset[0]).map(String);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
