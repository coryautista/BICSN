import { normalizeClaveOrganica } from '../../../../utils/organica.js';

function normalizeScopeValue(value: string | number | null | undefined): string | null {
  const normalized = normalizeClaveOrganica(value);
  return normalized && /^\d{2}$/.test(normalized) ? normalized : null;
}

export interface AuthenticatedUser {
  sub: string;
  roles: string[];
  entidades: boolean[];
  idOrganica0?: string;
  idOrganica1?: string;
  idOrganica2?: string;
  idOrganica3?: string;
  jti: string;
  iat?: number;
  exp?: number;
}

export interface RequestedOrganicaScope {
  entidadId?: number | string;
  organica0?: string | number;
  organica1?: string | number;
  organica2?: string | number;
  organica3?: string | number;
}

export interface OrganicaScope {
  entidadId: number;
  organica0: string;
  organica1: string;
  organica2?: string;
  organica3?: string;
}

export class OrganicaScopePolicyError extends Error {
  readonly statusCode = 403;

  constructor(readonly code: 'ORGANICA_SCOPE_FORBIDDEN' | 'ORGANICA_SCOPE_REQUIRED', message: string) {
    super(message);
    this.name = 'OrganicaScopePolicyError';
  }
}

export function resolveOrganicaScope(
  user: AuthenticatedUser,
  requested: RequestedOrganicaScope = {},
  requiredLevels: 2 | 4 = 4
): OrganicaScope {
  const roles = new Set((user.roles ?? []).map(role => role.trim().toLowerCase()));
  const isAdmin = roles.has('admin');
  const isEntidad = (user.entidades ?? []).some(Boolean);
  const token = {
    organica0: normalizeScopeValue(user.idOrganica0),
    organica1: normalizeScopeValue(user.idOrganica1),
    organica2: normalizeScopeValue(user.idOrganica2),
    organica3: normalizeScopeValue(user.idOrganica3),
  };
  const target = {
    organica0: normalizeScopeValue(requested.organica0),
    organica1: normalizeScopeValue(requested.organica1),
    organica2: normalizeScopeValue(requested.organica2),
    organica3: normalizeScopeValue(requested.organica3),
  };
  const hasRequestedScope = requested.entidadId != null || Object.values(target).some(value => value != null);

  if (!isAdmin && hasRequestedScope) {
    const requestsExternalScope = requested.entidadId != null && Number(requested.entidadId) !== 1
      || Object.entries(target).some(([key, value]) => value != null && value !== token[key as keyof typeof token]);
    if (requestsExternalScope) {
      throw new OrganicaScopePolicyError('ORGANICA_SCOPE_FORBIDDEN', 'El usuario no puede acceder a un ámbito orgánico externo.');
    }
  }

  const resolved = isAdmin && hasRequestedScope
    ? {
        entidadId: Number(requested.entidadId ?? 1),
        organica0: target.organica0 ?? token.organica0,
        organica1: target.organica1 ?? token.organica1,
        organica2: target.organica2 ?? token.organica2,
        organica3: target.organica3 ?? token.organica3,
      }
    : {
        entidadId: 1,
        organica0: token.organica0,
        organica1: token.organica1,
        organica2: token.organica2,
        organica3: token.organica3,
      };

  const missingRequired = !resolved.organica0 || !resolved.organica1
    || requiredLevels === 4 && (!resolved.organica2 || !resolved.organica3);
  if (missingRequired) {
    const subject = isEntidad ? 'La entidad no tiene un ámbito orgánico completo en el token.' : 'Se requiere un ámbito orgánico autorizado.';
    throw new OrganicaScopePolicyError('ORGANICA_SCOPE_REQUIRED', subject);
  }

  return {
    entidadId: resolved.entidadId,
    organica0: resolved.organica0!,
    organica1: resolved.organica1!,
    ...(requiredLevels === 4 ? { organica2: resolved.organica2!, organica3: resolved.organica3! } : {}),
  };
}
