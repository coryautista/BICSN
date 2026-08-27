import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import Fastify from 'fastify';
import swagger from '@fastify/swagger';
import {registerLineaCapturaRoutes} from '../src/modules/reportes/aplicacionesQNA/lineaCaptura.routes.js';
import {LiquidacionQnaError} from '../src/modules/liquidacionQna/domain/errors.js';

const app=Fastify();await app.register(swagger,{openapi:{info:{title:'phase11-linea',version:'1'},components:{securitySchemes:{bearerAuth:{type:'http',scheme:'bearer'}}}}});
let mode:'line'|'terminal'|'missing'|'pending'|'rollback'='line',sagaCalls:any[]=[],existingCalls:any[]=[];
const line={lineaCapturaPeriodoId:1,org0:'04',org1:'24',periodo:'1526',importe:100,importeA2:'100.00',liquidacionSnapshotId:'1',lineaCaptura:'042415264700054',referencia4:'0424',
  fechaInicioPeriodo:'2026-08-01',fechaFinalPeriodo:'2026-08-15',fechaInicioVigencia:'2026-08-20',fechaFinVigencia:'2026-08-25',fechaReferenciaValidacion:'2026-08-25',tipoReferenciaValidacion:'PAGO',
  fechaLimite:'2026-08-25',fechaCondensada:'4700',montoCondensado:0,digitoVerificador:'54',usuarioId:'user',estatus:'VIGENTE',reutilizada:true,createdAt:null,updatedAt:null};
const auth=async(request:any,reply:any)=>{const profile=request.headers['x-test-user'];if(!profile)return reply.code(401).send({success:false,error:{code:'UNAUTHORIZED'}});
  request.user={sub:String(profile),roles:profile==='admin'?['admin']:['capturista'],entidades:[],idOrganica0:'04',idOrganica1:'24',idOrganica2:'01',idOrganica3:'02',jti:'test'};
  request.diScope={resolve:(name:string)=>{if(name==='aplicarBDIssspeaQNACommand')return{execute:async(input:any)=>{sagaCalls.push(input);
    if(mode==='pending')throw new LiquidacionQnaError('La recuperación SQL ya está en curso','QNA_RECUPERACION_CLAIM_ACTIVO',409);
    if(mode==='rollback')throw new LiquidacionQnaError('La transacción Firebird fue revertida','QNA_FIREBIRD_REVERTIDO',500);
    return{estadoProceso:'TERMINADO',lineaPago:mode==='line'?{...line,reutilizada:false}:null};}};
    if(name==='generateLineaCapturaPeriodoCommand')return{getExistingFromSnapshot:async(input:any)=>{existingCalls.push(input);if(mode==='missing')throw new Error('QNA_TERMINADO_LINEA_PAGO_INTEGRIDAD_INVALIDA');return line;}};
    return{execute:async()=>null};}};};
await registerLineaCapturaRoutes(app,auth);await app.ready();const url='/linea-captura-periodo';const ordinary={periodo:'1526',liquidacionSnapshotId:'1'};
let response=await app.inject({method:'POST',url,payload:ordinary});assert.equal(response.statusCode,401);
response=await app.inject({method:'POST',url,headers:{'x-test-user':'user'},payload:{...ordinary,entidadId:1,idOrg0:'04',idOrg1:'24',idOrg2:'01',idOrg3:'02'}});assert.equal(response.statusCode,403,response.body);assert.equal(sagaCalls.length,0);
response=await app.inject({method:'POST',url,headers:{'x-test-user':'admin'},payload:ordinary});assert.equal(response.statusCode,400);assert.equal(sagaCalls.length,0);
response=await app.inject({method:'POST',url,headers:{'x-test-user':'user'},payload:ordinary});assert.equal(response.statusCode,201,response.body);assert.deepEqual(
  [sagaCalls[0].entidadId,sagaCalls[0].anio,sagaCalls[0].quincena,sagaCalls[0].organica0,sagaCalls[0].organica1,sagaCalls[0].organica2,sagaCalls[0].organica3],[1,2026,15,'04','24','01','02']);
const admin={...ordinary,entidadId:2,idOrg0:'08',idOrg1:'09',idOrg2:'10',idOrg3:'11'};response=await app.inject({method:'POST',url,headers:{'x-test-user':'admin'},payload:admin});assert.equal(response.statusCode,201,response.body);
assert.deepEqual([sagaCalls.at(-1).entidadId,sagaCalls.at(-1).organica0,sagaCalls.at(-1).organica3],[2,'08','11']);
mode='terminal';response=await app.inject({method:'POST',url,headers:{'x-test-user':'user'},payload:ordinary});assert.equal(response.statusCode,200,response.body);assert.equal(response.json().data.reutilizada,true);assert.equal(existingCalls.length,1);
mode='missing';response=await app.inject({method:'POST',url,headers:{'x-test-user':'user'},payload:ordinary});assert.equal(response.statusCode,409);assert.equal(response.json().error.code,'QNA_TERMINADO_LINEA_PAGO_INTEGRIDAD_INVALIDA');
mode='pending';response=await app.inject({method:'POST',url,headers:{'x-test-user':'user'},payload:ordinary});assert.equal(response.statusCode,409);assert.equal(response.json().error.code,'QNA_RECUPERACION_CLAIM_ACTIVO');
mode='rollback';response=await app.inject({method:'POST',url,headers:{'x-test-user':'user'},payload:ordinary});assert.equal(response.statusCode,500);assert.equal(response.json().error.code,'QNA_FIREBIRD_REVERTIDO');assert.equal(response.json().success,false);
const operation=(app.swagger()as any).paths['/linea-captura-periodo'].post;for(const field of ['entidadId','idOrg0','idOrg1','idOrg2','idOrg3'])assert(operation.requestBody.content['application/json'].schema.properties[field]);
const source=await readFile(new URL('../src/modules/reportes/aplicacionesQNA/lineaCaptura.routes.ts',import.meta.url),'utf8');const post=source.slice(source.indexOf("fastify.post('/linea-captura-periodo'"),source.indexOf("fastify.get('/linea-captura-periodo'"));
assert.doesNotMatch(source,/appendProcessTransition|registrarSiguienteQnaSiDisponible/);assert.doesNotMatch(post,/executeFromSnapshot|executeSelectableProcedure|AP_G_APLICADO_TIPO/);assert.match(post,/aplicarBDIssspeaQNACommand/);assert.match(post,/saga\.execute/);assert.match(post,/getExistingFromSnapshot/);
await app.close();console.log('QNA_PHASE11_LINEA_ROUTE_OK');
