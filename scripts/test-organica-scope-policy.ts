import assert from 'node:assert/strict';
import {
  OrganicaScopePolicyError,
  resolveOrganicaScope,
  type AuthenticatedUser,
} from '../src/modules/auth/domain/policies/OrganicaScopePolicy.js';
import { requireAuth, requireRole } from '../src/modules/auth/auth.middleware.js';
import { GetAguinaldoQuery } from '../src/modules/aportacionesFondos/application/queries/GetAguinaldoQuery.js';
import { GetAportacionGuarderiasQuery } from '../src/modules/aportacionesFondos/application/queries/GetAportacionGuarderiasQuery.js';
import { GetPensionNominaTransitorioQuery } from '../src/modules/aportacionesFondos/application/queries/GetPensionNominaTransitorioQuery.js';

function user(overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser {
  return {
    sub: '1',
    roles: ['usuario'],
    entidades: [true],
    idOrganica0: '4',
    idOrganica1: '24',
    idOrganica2: '1',
    idOrganica3: '01',
    jti: 'test',
    ...overrides,
  };
}

function expectForbidden(run: () => unknown, code: OrganicaScopePolicyError['code']): void {
  assert.throws(run, error => error instanceof OrganicaScopePolicyError && error.statusCode === 403 && error.code === code);
}

assert.deepEqual(resolveOrganicaScope(user()), {
  entidadId: 1,
  organica0: '04',
  organica1: '24',
  organica2: '01',
  organica3: '01',
});

expectForbidden(
  () => resolveOrganicaScope(user(), { organica0: '05', organica1: '24', organica2: '01', organica3: '01' }),
  'ORGANICA_SCOPE_FORBIDDEN'
);

expectForbidden(
  () => resolveOrganicaScope(user({ entidades: [false], roles: ['consulta'] }), { organica0: '05', organica1: '01' }, 2),
  'ORGANICA_SCOPE_FORBIDDEN'
);

assert.deepEqual(
  resolveOrganicaScope(user({ entidades: [true, false], roles: ['consulta', 'ADMIN'] }), {
    entidadId: 2,
    organica0: '5',
    organica1: '7',
    organica2: '2',
    organica3: '3',
  }),
  { entidadId: 2, organica0: '05', organica1: '07', organica2: '02', organica3: '03' }
);

assert.deepEqual(
  resolveOrganicaScope(user({ entidades: [false, true], roles: ['consulta'] }), {}, 2),
  { entidadId: 1, organica0: '04', organica1: '24' }
);

expectForbidden(
  () => resolveOrganicaScope(user({ idOrganica0: undefined }), {}, 2),
  'ORGANICA_SCOPE_REQUIRED'
);

expectForbidden(
  () => resolveOrganicaScope(user({ idOrganica0: '123' }), {}, 2),
  'ORGANICA_SCOPE_REQUIRED'
);

function replyRecorder() {
  const state: { statusCode?: number; body?: unknown } = {};
  return {
    state,
    reply: {
      code(statusCode: number) {
        state.statusCode = statusCode;
        return this;
      },
      send(body: unknown) {
        state.body = body;
        return this;
      },
    },
  };
}

const unauthenticated = replyRecorder();
await requireAuth({ cookies: {}, headers: {} } as any, unauthenticated.reply as any);
assert.equal(unauthenticated.state.statusCode, 401);
assert.deepEqual(unauthenticated.state.body, { ok: false, error: { code: 'UNAUTHORIZED', message: 'Missing token' } });

const unauthorizedRole = replyRecorder();
await requireRole('admin')({ user: user({ roles: ['consulta'] }) }, unauthorizedRole.reply as any);
assert.equal(unauthorizedRole.state.statusCode, 403);
assert.deepEqual(unauthorizedRole.state.body, { ok: false, error: { code: 'FORBIDDEN', message: 'Insufficient role' } });

const adminTargetRepo = {
  validarAccesoClavesOrganicas(userClave0: string, userClave1: string, isEntidad: boolean, clave0?: string, clave1?: string) {
    assert.equal(userClave0, '');
    assert.equal(userClave1, '');
    assert.equal(isEntidad, false);
    return { clave0: clave0!, clave1: clave1! };
  },
  obtenerAguinaldo: async (org0: string, org1: string) => {
    assert.deepEqual([org0, org1], ['04', '24']);
    return [];
  },
  obtenerAportacionGuarderias: async (org0: string, org1: string) => {
    assert.deepEqual([org0, org1], ['04', '24']);
    return [];
  },
  obtenerPensionNominaTransitorio: async (org0: string, org1: string, org2: string, org3: string) => {
    assert.deepEqual([org0, org1, org2, org3], ['04', '60', '04', '24']);
    return [];
  },
};

await new GetAguinaldoQuery(adminTargetRepo as any).execute('', '', false, '04', '24', 'admin', false, '1526');
await new GetAportacionGuarderiasQuery(adminTargetRepo as any).execute('', '', false, '04', '24', 'admin', false, '1526');
await new GetPensionNominaTransitorioQuery(adminTargetRepo as any).execute('', '', false, '04', '24', 'admin', false, '1526');

console.log('ORGANICA_SCOPE_POLICY_TESTS_OK');
