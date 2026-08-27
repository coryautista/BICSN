import assert from 'node:assert/strict';
import { assertManualResolutionAllowed, decideQnaApplicationAction, manualResolutionDestination, qnaApplicationHeartbeatMs, qnaApplicationLeaseMs, qnaApplicationRuntimeConfig } from '../src/modules/liquidacionQna/domain/services/QnaApplicationSagaPolicy.js';
import { executeTypedTransaction, type FirebirdTransactionHandle } from '../src/db/firebird.js';
import { AplicarBDIssspeaQNACommand, type AplicarQnaDependencies } from '../src/modules/afiliado/application/commands/AplicarBDIssspeaQNACommand.js';
import { LiquidacionQnaError } from '../src/modules/liquidacionQna/domain/errors.js';
import type { QnaProcessState } from '../src/modules/liquidacionQna/domain/entities/LiquidacionQna.js';
import { ResolveUncertainQnaApplicationCommand } from '../src/modules/liquidacionQna/application/commands/ResolveUncertainQnaApplicationCommand.js';
import { readFile } from 'node:fs/promises';

const actions: Record<QnaProcessState,string>={OFICIAL:'EJECUTAR_FIREBIRD',FIREBIRD_REVERTIDO:'EJECUTAR_FIREBIRD',APLICANDO_FIREBIRD:'RESOLUCION_MANUAL',
  APLICACION_INCIERTA:'RESOLUCION_MANUAL',FIREBIRD_CONFIRMADO:'REANUDAR_SQL',LINEA_CONFIRMADA:'REANUDAR_SQL',REVISA_PROGRAMADA:'REANUDAR_SQL',TERMINADO:'TERMINADA'};
for(const [state,action] of Object.entries(actions))assert.equal(decideQnaApplicationAction(state as QnaProcessState),action);
assert.equal(manualResolutionDestination('CONFIRMADA'),'FIREBIRD_CONFIRMADO');assert.equal(manualResolutionDestination('REVERTIDA'),'FIREBIRD_REVERTIDO');
for(const state of Object.keys(actions) as QnaProcessState[]){if(state==='APLICANDO_FIREBIRD'||state==='APLICACION_INCIERTA')assert.doesNotThrow(()=>assertManualResolutionAllowed(state));
  else assert.throws(()=>assertManualResolutionAllowed(state),(e:any)=>e.code==='QNA_RESOLUCION_MANUAL_CONFLICTO');}
const originalLease=process.env.QNA_APPLICATION_LEASE_MS,originalHeartbeat=process.env.QNA_APPLICATION_HEARTBEAT_MS;
process.env.QNA_APPLICATION_LEASE_MS='60000';assert.throws(()=>qnaApplicationLeaseMs(),(e:any)=>e.code==='QNA_APLICACION_CONFIG_INVALIDA');
process.env.QNA_APPLICATION_LEASE_MS='900000';process.env.QNA_APPLICATION_HEARTBEAT_MS='400000';assert.throws(()=>qnaApplicationHeartbeatMs(),(e:any)=>e.code==='QNA_APLICACION_CONFIG_INVALIDA');
if(originalLease===undefined)delete process.env.QNA_APPLICATION_LEASE_MS;else process.env.QNA_APPLICATION_LEASE_MS=originalLease;
if(originalHeartbeat===undefined)delete process.env.QNA_APPLICATION_HEARTBEAT_MS;else process.env.QNA_APPLICATION_HEARTBEAT_MS=originalHeartbeat;
assert(qnaApplicationRuntimeConfig().heartbeatMs<=qnaApplicationRuntimeConfig().leaseMs/3);

const typed=async(options:{startError?:Error;callbackError?:Error;commitError?:Error;rollbackError?:Error;valid?:boolean}={})=>{
  const calls:string[]=[];
  const result=await executeTypedTransaction(async()=>{
    if(options.startError)throw options.startError;
    return {context:{},isValid:()=>options.valid!==false,commit:async()=>{calls.push('commit');if(options.commitError)throw options.commitError;},
      rollback:async()=>{calls.push('rollback');if(options.rollbackError)throw options.rollbackError;}} satisfies FirebirdTransactionHandle<{}>;
  },async()=>{calls.push('callback');if(options.callbackError)throw options.callbackError;return 7;});
  return {result,calls};
};
assert.deepEqual((await typed()).result,{outcome:'COMMIT_CONFIRMADO',value:7});
for(const step of ['C','F','EBI']){const x=await typed({callbackError:new Error(step)});assert.equal(x.result.outcome,'ROLLBACK_CONFIRMADO');assert.deepEqual(x.calls,['callback','rollback']);}
const commitFailure=await typed({commitError:new Error('commit failed')});assert.equal(commitFailure.result.outcome,'RESULTADO_INCIERTO');assert.deepEqual(commitFailure.calls,['callback','commit']);
assert.equal((await typed({callbackError:new Error('C'),rollbackError:new Error('rollback failed')})).result.outcome,'RESULTADO_INCIERTO');
assert.equal((await typed({callbackError:new Error('invalid procedure input')})).result.outcome,'ROLLBACK_CONFIRMADO');
assert.equal((await typed({callbackError:new Error('connection closed'),valid:false})).result.outcome,'RESULTADO_INCIERTO');
assert.equal((await typed({startError:new Error('connection before start')})).result.outcome,'NO_INICIADA');

const scope={entidadId:1,anio:2026,quincena:15,organica0:'04',organica1:'24',organica2:'01',organica3:'02'};
let invalidConfigBegins=0;process.env.QNA_APPLICATION_LEASE_MS='60000';const invalidConfigCommand=new AplicarBDIssspeaQNACommand({} as any,{beginOrResumeApplication:async()=>{invalidConfigBegins++;}} as any,{} as any);
await assert.rejects(()=>invalidConfigCommand.execute({...scope,liquidacionSnapshotId:'1',usuarioId:'7'}),(e:any)=>e.code==='QNA_APLICACION_CONFIG_INVALIDA');assert.equal(invalidConfigBegins,0);
if(originalLease===undefined)delete process.env.QNA_APPLICATION_LEASE_MS;else process.env.QNA_APPLICATION_LEASE_MS=originalLease;
const attemptUuid='11111111-1111-4111-8111-111111111111';
const manualCalls:any[]=[];const manual=new ResolveUncertainQnaApplicationCommand({resolveUncertainApplication:async(...args:any[])=>{manualCalls.push(args);return {intentoUuid:args[1],resolution:args[3],idempotente:manualCalls.length>1,action:'REINTENTAR_FIREBIRD'};}} as any,{execute:async()=>({})} as any);
for(const resolution of ['CONFIRMADA','REVERTIDA'] as const)await manual.execute({...scope,liquidacionSnapshotId:'1',intentoUuid:attemptUuid,resolution,motivo:'m',evidencia:'e',usuarioId:'admin'});
assert.deepEqual(manualCalls.map(call=>[call[1],call[3]]),[[attemptUuid,'CONFIRMADA'],[attemptUuid,'REVERTIDA']]);
let resumedByManual=0;const manualConfirm=new ResolveUncertainQnaApplicationCommand({resolveUncertainApplication:async()=>({intentoUuid:attemptUuid,resolution:'CONFIRMADA',action:'REANUDAR_SQL'})} as any,
  {execute:async()=>{resumedByManual++;return {estadoProceso:'TERMINADO'};}} as any);const manualConfirmed=await manualConfirm.execute({...scope,liquidacionSnapshotId:'1',intentoUuid:attemptUuid,resolution:'CONFIRMADA',motivo:'m',evidencia:'e',usuarioId:'admin'});
assert.equal(resumedByManual,1);assert.equal((manualConfirmed as any).recuperacion.estadoProceso,'TERMINADO');
const pendingManual=new ResolveUncertainQnaApplicationCommand({resolveUncertainApplication:async()=>({intentoUuid:attemptUuid,resolution:'CONFIRMADA',action:'REANUDAR_SQL'})} as any,
  {execute:async()=>{throw new LiquidacionQnaError('detalle interno','QNA_RECUPERACION_SQL_PENDIENTE',500);}} as any);
const pendingResult=await pendingManual.execute({...scope,liquidacionSnapshotId:'1',intentoUuid:attemptUuid,resolution:'CONFIRMADA',motivo:'m',evidencia:'e',usuarioId:'admin'});
assert.equal((pendingResult as any).resolutionCommitted,true);assert.equal((pendingResult as any).recuperacionPendiente,true);assert.equal((pendingResult as any).recuperacionError.code,'QNA_RECUPERACION_SQL_PENDIENTE');assert.doesNotMatch((pendingResult as any).recuperacionError.message,/detalle interno/);
const makeHarness=(initial:QnaProcessState,options:{failProcedure?:'C'|'F'|'EBI';even?:boolean;lineFail?:boolean;revisionFail?:boolean;bitacoraFail?:boolean;transitionFail?:QnaProcessState;sftpFail?:boolean;heartbeatFailAfterFirebird?:boolean;recoveryHeartbeatFailAt?:number;forcedUncertain?:boolean;persistenceConflict?:boolean}={})=>{
  const calls:string[]=[];let state=initial,recoveryRenewals=0,timerCleared=false,timerFailure=false,lineCreated=false;let heartbeatTick:(()=>void)|undefined;const q=options.even?16:15;const localScope={...scope,quincena:q};const periodo=`${q}26`;
  const repo:any={beginOrResumeApplication:async()=>({liquidacionSnapshotId:'1',estadoProceso:state,action:decideQnaApplicationAction(state),scope:localScope,periodo,idempotente:state!=='OFICIAL'&&state!=='FIREBIRD_REVERTIDO',intentoUuid:'attempt',afectacionId:99,claimToken:['TERMINADO','APLICANDO_FIREBIRD','APLICACION_INCIERTA'].includes(state)?null:'claim'}),
    renewApplicationClaim:async(_a:string,_c:string,type:string)=>{calls.push(`renew:${type}`);if(type==='RECUPERACION'&&options.recoveryHeartbeatFailAt===++recoveryRenewals)throw new Error('renew failed');if(type==='FIREBIRD'&&timerFailure)throw new Error('renew failed');},
    completeFirebirdAttempt:async(_a:string,_c:string,destination:QnaProcessState)=>{calls.push(`transition:${destination}`);if(options.persistenceConflict)throw new LiquidacionQnaError('manual first','QNA_RESULTADO_FIREBIRD_CONFLICTO_RESOLUCION',409);if(options.transitionFail===destination)throw new Error('transition');state=destination;},
    advanceRecoveryAttempt:async(_a:string,_c:string,destination:QnaProcessState)=>{calls.push(`transition:${destination}`);if(options.transitionFail===destination)throw new Error('transition');state=destination;},
    releaseRecoveryClaim:async()=>{calls.push('release');}};
  const line:any={createOrReuseFromSnapshot:async()=>{calls.push('line');if(options.lineFail)throw new Error('line');const reutilizada=lineCreated;lineCreated=true;return {reutilizada};},
    scheduleRevisionFromSnapshot:async()=>{calls.push('revisa');if(options.revisionFail)throw new Error('revision');}};
  const deps:AplicarQnaDependencies={executeFirebirdTransaction:async fn=>{try{const value=await fn({});if(options.heartbeatFailAfterFirebird){timerFailure=true;heartbeatTick?.();await Promise.resolve();}if(options.forcedUncertain)return {outcome:'RESULTADO_INCIERTO',error:new Error('commit desconocido')} as const;return {outcome:'COMMIT_CONFIRMADO',value} as const;}catch(error){if(options.heartbeatFailAfterFirebird){timerFailure=true;heartbeatTick?.();await Promise.resolve();}return {outcome:'ROLLBACK_CONFIRMADO',error} as const;}},
    ejecutarAP_P_APLICAR:async(_a,_b,_c,_d,type)=>{calls.push(type);if(options.failProcedure===type)throw new Error(type);},
    ejecutarEBI2_RECIBOS_AP:async()=>{calls.push('EBI');if(options.failProcedure==='EBI')throw new Error('EBI');return {mensaje:'ok'};},
    actualizarBitacora:async()=>{calls.push('bitacora');return {actualizado:!options.bitacoraFail,registrosAfectados:options.bitacoraFail?0:1};},
    guardarLogFtp:async()=>{calls.push('sftp');if(options.sftpFail)throw new Error('sftp');return '/ok';},heartbeatIntervalMs:()=>10_000,
    setHeartbeatInterval:(callback)=>{heartbeatTick=callback;return {} as any;},clearHeartbeatInterval:()=>{timerCleared=true;}};
  return {command:new AplicarBDIssspeaQNACommand(line,repo,deps),calls,data:{...localScope,usuarioId:'7',liquidacionSnapshotId:'1'},timerCleared:()=>timerCleared};
};
let h=makeHarness('OFICIAL');let result=await h.command.execute(h.data);assert.equal(result.estadoProceso,'TERMINADO');assert.deepEqual(h.calls.filter(x=>['C','F','transition:FIREBIRD_CONFIRMADO'].includes(x)).slice(0,3),['C','F','transition:FIREBIRD_CONFIRMADO']);assert(!h.calls.includes('EBI'));assert(h.calls.filter(x=>x==='renew:FIREBIRD').length>=5);assert(h.calls.filter(x=>x==='renew:RECUPERACION').length>=6);assert(h.timerCleared());
h=makeHarness('OFICIAL',{even:true});await h.command.execute(h.data);assert(h.calls.includes('EBI'));
for(const failure of ['C','F','EBI'] as const){h=makeHarness('OFICIAL',{even:failure==='EBI',failProcedure:failure});await assert.rejects(()=>h.command.execute(h.data),(e:any)=>e instanceof LiquidacionQnaError&&e.code==='QNA_FIREBIRD_REVERTIDO');assert(h.calls.includes('transition:FIREBIRD_REVERTIDO'));}
for(const state of ['FIREBIRD_CONFIRMADO','LINEA_CONFIRMADA'] as const){h=makeHarness(state);await h.command.execute(h.data);assert.equal(h.calls.filter(x=>x==='line').length,state==='FIREBIRD_CONFIRMADO'?1:0);assert.equal(h.calls.filter(x=>x==='revisa').length,1);assert(!h.calls.includes('C'));}
h=makeHarness('REVISA_PROGRAMADA');await h.command.execute(h.data);assert(!h.calls.includes('line'));assert(!h.calls.includes('revisa'));assert(h.calls.includes('bitacora'));
h=makeHarness('TERMINADO');result=await h.command.execute(h.data);assert.equal(result.idempotente,true);assert.deepEqual(h.calls,[]);
for(const state of ['APLICANDO_FIREBIRD','APLICACION_INCIERTA'] as const){h=makeHarness(state);await assert.rejects(()=>h.command.execute(h.data),(e:any)=>e.code==='QNA_APLICACION_REQUIERE_RESOLUCION_MANUAL');assert.deepEqual(h.calls,[]);}
h=makeHarness('FIREBIRD_REVERTIDO');await h.command.execute(h.data);assert(h.calls.includes('C'),'Solo REVERTIDO permite reintentar Firebird');
h=makeHarness('OFICIAL',{heartbeatFailAfterFirebird:true});result=await h.command.execute(h.data);assert.equal(result.estadoProceso,'TERMINADO');assert(h.calls.includes('transition:FIREBIRD_CONFIRMADO'));assert(!h.calls.includes('transition:APLICACION_INCIERTA'));assert(h.timerCleared());
h=makeHarness('OFICIAL',{failProcedure:'F',heartbeatFailAfterFirebird:true});await assert.rejects(()=>h.command.execute(h.data),(e:any)=>e.code==='QNA_FIREBIRD_REVERTIDO');assert(h.calls.includes('transition:FIREBIRD_REVERTIDO'));assert(!h.calls.includes('transition:APLICACION_INCIERTA'));assert(h.timerCleared());
h=makeHarness('OFICIAL',{forcedUncertain:true});await assert.rejects(()=>h.command.execute(h.data),(e:any)=>e.code==='QNA_APLICACION_REQUIERE_RESOLUCION_MANUAL');assert(h.calls.includes('transition:APLICACION_INCIERTA'));
h=makeHarness('OFICIAL',{persistenceConflict:true});await assert.rejects(()=>h.command.execute(h.data),(e:any)=>e.code==='QNA_RESULTADO_FIREBIRD_PERSISTENCIA_CONFLICTO');assert(h.calls.includes('transition:FIREBIRD_CONFIRMADO'));
h=makeHarness('FIREBIRD_CONFIRMADO',{recoveryHeartbeatFailAt:2});await assert.rejects(()=>h.command.execute(h.data),(e:any)=>e.code==='QNA_RECUPERACION_SQL_PENDIENTE');assert.equal(h.calls.filter(x=>x==='line').length,1);assert(h.calls.includes('release'));assert(h.timerCleared());
result=await h.command.execute(h.data);assert.equal(result.estadoProceso,'TERMINADO');assert.equal(h.calls.filter(x=>x==='line').length,2);
h=makeHarness('FIREBIRD_CONFIRMADO',{lineFail:true});await assert.rejects(()=>h.command.execute(h.data),(e:any)=>e.code==='QNA_RECUPERACION_SQL_PENDIENTE');assert(h.calls.includes('release'));
h=makeHarness('FIREBIRD_CONFIRMADO',{revisionFail:true});await assert.rejects(()=>h.command.execute(h.data),(e:any)=>e.code==='QNA_RECUPERACION_SQL_PENDIENTE');assert(h.calls.includes('transition:LINEA_CONFIRMADA'));assert.equal(h.calls.filter(x=>x==='line').length,1);
const callsAfterRevisionFailure=h.calls.length;await assert.rejects(()=>h.command.execute(h.data),(e:any)=>e.code==='QNA_RECUPERACION_SQL_PENDIENTE');assert.equal(h.calls.filter(x=>x==='line').length,1);assert(h.calls.length>callsAfterRevisionFailure);
h=makeHarness('REVISA_PROGRAMADA',{bitacoraFail:true});await assert.rejects(()=>h.command.execute(h.data),(e:any)=>e.code==='QNA_RECUPERACION_SQL_PENDIENTE');
for(const transition of ['FIREBIRD_CONFIRMADO','LINEA_CONFIRMADA','REVISA_PROGRAMADA'] as const){h=makeHarness('OFICIAL',{transitionFail:transition});await assert.rejects(()=>h.command.execute(h.data),
  (e:any)=>e.code===(transition==='FIREBIRD_CONFIRMADO'?'QNA_APLICACION_REQUIERE_RESOLUCION_MANUAL':'QNA_RECUPERACION_SQL_PENDIENTE'));}
h=makeHarness('REVISA_PROGRAMADA',{transitionFail:'TERMINADO'});await assert.rejects(()=>h.command.execute(h.data));
for(const option of [{sftpFail:true}]){h=makeHarness('REVISA_PROGRAMADA',option);result=await h.command.execute(h.data);assert.equal(result.exito,true);assert.equal(result.estadoProceso,'TERMINADO');}
const repositorySource=await readFile(new URL('../src/modules/liquidacionQna/infrastructure/persistence/LiquidacionQnaRepository.ts',import.meta.url),'utf8');
const beginSource=repositorySource.slice(repositorySource.indexOf('async beginOrResumeApplication'),repositorySource.indexOf('async resolveUncertainApplication'));
assert.match(beginSource,/ISOLATION_LEVEL\.SERIALIZABLE/);assert.match(beginSource,/acquireQnaScopeLock/);assert.match(beginSource,/await this\.promote\(id, null, usuarioId, transaction\)/);
assert.match(beginSource,/requireExactBitacora\(transaction,scope,null,'INICIO'\)/);assert(beginSource.indexOf("requireExactBitacora(transaction,scope,null,'INICIO')")<beginSource.indexOf("'APLICANDO_FIREBIRD'"));
assert(beginSource.indexOf('qnaApplicationRuntimeConfig()')<beginSource.indexOf('new sql.Transaction'));
assert.doesNotMatch(beginSource,/new Date|Date\.now/);assert.match(beginSource,/SYSUTCDATETIME/);
const manualSource=repositorySource.slice(repositorySource.indexOf('async resolveUncertainApplication'),repositorySource.indexOf('async appendProcessTransition'));
assert.doesNotMatch(manualSource,/executeInTransaction|ejecutarAP_P_APLICAR|ejecutarEBI2|db\/firebird/i);assert.match(manualSource,/QnaAplicacionResolucion/);assert.doesNotMatch(manualSource,/SELECT TOP\s*\(1\)\s*\*\s*FROM liquidacion\.QnaAplicacionIntento/i);assert.match(manualSource,/WHERE IntentoUuid=@Uuid AND QnaProcesoId=@ProcesoId AND LiquidacionSnapshotId=@Id/);
const scopedAttemptSource=repositorySource.slice(repositorySource.indexOf('private async lockAttemptInScope'),repositorySource.indexOf('private async currentProcessState'));assert(scopedAttemptSource.indexOf('acquireQnaScopeLock')<scopedAttemptSource.lastIndexOf('lockAttempt(transaction'));
const commandSource=await readFile(new URL('../src/modules/afiliado/application/commands/AplicarBDIssspeaQNACommand.ts',import.meta.url),'utf8');assert.doesNotMatch(commandSource,/registrarSiguienteQna|AP_G_APLICADO_TIPO/);
assert.doesNotMatch(commandSource,/verificarAplicacionMovimientosFinalizada/);
assert.doesNotMatch(commandSource,/getQuincenaAplicacion|executeSelectableProcedure/);
assert.match(repositorySource,/async renewApplicationClaim/);assert.match(repositorySource,/CLAIM_RENOVADO/);assert.match(repositorySource,/DATEADD\(MILLISECOND,@LeaseMs,SYSUTCDATETIME\(\)\)/);
assert.doesNotMatch(repositorySource.slice(repositorySource.indexOf('async completeFirebirdAttempt'),repositorySource.indexOf('async advanceRecoveryAttempt')),/LeaseExpiraEn>SYSUTCDATETIME/);
const migrationSource=await readFile(new URL('../database/migrations/20260826_17_create_qna_phase11_attempt_ledger.sql',import.meta.url),'utf8');
for(const token of ['CK_QnaAplicacionIntento_Invariante','QNA_APLICACION_INTENTO_DATOS_INCOMPATIBLES','CLAIM_RENOVADO','CREATE OR ALTER TRIGGER'])assert(migrationSource.includes(token));
const runnerSource=await readFile(new URL('./migrate-qna-phase11-attempt-ledger-desarrollo.ts',import.meta.url),'utf8');assert.match(runnerSource,/transaction\.begin/);assert.match(runnerSource,/if\(execute\).*transaction\.commit/s);assert.match(runnerSource,/transaction\.rollback\(\).*DRY_RUN/s);
const verifierSource=await readFile(new URL('./verify-qna-phase11-state-desarrollo.ts',import.meta.url),'utf8');for(const token of ['is_not_trusted','is_disabled','filter_definition','OBJECT_DEFINITION','max_length','is_nullable'])assert(verifierSource.includes(token));
const routeSource=await readFile(new URL('../src/modules/afiliado/afiliado.routes.ts',import.meta.url),'utf8');const applyRoute=routeSource.slice(routeSource.indexOf('"/afiliado/aplicar-bdisssspea-qna"'),routeSource.indexOf('// Obtener la acción actual'));
for(const field of ['entidadId','anio','quincena','organica0','organica1','organica2','organica3'])assert(applyRoute.includes(field));
assert.match(applyRoute,/resolveOrganicaScope\(req\.user!, isAdmin \? body : \{}, 4\)/);assert.match(applyRoute,/ORGANICA_SCOPE_FORBIDDEN/);assert.match(applyRoute,/409/);
console.log('QNA_PHASE11_SAGA_OK');
