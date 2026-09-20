import assert from 'node:assert/strict';
import sql from 'mssql';
import { DATABASE_ENVIRONMENTS, assertDatabaseEnvironment } from '../src/config/databaseEnvironments.js';

const development=DATABASE_ENVIRONMENTS.DESARROLLO;
process.env.SQLSERVER_DB=development.sqlDatabase;
process.env.FIREBIRD_DATABASE=development.firebirdDatabase;
process.env.FIREBIRD_READ_ONLY='true';
assertDatabaseEnvironment('DESARROLLO',process.env.SQLSERVER_DB,process.env.FIREBIRD_DATABASE);
const scope={ entidadId:1,anio:2026,quincena:15,organica0:'04',organica1:'24',organica2:'01',organica3:'01' };
const userId='00000000-0000-0000-0000-000000000007';

async function main(): Promise<void> {
  const [mssql,firebird,formulaModule,fundModule,captureModule,factoryModule,contracts,payloadModule,liquidacionModule]=await Promise.all([
    import('../src/db/mssql.js'),import('../src/db/firebird.js'),
    import('../src/modules/aportacionesFondos/infrastructure/persistence/FormulaCalculoRepository.js'),
    import('../src/modules/aportacionesFondos/infrastructure/persistence/AportacionFondoRepository.js'),
    import('../src/modules/liquidacionQna/application/queries/CaptureQnaTenDomainsQuery.js'),
    import('../src/modules/liquidacionQna/domain/services/QnaOfficialSnapshotV5Factory.js'),
    import('../src/modules/liquidacionQna/domain/services/LiquidacionQnaContracts.js'),
    import('../src/modules/liquidacionQna/domain/services/QnaAuxiliaryPayloadV1.js'),
    import('../src/modules/liquidacionQna/infrastructure/persistence/LiquidacionQnaRepository.js')
  ]);
  const pool=await mssql.connectDatabase();
  const before=await counts(pool);
  await assert.rejects(new sql.Request(pool).input('LiquidacionSnapshotId',sql.BigInt,-1).input('UsuarioId',sql.NVarChar(100),userId)
    .execute('retenciones.spProyectarRetencionesV3DesdeSnapshotV5'),/RETENCION_V3_REQUIERE_SNAPSHOT_V5_OFICIAL/);
  assert.deepEqual(await counts(pool),before,'El fallo standalone no debe dejar evidencia');
  let transaction=new sql.Transaction(pool);
  let active=false;
  try {
    const funds=new fundModule.AportacionFondoRepository(new formulaModule.FormulaCalculoRepository(pool));
    const capture=await new captureModule.CaptureQnaTenDomainsQuery(funds).execute({ ...scope,ambiente:'DESARROLLO',usuarioId:userId });
    const approvals=Object.entries(capture.auxiliares).filter(([,value])=>value.source.estado==='EMPTY')
      .map(([dominio])=>({ dominio:dominio as keyof typeof capture.auxiliares,motivo:'Integracion rollback-only',evidencia:'Fase 7' }));
    const official=new factoryModule.QnaOfficialSnapshotV5Factory().create(capture,approvals);
    const candidate=structuredClone(official.candidate);

    // Fuerza evidencia nullable, duplicada y huerfana sin crear una proyeccion sintetica de fondos.
    const basePcp=candidate.detalles.find((detail)=>detail.dominio==='PCP');
    assert.ok(basePcp,'La prueba de Desarrollo requiere al menos una fila PCP oficial');
    const orphanPayload={ ...basePcp.payloadCanonico,interno:999999,nombre:'HUERFANO FASE 7',rfc:null,prestamo:999999,letra:null };
    const orphan={ ...basePcp,orden:Math.max(...candidate.detalles.filter((d)=>d.dominio==='PCP').map((d)=>d.orden))+1,
      empleadoClave:'999999',nombre:'HUERFANO FASE 7',rfc:null,payloadCanonico:orphanPayload,
      claveFilaHash:contracts.calculateCanonicalHash([999999,999999,null]),hashFila:contracts.calculateCanonicalHash(orphanPayload) };
    candidate.detalles.push(orphan,{ ...orphan,orden:orphan.orden+1 });
    const pcpDetails=candidate.detalles.filter((detail)=>detail.dominio==='PCP');
    const pcpSource=candidate.fuentes.find((source)=>source.dominio==='PCP')!;
    pcpSource.registros=pcpDetails.length;
    pcpSource.hashFuente=contracts.calculateCanonicalHash([...pcpDetails].sort((a,b)=>a.claveFilaHash.localeCompare(b.claveFilaHash)||a.hashFila.localeCompare(b.hashFila)).map((d)=>[d.claveFilaHash,d.hashFila]));

    const hipPayload=Object.fromEntries(payloadModule.QNA_AUXILIARY_PAYLOAD_V1_FIELDS.HIP.map((field)=>[field,null]));
    Object.assign(hipPayload,{ interno:888888,nombre:'HUERFANO HIP FASE 7',rfc:null,pno_solicitud:null,pano:null,cantidad_d6:'3.456789' });
    const hipDetail={ dominio:'HIP' as const,orden:1,claveFilaHash:contracts.calculateCanonicalHash([888888,null,null]),sourceScale:2 as const,
      importeOficialD6:'3.456789',payloadCanonico:hipPayload,hashFila:contracts.calculateCanonicalHash(hipPayload),empleadoClave:'888888',rfc:null,
      nombre:'HUERFANO HIP FASE 7',payloadVersion:1 as const };
    candidate.detalles=candidate.detalles.filter((detail)=>detail.dominio!=='HIP');
    candidate.detalles.push(hipDetail);
    const hipSource=candidate.fuentes.find((source)=>source.dominio==='HIP')!;
    Object.assign(hipSource,{ estado:'COMPLETE',registros:1,hashFuente:contracts.calculateCanonicalHash([[hipDetail.claveFilaHash,hipDetail.hashFila]]),notApplicableAprobado:false,aprobadoPor:null,evidencia:null });

    // Garantiza un lote auditable de cero filas.
    candidate.detalles=candidate.detalles.filter((detail)=>detail.dominio!=='PMP');
    const pmpSource=candidate.fuentes.find((source)=>source.dominio==='PMP')!;
    Object.assign(pmpSource,{ estado:'NOT_APPLICABLE',registros:0,hashFuente:null,notApplicableAprobado:true,aprobadoPor:userId,evidencia:'MOTIVO: Integracion rollback-only | EVIDENCIA: Fase 7' });
    for (const employee of candidate.detallesEmpleado!) {
      employee.retencionPmpD6='0.000000';
      employee.hashFila=contracts.calculateQnaEmployeeDetailHash(employee);
    }
    candidate.totales.retencionPcpA2=d6ToA2(pcpDetails.map((detail)=>detail.importeOficialD6));
    candidate.totales.retencionPmpA2='0.00';
    candidate.totales.retencionHipA2='3.45';
    candidate.totales.totalRetencionesA2=addA2(candidate.totales.retencionPcpA2,candidate.totales.retencionHipA2);
    candidate.totales.totalGeneralA2=addA2(candidate.totales.totalAportacionesA2,candidate.totales.totalRetencionesA2);
    contracts.validateQnaCandidate({ ...candidate,snapshotCalculoV2Id:'1' });

    const repository=new liquidacionModule.LiquidacionQnaRepository(pool);
    await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE); active=true;
    const created=await repository.createOfficialV5EnTransaccion(transaction,{ snapshotV2:official.snapshotV2,candidate });
    await repository.appendDecisionEnTransaccion(transaction,created.liquidacionSnapshotId,'APROBADO','Integracion fase 7',userId);
    await pointOfficial(transaction,created.liquidacionSnapshotId,userId);
    for (const invalidCase of ['hipPano','malformedPlazo','overflowPlazo','intOverflow'] as const) {
      await assertInvalidProjectionInteger(transaction,created.liquidacionSnapshotId,userId,invalidCase);
    }

    await new sql.Request(transaction).query(`EXEC sys.sp_set_session_context @key=N'RETENCION_V3_FAIL_AFTER_LOTES',@value=1;`);
    await assert.rejects(project(transaction,created.liquidacionSnapshotId,userId),/RETENCION_V3_FALLO_INYECTADO_DESPUES_LOTES/);
    const atomicFailure=await new sql.Request(transaction).input('Id',sql.BigInt,created.liquidacionSnapshotId).query('SELECT COUNT(*) Total FROM retenciones.RetencionHistoricoLoteV3 WHERE LiquidacionSnapshotId=@Id');
    assert.equal(Number(atomicFailure.recordset[0].Total),0,'El savepoint debe retirar lotes parciales tras fallo de detalle');
    await new sql.Request(transaction).query(`EXEC sys.sp_set_session_context @key=N'RETENCION_V3_FAIL_AFTER_LOTES',@value=NULL;`);
    await project(transaction,created.liquidacionSnapshotId,userId);
    await project(transaction,created.liquidacionSnapshotId,userId);
    const retryUserId='00000000-0000-0000-0000-000000000008';
    await project(transaction,created.liquidacionSnapshotId,retryUserId);
    await assert.rejects(callLegacyPcp(transaction,created.liquidacionSnapshotId,userId,candidate.detalles.filter((d)=>d.dominio==='PCP'),candidate.totales.retencionPcpA2),/RETENCION_PCP_V5_REQUIERE_PROYECTOR/);
    await assert.rejects(callLegacyPmpEmpty(transaction,created.liquidacionSnapshotId,userId),/RETENCION_PMP_V5_REQUIERE_PROYECTOR/);
    await assertInvalidLegacyNullInsert(transaction,created.liquidacionSnapshotId,userId);

    const evidence=await new sql.Request(transaction).input('Id',sql.BigInt,created.liquidacionSnapshotId).query(`
      SELECT Dominio,EstadoFuente,Registros,HashFuente,TotalA2,IdentificadorFuente,UsuarioId FROM retenciones.RetencionHistoricoLoteV3 WHERE LiquidacionSnapshotId=@Id ORDER BY Dominio;
      SELECT Orden,Interno,EmpleadoClave,Prestamo,Letra,CapitalD6,ClaveFilaHash,HashFila,PayloadCanonico,EsHuerfano,QnaSnapshotDetalleId FROM retenciones.RetencionPCPHistoricoV3 WHERE LiquidacionSnapshotId=@Id ORDER BY Orden;
      SELECT Orden,Interno,Solicitud,AnioPrestamo,CantidadD6,DescuentoD6,CapitalD6,InteresD6,InteresDiferidoD6,SeguroD6,MoratorioD6,TotalD6,IdentificadorFuente,EsHuerfano FROM retenciones.RetencionHIPHistoricoV3 WHERE LiquidacionSnapshotId=@Id ORDER BY Orden;
      SELECT RetencionPCPA2,RetencionPMPA2,RetencionHIPA2 FROM liquidacion.QnaSnapshotTotal WHERE LiquidacionSnapshotId=@Id;`);
    assert.equal(evidence.recordsets[0].length,3);
    assert.ok(evidence.recordsets[0].every((row)=>String(row.UsuarioId)===userId));
    const actors=await new sql.Request(transaction).input('Id',sql.BigInt,created.liquidacionSnapshotId).query(`
      SELECT UsuarioId FROM retenciones.RetencionHistoricoLoteV3 WHERE LiquidacionSnapshotId=@Id
      UNION SELECT UsuarioId FROM retenciones.RetencionPCPHistoricoV3 WHERE LiquidacionSnapshotId=@Id
      UNION SELECT UsuarioId FROM retenciones.RetencionPMPHistoricoV3 WHERE LiquidacionSnapshotId=@Id
      UNION SELECT UsuarioId FROM retenciones.RetencionHIPHistoricoV3 WHERE LiquidacionSnapshotId=@Id;`);
    assert.deepEqual(actors.recordset.map((row)=>String(row.UsuarioId)),[userId],'El reintento por otro admin debe preservar el actor original');
    const empty=evidence.recordsets[0].find((row)=>row.Dominio==='PMP');
    assert.deepEqual([empty.EstadoFuente,Number(empty.Registros),empty.HashFuente],['NOT_APPLICABLE',0,null]);
    const orphanRows=evidence.recordsets[1].filter((row)=>Number(row.Interno)===999999);
    assert.equal(orphanRows.length,2);
    assert.equal(orphanRows[0].Prestamo,999999);
    assert.equal(orphanRows[0].Letra,null);
    assert.equal(orphanRows[0].ClaveFilaHash,orphanRows[1].ClaveFilaHash);
    assert.equal(orphanRows[0].HashFila,orphanRows[1].HashFila);
    assert.notEqual(orphanRows[0].Orden,orphanRows[1].Orden);
    assert.ok(orphanRows.every((row)=>row.EsHuerfano===true && row.QnaSnapshotDetalleId===null));
    assert.equal(evidence.recordsets[2].length,1);
    assert.equal(evidence.recordsets[2][0].Solicitud,null);
    assert.equal(evidence.recordsets[2][0].AnioPrestamo,null);
    for (const field of ['DescuentoD6','CapitalD6','InteresD6','InteresDiferidoD6','SeguroD6','MoratorioD6']) assert.equal(evidence.recordsets[2][0][field],null);
    assert.equal(String(evidence.recordsets[2][0].CantidadD6),String(evidence.recordsets[2][0].TotalD6));
    assert.match(String(evidence.recordsets[2][0].IdentificadorFuente),/^FIREBIRD:(AP_S_HIP_QNA|AP_S_COMP_QNA):/);
    assert.equal(evidence.recordsets[2][0].EsHuerfano,true);
    const totals=evidence.recordsets[3][0];
    assert.equal(String(evidence.recordsets[0].find((row)=>row.Dominio==='PCP').TotalA2),String(totals.RetencionPCPA2));
    assert.equal(String(evidence.recordsets[0].find((row)=>row.Dominio==='HIP').TotalA2),String(totals.RetencionHIPA2));

    for (const tamper of ['multiplicity','identity','amount','component','source','orphan'] as const) {
      await assertPcpRetryTamper(transaction,created.liquidacionSnapshotId,userId,tamper);
    }
    await assertPcpCompletenessRejects(transaction,created.liquidacionSnapshotId,'payloadVersion');
    await assertPcpCompletenessRejects(transaction,created.liquidacionSnapshotId,'nullHash');
    await transaction.rollback().catch(()=>undefined); active=false;
    assert.deepEqual(await counts(pool),before,'La integracion debe revertir lotes y detalles V3');
    console.log('RETENCIONES_V3_PROJECTION_INTEGRATION_DESARROLLO_ROLLBACK_OK');
  } finally {
    if (active) await transaction.rollback().catch(()=>undefined);
    await Promise.allSettled([mssql.closeDatabaseConnection(),firebird.closeFirebirdConnection()]);
  }
}

async function pointOfficial(transaction: sql.Transaction,id:string,usuarioId:string): Promise<void> {
  const request=new sql.Request(transaction).input('Id',sql.BigInt,id).input('UsuarioId',sql.NVarChar(100),usuarioId);
  await request.query(`
    DECLARE @ProcesoId BIGINT;
    SELECT @ProcesoId=QnaProcesoId FROM liquidacion.QnaProceso p WITH (UPDLOCK,HOLDLOCK) JOIN liquidacion.QnaSnapshot s ON s.LiquidacionSnapshotId=@Id
      WHERE p.EntidadId=s.EntidadId AND p.Anio=s.Anio AND p.Quincena=s.Quincena AND p.Organica0=s.Organica0 AND p.Organica1=s.Organica1 AND p.Organica2=s.Organica2 AND p.Organica3=s.Organica3;
    IF @ProcesoId IS NULL
      INSERT liquidacion.QnaProceso (EntidadId,Anio,Quincena,Organica0,Organica1,Organica2,Organica3,UsuarioId)
      SELECT EntidadId,Anio,Quincena,Organica0,Organica1,Organica2,Organica3,@UsuarioId FROM liquidacion.QnaSnapshot WHERE LiquidacionSnapshotId=@Id;
    IF @ProcesoId IS NULL SET @ProcesoId=SCOPE_IDENTITY();
    INSERT liquidacion.QnaSnapshotSeleccionEvento (QnaProcesoId,LiquidacionSnapshotId,TipoEvento,Motivo,UsuarioId) VALUES (@ProcesoId,@Id,'SELECCIONADO','Integracion fase 7',@UsuarioId);
    DECLARE @EventoId BIGINT=SCOPE_IDENTITY();
    IF EXISTS (SELECT 1 FROM liquidacion.QnaSnapshotOficialActual WHERE QnaProcesoId=@ProcesoId)
      UPDATE liquidacion.QnaSnapshotOficialActual SET LiquidacionSnapshotId=@Id,QnaSnapshotSeleccionEventoId=@EventoId WHERE QnaProcesoId=@ProcesoId;
    ELSE INSERT liquidacion.QnaSnapshotOficialActual(QnaProcesoId,LiquidacionSnapshotId,QnaSnapshotSeleccionEventoId) VALUES(@ProcesoId,@Id,@EventoId);`);
}
async function project(transaction:sql.Transaction,id:string,usuarioId:string):Promise<void> {
  await new sql.Request(transaction).input('LiquidacionSnapshotId',sql.BigInt,id).input('UsuarioId',sql.NVarChar(100),usuarioId)
    .execute('retenciones.spProyectarRetencionesV3DesdeSnapshotV5');
}
async function assertInvalidProjectionInteger(transaction:sql.Transaction,id:string,usuarioId:string,invalidCase:'hipPano'|'malformedPlazo'|'overflowPlazo'|'intOverflow'):Promise<void> {
  await new sql.Request(transaction).query('SAVE TRANSACTION Fase7EnteroInvalido;');
  try {
    await new sql.Request(transaction).input('Id',sql.BigInt,id).input('Caso',sql.VarChar(30),invalidCase).query(`
      DISABLE TRIGGER liquidacion.TR_QnaSnapshotFuenteDetalle_Inmutable ON liquidacion.QnaSnapshotFuenteDetalle;
      UPDATE liquidacion.QnaSnapshotFuenteDetalle
      SET PayloadCanonico=CASE @Caso
        WHEN 'hipPano' THEN JSON_MODIFY(PayloadCanonico,'$.pano',40000)
        WHEN 'malformedPlazo' THEN JSON_MODIFY(PayloadCanonico,'$.plazo',N'MALFORMADO')
        WHEN 'overflowPlazo' THEN JSON_MODIFY(PayloadCanonico,'$.plazo',CONVERT(BIGINT,2147483648))
        ELSE JSON_MODIFY(PayloadCanonico,'$.prestamo',CONVERT(BIGINT,2147483648)) END
      WHERE LiquidacionSnapshotId=@Id AND Orden=(SELECT MIN(Orden) FROM liquidacion.QnaSnapshotFuenteDetalle WHERE LiquidacionSnapshotId=@Id AND Dominio=IIF(@Caso='hipPano','HIP','PCP'))
        AND Dominio=IIF(@Caso='hipPano','HIP','PCP');
      ENABLE TRIGGER liquidacion.TR_QnaSnapshotFuenteDetalle_Inmutable ON liquidacion.QnaSnapshotFuenteDetalle;`);
    await assert.rejects(project(transaction,id,usuarioId),/RETENCION_V3_ENTERO_(SMALLINT|INT)_DESTINO_INVALIDO/);
    await assertNoProjectionEvidence(transaction,id,invalidCase);
  } finally {
    await new sql.Request(transaction).query(`
      ENABLE TRIGGER liquidacion.TR_QnaSnapshotFuenteDetalle_Inmutable ON liquidacion.QnaSnapshotFuenteDetalle;
      ROLLBACK TRANSACTION Fase7EnteroInvalido;`);
  }
}
async function assertNoProjectionEvidence(transaction:sql.Transaction,id:string,invalidCase:string):Promise<void> {
  const evidence=await new sql.Request(transaction).input('Id',sql.BigInt,id).query(`
    SELECT
      (SELECT COUNT(*) FROM retenciones.RetencionHistoricoLoteV3 WHERE LiquidacionSnapshotId=@Id) Lotes,
      (SELECT COUNT(*) FROM retenciones.RetencionPCPHistoricoV3 WHERE LiquidacionSnapshotId=@Id) PCP,
      (SELECT COUNT(*) FROM retenciones.RetencionPMPHistoricoV3 WHERE LiquidacionSnapshotId=@Id) PMP,
      (SELECT COUNT(*) FROM retenciones.RetencionHIPHistoricoV3 WHERE LiquidacionSnapshotId=@Id) HIP;`);
  assert.deepEqual(Object.values(evidence.recordset[0]).map(Number),[0,0,0,0],`El caso ${invalidCase} no debe dejar evidencia`);
}
async function callLegacyPcp(transaction:sql.Transaction,id:string,usuarioId:string,details:any[],totalA2:string):Promise<void> {
  const header=new sql.Table('retenciones.TVP_RetencionPCPHeader_V3');
  header.columns.add('LiquidacionSnapshotId',sql.BigInt); header.columns.add('SourceScale',sql.TinyInt); header.columns.add('Registros',sql.Int);
  header.columns.add('TotalA2',sql.Decimal(19,2)); header.columns.add('UsuarioId',sql.NVarChar(100));
  header.rows.add(id,2,details.length,totalA2,usuarioId);
  const rows=new sql.Table('retenciones.TVP_RetencionPCPDetalle_V3');
  rows.columns.add('Orden',sql.Int); rows.columns.add('EmpleadoClave',sql.NVarChar(50)); rows.columns.add('Rfc',sql.NVarChar(20));
  rows.columns.add('Prestamo',sql.Int); rows.columns.add('Letra',sql.Int); rows.columns.add('Plazo',sql.Int);
  rows.columns.add('CapitalD6',sql.Decimal(19,6)); rows.columns.add('InteresD6',sql.Decimal(19,6)); rows.columns.add('MontoD6',sql.Decimal(19,6));
  rows.columns.add('MoratoriosD6',sql.Decimal(19,6)); rows.columns.add('TotalD6',sql.Decimal(19,6));
  for (const detail of details) {
    const p=detail.payloadCanonico;
    rows.rows.add(detail.orden,detail.empleadoClave,detail.rfc,p.prestamo,p.letra,p.plazo,p.capital_d6,p.interes_d6,p.monto_d6,p.moratorios_d6,detail.importeOficialD6);
  }
  await new sql.Request(transaction).input('Header',sql.TVP,header).input('Detalle',sql.TVP,rows).execute('retenciones.spGuardarRetencionPCPHistorico_V3');
}
async function callLegacyPmpEmpty(transaction:sql.Transaction,id:string,usuarioId:string):Promise<void> {
  const header=new sql.Table('retenciones.TVP_RetencionPMPHeader_V3');
  header.columns.add('LiquidacionSnapshotId',sql.BigInt); header.columns.add('SourceScale',sql.TinyInt); header.columns.add('Registros',sql.Int);
  header.columns.add('TotalA2',sql.Decimal(19,2)); header.columns.add('UsuarioId',sql.NVarChar(100)); header.rows.add(id,2,0,'0.00',usuarioId);
  const rows=new sql.Table('retenciones.TVP_RetencionPMPDetalle_V3');
  rows.columns.add('Orden',sql.Int); rows.columns.add('EmpleadoClave',sql.NVarChar(50)); rows.columns.add('Rfc',sql.NVarChar(20)); rows.columns.add('Prestamo',sql.Int);
  rows.columns.add('Letra',sql.Int); rows.columns.add('Plazo',sql.Int); rows.columns.add('CapitalD6',sql.Decimal(19,6)); rows.columns.add('InteresD6',sql.Decimal(19,6));
  rows.columns.add('MoratoriosD6',sql.Decimal(19,6)); rows.columns.add('SeguroD6',sql.Decimal(19,6)); rows.columns.add('TotalD6',sql.Decimal(19,6));
  await new sql.Request(transaction).input('Header',sql.TVP,header).input('Detalle',sql.TVP,rows).execute('retenciones.spGuardarRetencionPMPHistorico_V3');
}
async function assertInvalidLegacyNullInsert(transaction:sql.Transaction,id:string,usuarioId:string):Promise<void> {
  await new sql.Request(transaction).query('SAVE TRANSACTION Fase7LegacyNull;');
  try {
    await assert.rejects(new sql.Request(transaction).input('Id',sql.BigInt,id).input('UsuarioId',sql.NVarChar(100),usuarioId).query(`
      INSERT retenciones.RetencionPCPHistoricoV3(LiquidacionSnapshotId,Orden,EmpleadoClave,Prestamo,CapitalD6,InteresD6,MontoD6,MoratoriosD6,TotalD6,SourceScale,TotalLoteA2,UsuarioId)
      VALUES(@Id,2000000,N'1',NULL,NULL,0,0,0,0,2,0,@UsuarioId);`),/CK_RetencionPCPHistoricoV3_LegacyNoNulo|CHECK constraint/);
  } finally {
    await new sql.Request(transaction).query('ROLLBACK TRANSACTION Fase7LegacyNull;');
  }
}
async function assertPcpRetryTamper(transaction:sql.Transaction,id:string,userId:string,tamper:'multiplicity'|'identity'|'amount'|'component'|'source'|'orphan'):Promise<void> {
  await new sql.Request(transaction).query('SAVE TRANSACTION Fase7Tamper;');
  try {
    await new sql.Request(transaction).input('Id',sql.BigInt,id).input('Tamper',sql.VarChar(20),tamper).query(`
      INSERT retenciones.RetencionPCPHistoricoV3
        (LiquidacionSnapshotId,Orden,EmpleadoClave,Rfc,Prestamo,Letra,Plazo,CapitalD6,InteresD6,MontoD6,MoratoriosD6,TotalD6,SourceScale,TotalLoteA2,UsuarioId,RetencionHistoricoLoteV3Id,Interno,Nombre,ClaveFilaHash,HashFila,PayloadCanonico,PayloadVersion,IdentificadorFuente,QnaSnapshotDetalleId,EsHuerfano)
      SELECT TOP (1) LiquidacionSnapshotId,1000000,
        IIF(@Tamper='identity',N'777777',EmpleadoClave),Rfc,Prestamo,Letra,Plazo,
        IIF(@Tamper='component',COALESCE(CapitalD6,0)+1,CapitalD6),InteresD6,MontoD6,MoratoriosD6,
        IIF(@Tamper='amount',TotalD6+1,TotalD6),SourceScale,TotalLoteA2,UsuarioId,RetencionHistoricoLoteV3Id,
        IIF(@Tamper='identity',777777,Interno),Nombre,ClaveFilaHash,HashFila,PayloadCanonico,PayloadVersion,
        IIF(@Tamper='source',IdentificadorFuente+N':TAMPER',IdentificadorFuente),
        IIF(@Tamper IN('identity','orphan'),NULL,QnaSnapshotDetalleId),IIF(@Tamper IN('identity','orphan'),1,EsHuerfano)
      FROM retenciones.RetencionPCPHistoricoV3 WHERE LiquidacionSnapshotId=@Id ORDER BY IIF(QnaSnapshotDetalleId IS NULL,1,0),Orden;`);
    await assert.rejects(project(transaction,id,userId),/RETENCION_PCP_V3_REINTENTO_DIFERENTE/);
  } finally {
    await new sql.Request(transaction).query('ROLLBACK TRANSACTION Fase7Tamper;');
  }
}
async function assertPcpCompletenessRejects(transaction:sql.Transaction,id:string,tamper:'payloadVersion'|'nullHash'):Promise<void> {
  await new sql.Request(transaction).query('SAVE TRANSACTION Fase7Constraint;');
  try {
    await assert.rejects(new sql.Request(transaction).input('Id',sql.BigInt,id).input('Tamper',sql.VarChar(20),tamper).query(`
      INSERT retenciones.RetencionPCPHistoricoV3
        (LiquidacionSnapshotId,Orden,EmpleadoClave,Rfc,Prestamo,Letra,Plazo,CapitalD6,InteresD6,MontoD6,MoratoriosD6,TotalD6,SourceScale,TotalLoteA2,UsuarioId,RetencionHistoricoLoteV3Id,Interno,Nombre,ClaveFilaHash,HashFila,PayloadCanonico,PayloadVersion,IdentificadorFuente,QnaSnapshotDetalleId,EsHuerfano)
      SELECT TOP (1) LiquidacionSnapshotId,1000001,EmpleadoClave,Rfc,Prestamo,Letra,Plazo,CapitalD6,InteresD6,MontoD6,MoratoriosD6,TotalD6,SourceScale,TotalLoteA2,UsuarioId,RetencionHistoricoLoteV3Id,Interno,Nombre,ClaveFilaHash,
        IIF(@Tamper='nullHash',NULL,HashFila),PayloadCanonico,IIF(@Tamper='payloadVersion',2,PayloadVersion),IdentificadorFuente,QnaSnapshotDetalleId,EsHuerfano
      FROM retenciones.RetencionPCPHistoricoV3 WHERE LiquidacionSnapshotId=@Id ORDER BY Orden;`),/CHECK constraint|CK_RetencionPCPHistoricoV3_CompletoV5/);
  } finally {
    await new sql.Request(transaction).query('ROLLBACK TRANSACTION Fase7Constraint;');
  }
}
async function counts(pool:sql.ConnectionPool):Promise<Record<string,number>> {
  const row=(await pool.request().query(`SELECT (SELECT COUNT(*) FROM retenciones.RetencionHistoricoLoteV3) Lotes,
    (SELECT COUNT(*) FROM retenciones.RetencionPCPHistoricoV3) PCP,(SELECT COUNT(*) FROM retenciones.RetencionPMPHistoricoV3) PMP,(SELECT COUNT(*) FROM retenciones.RetencionHIPHistoricoV3) HIP;`)).recordset[0];
  return Object.fromEntries(Object.entries(row).map(([key,value])=>[key,Number(value)]));
}
function d6ToA2(values:string[]):string { const units=values.reduce((sum,value)=>sum+BigInt(value.replace('.','')),0n)/10000n; return `${units/100n}.${String(units%100n).padStart(2,'0')}`; }
function addA2(...values:string[]):string { const units=values.reduce((sum,value)=>sum+BigInt(value.replace('.','')),0n); return `${units/100n}.${String(units%100n).padStart(2,'0')}`; }
main().catch((error)=>{ console.error(error); process.exitCode=1; });
