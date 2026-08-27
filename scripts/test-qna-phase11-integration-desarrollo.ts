import assert from 'node:assert/strict';
import sql from 'mssql';
import {randomUUID} from 'node:crypto';
import {DATABASE_ENVIRONMENTS,assertDatabaseEnvironment} from '../src/config/databaseEnvironments.js';
const development=DATABASE_ENVIRONMENTS.DESARROLLO;process.env.SQLSERVER_DB=development.sqlDatabase;process.env.FIREBIRD_DATABASE=development.firebirdDatabase;
assertDatabaseEnvironment('DESARROLLO',process.env.SQLSERVER_DB,process.env.FIREBIRD_DATABASE);
const {connectDatabase,closeDatabaseConnection}=await import('../src/db/mssql.js');const {LiquidacionQnaRepository}=await import('../src/modules/liquidacionQna/infrastructure/persistence/LiquidacionQnaRepository.js');
const pool=await connectDatabase();const tx=new sql.Transaction(pool);let active=false;
try{await tx.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);active=true;const repo=new LiquidacionQnaRepository(pool);const scope={entidadId:1,anio:2096,quincena:23,organica0:'96',organica1:'96',organica2:'96',organica3:'96'};
  const links=(await new sql.Request(tx).query(`SELECT (SELECT TOP(1)SnapshotId FROM aportaciones.SnapshotCalculoV2 ORDER BY SnapshotId)SnapshotId,
    (SELECT TOP(1)Id FROM dbo.NominaAplicacionQnalCarga ORDER BY Id)CargaId,(SELECT TOP(1)FormulaCalculoVersionId FROM aportaciones.FormulaCalculoVersion ORDER BY FormulaCalculoVersionId)FormulaId`)).recordset[0];
  assert(links.CargaId&&links.FormulaId,'QNA_PHASE11_SYNTHETIC_FORMULA_LOAD_REQUIRED');
  if(!links.SnapshotId)links.SnapshotId=(await new sql.Request(tx).input('Carga',sql.BigInt,links.CargaId).input('Formula',sql.BigInt,links.FormulaId).query(`
    INSERT aportaciones.SnapshotCalculoV2(EntidadId,Anio,Quincena,Periodo,Organica0,Organica1,Organica2,Organica3,Ambiente,Fuente,Estado,FormulaCalculoVersionId,NominaCargaId,PrecisionPolicy,VersionEsquema,Revision,HashContenido,Registros,CAIR,FRA,FRE,FH,FV,FAA,FAE,FAT,FAI,EsCerrado,UsuarioId)
    OUTPUT INSERTED.SnapshotId VALUES(1,2096,23,'2396','96','96','96','96','DESARROLLO','LIQUIDACION_V2','COMPLETO',@Formula,@Carga,'MXN-BASE2-LEAF2-FUND2-APSFONDOS-v3',5,1,REPLICATE('B',64),0,0,0,0,0,0,0,0,0,0,1,'phase11')`)).recordset[0].SnapshotId;
  const snapshot=(await new sql.Request(tx).input('V2',sql.BigInt,links.SnapshotId).input('Carga',sql.BigInt,links.CargaId).input('Formula',sql.BigInt,links.FormulaId).query(`
    INSERT liquidacion.QnaSnapshot(EntidadId,Anio,Quincena,Periodo,Organica0,Organica1,Organica2,Organica3,Ambiente,Estado,Revision,PrecisionPolicy,VersionEsquema,HashContenido,SnapshotCalculoV2Id,NominaCargaId,FormulaCalculoVersionId,FuentesEsperadas,FuentesCompletas,UsuarioId)
    OUTPUT INSERTED.LiquidacionSnapshotId VALUES(1,2096,23,'2396','96','96','96','96','DESARROLLO','COMPLETO',1,'MXN-BASE2-LEAF2-FUND2-APSFONDOS-v3',5,REPLICATE('A',64),@V2,@Carga,@Formula,10,10,'phase11')`)).recordset[0];
  const id=String(snapshot.LiquidacionSnapshotId);
  await new sql.Request(tx).input('Id',sql.BigInt,id).query(`
    INSERT liquidacion.QnaSnapshotFuente(LiquidacionSnapshotId,Dominio,TipoFuente,Estado,Requerida,IdentificadorFuente,HashFuente,SourceScale,Registros,NotApplicableAprobado,AprobadoPor,Evidencia,ErrorCode)
    SELECT @Id,Dominio,'FIREBIRD','NOT_APPLICABLE',1,CONCAT('SYNTHETIC:',Dominio),NULL,2,0,1,'phase11','rollback-only',NULL FROM(VALUES('AHORRO'),('VIVIENDA'),('PRESTACIONES'),('CAIR'),('GUARDERIAS'),('TRANSITORIO'),('AGUINALDO'),('PCP'),('PMP'),('HIP'))d(Dominio);
    INSERT liquidacion.QnaSnapshotTotal(LiquidacionSnapshotId,Registros,CAIRA2,FRAA2,FREA2,FHA2,FVA2,FAAA2,FAEA2,FATA2,FAIA2,AhorroA2,ViviendaA2,PrestacionesA2,GuarderiasA2,TransitorioA2,AguinaldoA2,RetencionPCPA2,RetencionPMPA2,RetencionHIPA2,TotalAportacionesA2,TotalRetencionesA2,TotalGeneralA2,CAIRFondoA2)
      VALUES(@Id,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);
    INSERT liquidacion.QnaSnapshotDecision(LiquidacionSnapshotId,Decision,PoliticaVersion,Comentario,UsuarioId)VALUES(@Id,'APROBADO','MXN-BASE2-LEAF2-FUND2-APSFONDOS-v3','synthetic','phase11');`);
  const qnaProcess=(await new sql.Request(tx).query(`INSERT liquidacion.QnaProceso(EntidadId,Anio,Quincena,Organica0,Organica1,Organica2,Organica3,UsuarioId)OUTPUT INSERTED.QnaProcesoId VALUES(1,2096,23,'96','96','96','96','phase11')`)).recordset[0];
  const event=(await new sql.Request(tx).input('P',sql.BigInt,qnaProcess.QnaProcesoId).input('Id',sql.BigInt,id).query(`INSERT liquidacion.QnaSnapshotSeleccionEvento(QnaProcesoId,LiquidacionSnapshotId,TipoEvento,Motivo,UsuarioId)OUTPUT INSERTED.QnaSnapshotSeleccionEventoId VALUES(@P,@Id,'SELECCIONADO','synthetic','phase11')`)).recordset[0];
  const bitacora=(await new sql.Request(tx).input('P',sql.BigInt,qnaProcess.QnaProcesoId).input('Id',sql.BigInt,id).input('E',sql.BigInt,event.QnaSnapshotSeleccionEventoId).query(`
    INSERT liquidacion.QnaSnapshotOficialActual(QnaProcesoId,LiquidacionSnapshotId,QnaSnapshotSeleccionEventoId)VALUES(@P,@Id,@E);
    INSERT liquidacion.QnaProcesoTransicion(QnaProcesoId,LiquidacionSnapshotId,EstadoOrigen,EstadoDestino,Motivo,UsuarioId)VALUES(@P,@Id,'OFICIAL','APLICANDO_FIREBIRD','synthetic active','phase11');
    INSERT afec.BitacoraAfectacionOrg(OrgNivel,Org0,Org1,Org2,Org3,Entidad,EntidadId,Anio,Quincena,Accion,Resultado,Usuario,AppName,AplicacionMovimientosFinalizada)
      OUTPUT INSERTED.AfectacionId VALUES(3,'96','96','96','96','AFILIADOS','1',2096,23,'APLICAR','OK','phase11','phase11',1)`)).recordsets.at(-1)![0];
  const duplicate=(await new sql.Request(tx).query(`INSERT afec.BitacoraAfectacionOrg(OrgNivel,Org0,Org1,Org2,Org3,Entidad,EntidadId,Anio,Quincena,Accion,Resultado,Usuario,AppName,AplicacionMovimientosFinalizada)
    OUTPUT INSERTED.AfectacionId VALUES(3,'96','96','96','96','AFILIADOS','1',2096,23,'APLICAR','OK','phase11-duplicate','phase11',1)`)).recordset[0];
  await assert.rejects(()=>(repo as any).requireExactBitacora(tx,scope,null,'INICIO'),(e:any)=>e.code==='QNA_BITACORA_AMBIGUA');
  await new sql.Request(tx).input('A',sql.BigInt,duplicate.AfectacionId).query(`DELETE afec.BitacoraAfectacionOrg WHERE AfectacionId=@A`);
  const transitionsBefore=Number((await new sql.Request(tx).input('P',sql.BigInt,qnaProcess.QnaProcesoId).query('SELECT COUNT(*) Total FROM liquidacion.QnaProcesoTransicion WHERE QnaProcesoId=@P')).recordset[0].Total);
  const priorLease=process.env.QNA_APPLICATION_LEASE_MS;process.env.QNA_APPLICATION_LEASE_MS='60000';await assert.rejects(()=>(repo as any).beginOrResumeApplication(id,scope,'invalid-config',tx),(e:any)=>e.code==='QNA_APLICACION_CONFIG_INVALIDA');if(priorLease===undefined)delete process.env.QNA_APPLICATION_LEASE_MS;else process.env.QNA_APPLICATION_LEASE_MS=priorLease;
  const zeroConfigWrites=(await new sql.Request(tx).input('P',sql.BigInt,qnaProcess.QnaProcesoId).query(`SELECT(SELECT COUNT(*)FROM liquidacion.QnaAplicacionIntento WHERE QnaProcesoId=@P)Attempts,(SELECT COUNT(*)FROM liquidacion.QnaProcesoTransicion WHERE QnaProcesoId=@P)Transitions`)).recordset[0];assert.equal(Number(zeroConfigWrites.Attempts),0);assert.equal(Number(zeroConfigWrites.Transitions),transitionsBefore);
  const attemptUuid=randomUUID(),claim=randomUUID();await new sql.Request(tx).input('U',sql.UniqueIdentifier,attemptUuid).input('P',sql.BigInt,qnaProcess.QnaProcesoId).input('Id',sql.BigInt,id).input('A',sql.BigInt,bitacora.AfectacionId).input('C',sql.UniqueIdentifier,claim).query(`
    INSERT liquidacion.QnaAplicacionIntento(IntentoUuid,QnaProcesoId,LiquidacionSnapshotId,AfectacionId,NumeroIntento,Estado,Fase,Activo,ClaimToken,ClaimTipo,LeaseExpiraEn,Actor)
      VALUES(@U,@P,@Id,@A,1,'ACTIVO','FIREBIRD',1,@C,'FIREBIRD',DATEADD(MINUTE,10,SYSUTCDATETIME()),'phase11')`);
  await (repo as any).renewApplicationClaim(attemptUuid,claim,'FIREBIRD','runner',tx);
  await assert.rejects(()=>(repo as any).completeFirebirdAttempt(attemptUuid,randomUUID(),'FIREBIRD_CONFIRMADO','wrong owner','runner',tx),(e:any)=>e.code==='QNA_APLICACION_CLAIM_CONFLICTO');
  await assert.rejects(()=>(repo as any).resolveUncertainApplication(id,attemptUuid,scope,'CONFIRMADA',' motivo ','evidence','admin',tx),(e:any)=>e.code==='QNA_APLICACION_CLAIM_ACTIVO');
  await assert.rejects(()=>(repo as any).resolveUncertainApplication(id,randomUUID(),scope,'CONFIRMADA',' motivo ','evidence','admin',tx),(e:any)=>e.code==='QNA_INTENTO_NO_ENCONTRADO');
  await new sql.Request(tx).input('U',sql.UniqueIdentifier,attemptUuid).query(`UPDATE liquidacion.QnaAplicacionIntento SET LeaseExpiraEn=DATEADD(MINUTE,-1,SYSUTCDATETIME()) WHERE IntentoUuid=@U`);
  await assert.rejects(()=>(repo as any).renewApplicationClaim(attemptUuid,claim,'FIREBIRD','runner',tx),(e:any)=>e.code==='QNA_APLICACION_CLAIM_CONFLICTO');
  await new sql.Request(tx).batch('SAVE TRANSACTION OutcomeFirst');
  await (repo as any).completeFirebirdAttempt(attemptUuid,claim,'FIREBIRD_REVERTIDO','rollback conocido tras expirar lease','runner',tx);
  await (repo as any).completeFirebirdAttempt(attemptUuid,claim,'FIREBIRD_REVERTIDO','replay idempotente','runner',tx);
  await assert.rejects(()=>(repo as any).completeFirebirdAttempt(attemptUuid,claim,'FIREBIRD_CONFIRMADO','opuesto','runner',tx),(e:any)=>e.code==='QNA_RESULTADO_FIREBIRD_CONFLICTO');
  await assert.rejects(()=>(repo as any).resolveUncertainApplication(id,attemptUuid,scope,'CONFIRMADA',' motivo ','evidence','admin',tx),(e:any)=>e.code==='QNA_RESOLUCION_MANUAL_CONFLICTO');
  await new sql.Request(tx).batch('ROLLBACK TRANSACTION OutcomeFirst');
  const resolved=await (repo as any).resolveUncertainApplication(id,attemptUuid,scope,'CONFIRMADA',' motivo ','evidence','admin',tx);assert.equal(resolved.action,'REANUDAR_SQL');assert.equal(resolved.intentoUuid,attemptUuid);
  await assert.rejects(()=>(repo as any).completeFirebirdAttempt(attemptUuid,claim,'FIREBIRD_CONFIRMADO','commit conocido tardio','runner',tx),(e:any)=>e.code==='QNA_RESULTADO_FIREBIRD_CONFLICTO_RESOLUCION');
  const attemptB=randomUUID();await new sql.Request(tx).input('U',sql.UniqueIdentifier,attemptB).input('P',sql.BigInt,qnaProcess.QnaProcesoId).input('Id',sql.BigInt,id).input('A',sql.BigInt,bitacora.AfectacionId).query(`INSERT liquidacion.QnaAplicacionIntento(IntentoUuid,QnaProcesoId,LiquidacionSnapshotId,AfectacionId,NumeroIntento,Estado,Fase,Activo,Actor)VALUES(@U,@P,@Id,@A,2,'REVERTIDO','FIREBIRD',0,'phase11-b')`);
  const replay=await (repo as any).resolveUncertainApplication(id,attemptUuid,scope,'CONFIRMADA','motivo','evidence','admin',tx);assert.equal(replay.idempotente,true);assert.equal(replay.intentoUuid,attemptUuid);
  await assert.rejects(()=>(repo as any).resolveUncertainApplication(id,attemptB,scope,'CONFIRMADA','motivo','evidence','admin',tx),(e:any)=>e.code==='QNA_RESOLUCION_MANUAL_CONFLICTO');
  await new sql.Request(tx).input('U',sql.UniqueIdentifier,attemptB).query(`DELETE liquidacion.QnaAplicacionIntento WHERE IntentoUuid=@U`);
  await assert.rejects(()=>(repo as any).resolveUncertainApplication(id,attemptUuid,scope,'CONFIRMADA','motivo','changed','admin',tx),(e:any)=>e.code==='QNA_RESOLUCION_MANUAL_CONFLICTO');
  await assert.rejects(()=>(repo as any).resolveUncertainApplication(id,attemptUuid,scope,'REVERTIDA','motivo','evidence','admin',tx),(e:any)=>e.code==='QNA_RESOLUCION_MANUAL_CONFLICTO');
  const recovery=await (repo as any).beginOrResumeApplication(id,scope,'runner',tx);assert.equal(recovery.afectacionId,Number(bitacora.AfectacionId));assert(recovery.claimToken);
  await assert.rejects(()=>(repo as any).beginOrResumeApplication(id,scope,'second',tx),(e:any)=>e.code==='QNA_RECUPERACION_CLAIM_ACTIVO');
  await (repo as any).advanceRecoveryAttempt(attemptUuid,recovery.claimToken,'LINEA_CONFIRMADA','line','runner',tx);
  assert.equal((await (repo as any).resolveUncertainApplication(id,attemptUuid,scope,'CONFIRMADA','motivo','evidence','admin',tx)).idempotente,true);
  await (repo as any).releaseRecoveryClaim(attemptUuid,recovery.claimToken,'revision failed','runner',tx);
  const resumed=await (repo as any).beginOrResumeApplication(id,scope,'runner2',tx);assert.equal(resumed.estadoProceso,'LINEA_CONFIRMADA');assert.equal(resumed.afectacionId,Number(bitacora.AfectacionId));
  const counts=(await new sql.Request(tx).query(`SELECT(SELECT COUNT(*)FROM liquidacion.QnaAplicacionIntento WHERE IntentoUuid='${attemptUuid}')Attempts,
    (SELECT COUNT(*)FROM liquidacion.QnaAplicacionIntentoEvento e JOIN liquidacion.QnaAplicacionIntento i ON i.QnaAplicacionIntentoId=e.QnaAplicacionIntentoId WHERE i.IntentoUuid='${attemptUuid}')Events,
    (SELECT COUNT(*)FROM liquidacion.QnaAplicacionResolucion r JOIN liquidacion.QnaAplicacionIntento i ON i.QnaAplicacionIntentoId=r.QnaAplicacionIntentoId WHERE i.IntentoUuid='${attemptUuid}')Resolutions`)).recordset[0];
  assert.equal(Number(counts.Attempts),1);assert(Number(counts.Events)>=5);assert.equal(Number(counts.Resolutions),1);
  await tx.rollback();active=false;const permanent=(await pool.request().query(`SELECT
    (SELECT COUNT(*)FROM liquidacion.QnaSnapshot WHERE Anio=2096 AND Quincena=23 AND Organica0='96' AND Organica1='96' AND Organica2='96' AND Organica3='96')Snapshots,
    (SELECT COUNT(*)FROM liquidacion.QnaProceso WHERE Anio=2096 AND Quincena=23 AND Organica0='96' AND Organica1='96' AND Organica2='96' AND Organica3='96')Processes,
    (SELECT COUNT(*)FROM afec.BitacoraAfectacionOrg WHERE Anio=2096 AND Quincena=23 AND Org0='96' AND Org1='96' AND Org2='96' AND Org3='96')Bitacoras,
    (SELECT COUNT(*)FROM aportaciones.SnapshotCalculoV2 WHERE Anio=2096 AND Quincena=23 AND Organica0='96' AND Organica1='96' AND Organica2='96' AND Organica3='96')V2`)).recordset[0];
  assert.deepEqual(Object.values(permanent).map(Number),[0,0,0,0]);console.log('QNA_PHASE11_INTEGRATION_DESARROLLO_OK');
}finally{if(active)await tx.rollback().catch(()=>undefined);await closeDatabaseConnection();}
