import assert from 'node:assert/strict';
import Fastify from 'fastify';
import swagger from '@fastify/swagger';
import { LiquidacionQnaError } from '../src/modules/liquidacionQna/domain/errors.js';
import { registerLiquidacionQnaRoutes } from '../src/modules/liquidacionQna/liquidacionQna.routes.js';

const app = Fastify();
await app.register(swagger, { openapi: { info: { title: 'phase9-test', version: '1' }, components: {
  securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer' } },
} } });
app.setErrorHandler((error: any, _request, reply) => reply.code(error.statusCode ?? 500).send({ ok: false, error: {
  code: error.code ?? 'INTERNAL_ERROR', message: error.message, ...(error.validation ? { details: error.validation } : {}),
} }));
let lastFilter: Record<string, unknown> = {};
let mode: 'ok' | 'missing' | 'ambiguous' = 'ok';
const domains = ['AHORRO','VIVIENDA','PRESTACIONES','CAIR','GUARDERIAS','TRANSITORIO','AGUINALDO','PCP','PMP','HIP'];
const metadata = { liquidacionSnapshotId: '9007199254740993', snapshotCalculoV2Id: '9007199254740994', nominaCargaId: '9007199254740995',
  formulaCalculoVersionId: '9007199254740996', entidadId: 1, anio: 2026, quincena: 15, periodo: '1526', organica0: '04', organica1: '24', organica2: '01', organica3: '02',
  ambiente: 'DESARROLLO', revision: 1, precisionPolicy: 'MXN-BASE2-LEAF2-FUND2-APSFONDOS-v3', hashContenido: 'A'.repeat(64),
  fechaAplicacion: '2026-08-26T12:00:00.000Z', fechaCreacion: '2026-08-26T11:00:00.000Z', fuente: 'SNAPSHOT_OFICIAL', estadoProceso: 'TERMINADO', reconstructionStrategy: null };
const totals = Object.fromEntries(['cairA2','fraA2','freA2','fhA2','fvA2','faaA2','faeA2','fatA2','faiA2','ahorroA2','viviendaA2','prestacionesA2','cairFondoA2',
  'guarderiasA2','transitorioA2','aguinaldoA2','retencionPcpA2','retencionPmpA2','retencionHipA2','totalAportacionesA2','totalRetencionesA2','totalGeneralA2'].map(key => [key,'0.00']));
const sources = (admin: boolean) => domains.map(dominio => ({ dominio, tipoFuente: 'FIREBIRD', estado: 'NOT_APPLICABLE', requerida: true, sourceScale: 2,
  registros: 0, notApplicableAprobado: true, errorCode: null, ...(admin ? { identificadorFuente: `AUDIT:${dominio}`, hashFuente: null,
    aprobadoPor: 'admin-id', evidencia: 'audit evidence' } : {}) }));
const query = (name: string) => ({ execute: async (filter: Record<string, any>) => {
  lastFilter = filter;
  if (mode === 'ambiguous') throw new LiquidacionQnaError('Ambigua', 'QNA_APLICADA_OFICIAL_AMBIGUA', 409);
  if (mode === 'missing') return null;
  const base = { ...metadata, fuentes: sources(Boolean(filter.esAdmin)), advertencias: [] };
  if (name === 'listAppliedQnaQuery') return { items: [base], page: filter.page, pageSize: filter.pageSize, total: 1 };
  if (name === 'getAppliedQnaSummaryQuery') return { ...base, totales: { registros: 1, ...totals } };
  return { ...metadata, dominio: filter.dominio, totalDominioA2: '0.00', detalles: [{ orden: 1, empleadoClave: '900001', rfc: null, nombre: 'Árbol Uno',
    sourceScale: 6, importeOficialD6: '0.000000', payloadVersion: 1, payloadCanonico: { interno: '900001', diasLaborados: '15.00', diasOrigen: 'default' },
    ...(filter.esAdmin ? { hashFila: 'B'.repeat(64) } : {}) }],
    page: filter.page, pageSize: filter.pageSize, total: 1, advertencias: [] };
} });
await registerLiquidacionQnaRoutes(app, async (request, reply) => {
  const profile = request.headers['x-test-user'];
  if (!profile) return reply.code(401).send({ ok: false, error: { code: 'UNAUTHORIZED', message: 'Missing token' } });
  const admin = profile === 'admin';
  request.user = { sub: String(profile), roles: admin ? ['admin'] : ['capturista'], entidades: profile === 'entity' ? [true] : [],
    idOrganica0: '04', idOrganica1: '24', idOrganica2: '01', idOrganica3: '02', jti: 'test' };
  (request as any).diScope = { resolve: (name: string) => query(name) };
});
await app.ready();

let response = await app.inject({ method: 'GET', url: '/liquidaciones-qna/aplicadas' });
assert.equal(response.statusCode, 401);
response = await app.inject({ method: 'GET', url: '/liquidaciones-qna/aplicadas?search=x', headers: { 'x-test-user': 'admin' } });
assert.equal(response.statusCode, 400, response.body);
response = await app.inject({ method: 'GET', url: '/liquidaciones-qna/aplicadas?buscar=%25_%5B~&page=1&pageSize=100', headers: { 'x-test-user': 'admin' } });
assert.equal(response.statusCode, 200, response.body);
assert.equal(lastFilter.entidadId, undefined, 'Admin sin alcance obtiene lista global');
assert.equal(lastFilter.buscar, '%_[~');
const adminBody = response.json();
assert.equal(adminBody.data.items[0].fuentes[0].identificadorFuente, 'AUDIT:AHORRO');

response = await app.inject({ method: 'GET', url: '/liquidaciones-qna/aplicadas', headers: { 'x-test-user': 'user' } });
assert.equal(response.statusCode, 200, response.body);
assert.equal(lastFilter.organica3, '02');
assert.equal('identificadorFuente' in response.json().data.items[0].fuentes[0], false);
response = await app.inject({ method: 'GET', url: '/liquidaciones-qna/aplicadas?entidadId=1&organica0=04&organica1=24&organica2=01&organica3=99', headers: { 'x-test-user': 'entity' } });
assert.equal(response.statusCode, 403);

mode = 'missing';
response = await app.inject({ method: 'GET', url: '/liquidaciones-qna/aplicada/resumen?anio=2026&quincena=15', headers: { 'x-test-user': 'admin' } });
assert.equal(response.statusCode, 404);
mode = 'ambiguous';
response = await app.inject({ method: 'GET', url: '/liquidaciones-qna/aplicada/resumen?anio=2026&quincena=15', headers: { 'x-test-user': 'admin' } });
assert.equal(response.statusCode, 409);
mode = 'ok';
response = await app.inject({ method: 'GET', url: '/liquidaciones-qna/aplicada/resumen?anio=2026&quincena=15', headers: { 'x-test-user': 'user' } });
assert.equal(response.statusCode, 200, response.body);
assert.equal(response.json().data.snapshotCalculoV2Id, '9007199254740994');
response = await app.inject({ method: 'GET', url: '/liquidaciones-qna/aplicada/detalles/ahorro?anio=2026&quincena=15', headers: { 'x-test-user': 'user' } });
assert.equal(response.statusCode, 200, response.body);
assert.equal(lastFilter.dominio, 'AHORRO');
assert.equal('hashFila' in response.json().data.detalles[0], false);
assert.equal('snapshotCalculoV2DetalleId' in response.json().data.detalles[0], false);
response = await app.inject({ method: 'GET', url: '/liquidaciones-qna/aplicada/detalles/AHORRO?anio=2026&quincena=15&entidadId=1&organica0=04&organica1=24&organica2=01&organica3=02', headers: { 'x-test-user': 'admin' } });
assert.equal(response.statusCode, 200, response.body);
assert.equal(response.json().data.detalles[0].hashFila, 'B'.repeat(64));

const openapi = app.swagger() as any;
for (const path of ['/liquidaciones-qna/aplicadas','/liquidaciones-qna/aplicada/resumen','/liquidaciones-qna/aplicada/detalles/{dominio}']) {
  assert(openapi.paths[path]);
  for (const status of ['200','400','401','403','404','409','500']) assert(openapi.paths[path].get.responses[status], `${path} sin ${status}`);
}
const detailVariants=openapi.paths['/liquidaciones-qna/aplicada/detalles/{dominio}'].get.responses['200'].content['application/json'].schema.properties.data.properties.detalles.items.oneOf;
assert.equal(detailVariants[0].required.includes('hashFila'),false);
assert.equal(detailVariants[1].required.includes('hashFila'),true,'La variante admin debe ser mutuamente exclusiva de la publica');
await app.close();
console.log('QNA_PHASE9_APPLIED_HTTP_OK');
