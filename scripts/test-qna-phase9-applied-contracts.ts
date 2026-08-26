import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { QnaAppliedDetailSchema, QnaAppliedDomainParamsSchema, QnaAppliedListSchema, QnaAppliedSelectionSchema } from '../src/modules/liquidacionQna/liquidacionQna.schemas.js';
import { OrganicaScopePolicyError, resolveOrganicaScope, type AuthenticatedUser } from '../src/modules/auth/domain/policies/OrganicaScopePolicy.js';
import { LiquidacionQnaRepository } from '../src/modules/liquidacionQna/infrastructure/persistence/LiquidacionQnaRepository.js';

const tokenUser: AuthenticatedUser = {
  sub: 'phase9-user', roles: ['capturista'], entidades: [], jti: 'phase9',
  idOrganica0: '04', idOrganica1: '24', idOrganica2: '01', idOrganica3: '02',
};
const admin: AuthenticatedUser = { ...tokenUser, roles: ['admin'] };
const fullScope = { entidadId: '1', organica0: '04', organica1: '24', organica2: '01', organica3: '02' };

assert.deepEqual(QnaAppliedListSchema.parse({}), { page: 1, pageSize: 100 });
assert.equal(QnaAppliedListSchema.parse({ pageSize: '500', buscar: '%_[Árbol]' }).pageSize, 500);
assert.equal(QnaAppliedListSchema.safeParse({ pageSize: '501' }).success, false);
assert.equal(QnaAppliedListSchema.safeParse({ buscar: 'x'.repeat(201) }).success, false);
assert.equal(QnaAppliedListSchema.safeParse({ search: 'no-admitido' }).success, false);
assert.equal(QnaAppliedListSchema.safeParse({ entidadId: '1', organica0: '04' }).success, false, 'El alcance es all-or-none');
assert.equal(QnaAppliedSelectionSchema.safeParse({ anio: '2026', quincena: '15' }).success, true);
assert.equal(QnaAppliedDetailSchema.parse({ anio: '2026', quincena: '15' }).pageSize, 100);
for (const domain of ['ahorro', 'Vivienda', 'PRESTACIONES', 'cair', 'guarderias', 'TRANSITORIO', 'aguinaldo', 'pcp', 'Pmp', 'HIP']) {
  assert.equal(QnaAppliedDomainParamsSchema.parse({ dominio: domain }).dominio, domain.toUpperCase());
}
assert.equal(QnaAppliedDomainParamsSchema.safeParse({ dominio: 'legacy' }).success, false);

assert.deepEqual(resolveOrganicaScope(tokenUser), { entidadId: 1, organica0: '04', organica1: '24', organica2: '01', organica3: '02' });
assert.deepEqual(resolveOrganicaScope(tokenUser, fullScope), { entidadId: 1, organica0: '04', organica1: '24', organica2: '01', organica3: '02' });
assert.throws(() => resolveOrganicaScope(tokenUser, { ...fullScope, organica3: '99' }),
  (error: unknown) => error instanceof OrganicaScopePolicyError && error.code === 'ORGANICA_SCOPE_FORBIDDEN');
assert.deepEqual(resolveOrganicaScope(admin, { ...fullScope, entidadId: '2' }), { entidadId: 2, organica0: '04', organica1: '24', organica2: '01', organica3: '02' });

const [routes, repository] = await Promise.all([
  readFile(new URL('../src/modules/liquidacionQna/liquidacionQna.routes.ts', import.meta.url), 'utf8'),
  readFile(new URL('../src/modules/liquidacionQna/infrastructure/persistence/LiquidacionQnaRepository.ts', import.meta.url), 'utf8'),
]);
for (const path of ['/liquidaciones-qna/aplicadas', '/liquidaciones-qna/aplicada/resumen', '/liquidaciones-qna/aplicada/detalles/:dominio']) assert.match(routes, new RegExp(path.replaceAll('/', '\\/')));
assert.match(routes, /QNA_APLICADA_OFICIAL_NO_ENCONTRADA/);
assert.match(repository, /EstadoDestino='TERMINADO'/);
assert.match(repository, /ROW_NUMBER\(\) OVER\(PARTITION BY tr\.QnaProcesoId ORDER BY tr\.FechaCreacion DESC,tr\.QnaProcesoTransicionId DESC\)/);
assert.match(repository, /VersionEsquema\) !== 5/);
assert.match(repository, /QNA_APLICADA_INTEGRIDAD_INVALIDA/);
assert.match(repository, /LIKE @Busqueda ESCAPE '~'/);
assert.doesNotMatch(repository.slice(repository.indexOf('async listApplied'), repository.indexOf('async appendDecision')), /QnaSnapshotOficialActual|AP_S_FONDOS|NominaAplicacionQnalDetalle|FormulaCalculoParametro|HISTORICO_SQL/);
assert.match(repository, /isAdmin \? \{ identificadorFuente/);
assert.match(repository, /isAdmin \? \{ claveFilaHash/);
assert.match(repository, /QnaLegacyProjection/);
assert.match(repository, /QNA_PHASE8_\$\{projectionState\}/);
assert.match(repository, /QNA_PHASE8_DOMINIO_\$\{row\.ReconciliacionEstado\}/);
const mapper = new LiquidacionQnaRepository({} as any) as any;
const warnings = mapper.mapWarnings([], [
  { Estado: 'WARNING', ReconciliacionEstado: 'COMPLETE', Dominio: 'AHORRO', Detalle: 'secreto' },
  { Estado: 'WARNING', ReconciliacionEstado: 'ERROR', Dominio: 'PCP', ErrorDetalle: 'sql secreto' },
  { Estado: 'WARNING', ReconciliacionEstado: 'ERROR', Dominio: 'PCP', Diferencias: 'duplicado secreto' },
]);
assert.deepEqual(warnings.map((warning: any) => [warning.code,warning.dominio ?? null]), [['QNA_PHASE8_WARNING',null],['QNA_PHASE8_DOMINIO_ERROR','PCP']]);
assert.doesNotMatch(JSON.stringify(warnings), /secreto|COMPLETE/);

console.log('QNA_PHASE9_APPLIED_CONTRACTS_OK');
