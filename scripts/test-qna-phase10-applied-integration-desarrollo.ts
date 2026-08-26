import assert from 'node:assert/strict';
import sql from 'mssql';
import {DATABASE_ENVIRONMENTS,assertDatabaseEnvironment} from '../src/config/databaseEnvironments.js';

const development=DATABASE_ENVIRONMENTS.DESARROLLO;
process.env.SQLSERVER_DB=development.sqlDatabase;
process.env.FIREBIRD_DATABASE=development.firebirdDatabase;
assertDatabaseEnvironment('DESARROLLO',process.env.SQLSERVER_DB,process.env.FIREBIRD_DATABASE);
const {connectDatabase,closeDatabaseConnection}=await import('../src/db/mssql.js');
const {LiquidacionQnaRepository}=await import('../src/modules/liquidacionQna/infrastructure/persistence/LiquidacionQnaRepository.js');
const {LiquidacionQnaError}=await import('../src/modules/liquidacionQna/domain/errors.js');
const pool=await connectDatabase();
const transaction=new sql.Transaction(pool);
let active=false;
try{
  await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);active=true;
  await new sql.Request(transaction).query(`
    INSERT afec.BitacoraAfectacionOrg(OrgNivel,Org0,Org1,Org2,Org3,Entidad,EntidadId,Anio,Quincena,Accion,Resultado,Usuario,AppName)
      VALUES(3,'95','95','95','95','AFILIADOS','1',2097,22,'TERMINADO','OK','phase10-fixture','phase10');
    INSERT aportaciones.IndividualesAhorroHistorico(clave_organica_0,clave_organica_1,quincena,anio,interno,nombre,sueldo,quinquenios,otras_prestaciones,sueldo_base,afae,afaa,total,usuario_id)
      VALUES('95','95',22,2097,700001,N'Árbol Legacy',1,2,3,4,0.5,0.734567,1.234567,'phase10');
    INSERT retenciones.PrestamosCortoPlazoHistorico(clave_organica_0,clave_organica_1,quincena,anio,periodo,interno,rfc,nombre,total,usuario_id)
      VALUES('95','95',22,2097,'2297',700001,'LEGACYRFC',N'Duplicado Uno',2.34,'phase10'),('95','95',22,2097,'2297',700001,'LEGACYRFC',N'Duplicado Dos',3.45,'phase10');
    INSERT aportaciones.ResumenHistorico(tipo_endpoint,clave_organica_0,clave_organica_1,quincena,anio,total_empleados,total_contribucion,total_sueldo_base,usuario_id)
      VALUES(N'individuales/ahorro','95','95',22,2097,1,9.99,4,'phase10');
    INSERT conciliacion.RevisionAplicacionHistorico(Organica0,Organica1,Organica2,Organica3,Periodo,CAIR,FRA,FRE,FH,FV,FAA,FAE,FAT,FAI,RegistrosOrigen,UsuarioId)
      VALUES('95','95','95','95','2297',1.01,1.02,1.03,1.04,1.05,1.06,1.07,2.13,1.08,1,'00000000-0000-0000-0000-000000000010');`);
  const repository=new LiquidacionQnaRepository(pool);
  const scope={entidadId:1,anio:2097,quincena:22,organica0:'95',organica1:'95',organica2:'95',organica3:'95'};
  const summary=await repository.getAppliedSummary({...scope,esAdmin:false},transaction);
  assert(summary);assert.equal(summary.fuente,'HISTORICO_LEGACY');assert.equal(summary.liquidacionSnapshotId,null);
  assert.equal(summary.totales.ahorroA2,'9.99');assert.equal(summary.totalStrategies.ahorroA2,'PERSISTED');
  assert.equal(summary.totales.retencionPcpA2,'5.79');assert.equal(summary.totalStrategies.retencionPcpA2,'DERIVED_DETAIL');
  assert.equal(summary.totales.viviendaA2,null);assert.equal(summary.totalStrategies.viviendaA2,'UNAVAILABLE');
  assert(summary.advertencias.some(item=>item.code==='DERIVED_DETAIL'&&item.dominio==='PCP'));
  assert(summary.fuentes.some(item=>item.dominio==='VIVIENDA'&&item.estado==='ABSENT_UNVERIFIED'));
  assert.equal('identificadorFuente' in summary.fuentes[0],false);
  const details=await repository.getAppliedDetails({...scope,dominio:'PCP',page:1,pageSize:100,esAdmin:false},transaction);
  assert(details);assert.equal(details.total,2);assert.deepEqual(details.detalles.map(row=>row.orden),[1,2]);
  assert.deepEqual(details.detalles.map(row=>row.empleadoClave),['700001','700001']);assert(details.detalles.every(row=>row.payloadVersion===null));
  const searched=await repository.getAppliedDetails({...scope,dominio:'PCP',page:1,pageSize:100,buscar:'duplicado dos',esAdmin:false},transaction);
  assert.equal(searched?.total,1);
  const list=await repository.listApplied({page:1,pageSize:100,...scope,buscar:'arbol',esAdmin:false},transaction);
  assert.equal(list.total,1);assert.equal(list.items[0].fuente,'HISTORICO_LEGACY');
  const syntheticSelections=Array.from({length:301},(_,index)=>({id:null,processId:null,version:0 as const,appliedAt:new Date('2097-01-01T00:00:00Z'),scope:{
    entidadId:1,anio:1600+index,quincena:1,organica0:'01',organica1:'01',organica2:String(Math.floor(index/100)).padStart(2,'0'),organica3:String(index%100).padStart(2,'0')}}));
  const syntheticBundles=await (repository as any).getLegacyListBundles(syntheticSelections,false,transaction);
  assert.equal(syntheticBundles.length,301,'OPENJSON debe mantener fijo el numero de parametros para mas de 300 alcances');
  await new sql.Request(transaction).query(`INSERT afec.BitacoraAfectacionOrg(OrgNivel,Org0,Org1,Org2,Org3,Entidad,EntidadId,Anio,Quincena,Accion,Resultado,Usuario,AppName)
    VALUES(3,'90','90','90','90','AFILIADOS','1',2097,22,'TERMINADO','OK','phase10-page-one','phase10'),
          (3,'91','91','91','91','AFILIADOS','1',2097,22,'TERMINADO','OK','phase10-page-two','phase10');`);
  await new sql.Request(transaction).query(`INSERT afec.BitacoraAfectacionOrg(OrgNivel,Org0,Org1,Org2,Org3,Entidad,EntidadId,Anio,Quincena,Accion,Resultado,Usuario,AppName)
    VALUES(3,'95','95','96','96','AFILIADOS','1',2097,22,'TERMINADO','OK','phase10-collision','phase10');`);
  await assert.rejects(repository.listApplied({page:1,pageSize:1,entidadId:1,anio:2097,quincena:22,esAdmin:true},transaction),
    (error:unknown)=>error instanceof LiquidacionQnaError&&error.code==='QNA_APLICADA_LEGACY_AMBIGUA'&&error.statusCode===409);
  await assert.rejects(repository.getAppliedSummary({...scope,esAdmin:false},transaction),
    (error:unknown)=>error instanceof LiquidacionQnaError&&error.code==='QNA_APLICADA_LEGACY_AMBIGUA'&&error.statusCode===409);
  await transaction.rollback();active=false;
  console.log('QNA_PHASE10_APPLIED_INTEGRATION_DESARROLLO_ROLLBACK_OK');
}finally{if(active)await transaction.rollback().catch(()=>undefined);await closeDatabaseConnection();}
