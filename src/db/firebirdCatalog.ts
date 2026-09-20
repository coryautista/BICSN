import sql from 'mssql';
import { env } from '../config/env.js';
import { getPool } from './mssql.js';
import { decryptSecret } from '../shared/crypto/symmetric.js';

export type RolContexto = 'ENTIDAD' | 'OPERATIVO';

export interface FirebirdScopeCredential {
  org0: string;
  org1: string;
  user: string;
  password: string;
  role: string | null;
  rolContexto: RolContexto;
}

export interface FirebirdScopeCredentialLease {
  credential: FirebirdScopeCredential;
  expiresAt: number;
}

interface CacheEntry {
  expiresAt: number;
  credential: FirebirdScopeCredential;
}

export class FirebirdOrganicaCredentialError extends Error {
  constructor(message: string, readonly code: string) {
    super(message);
    this.name = 'FirebirdOrganicaCredentialError';
  }
}

const cache = new Map<string, CacheEntry>();

export function normalizeFirebirdOrg(value: string): string {
  const normalized = String(value ?? '').trim();
  if (!/^\d{1,2}$/.test(normalized)) {
    throw new FirebirdOrganicaCredentialError(`Organica invalida: ${value}`, 'FIREBIRD_CATALOG_ORGANICA_INVALIDA');
  }
  return normalized.padStart(2, '0');
}

export async function getFirebirdScopeCredentialLease(org0: string, org1: string, rolContexto: RolContexto = 'OPERATIVO'): Promise<FirebirdScopeCredentialLease> {
  if (!env.firebirdCatalog.enabled) {
    throw new FirebirdOrganicaCredentialError('Catalogo de credenciales Firebird deshabilitado', 'FIREBIRD_CATALOG_DESHABILITADO');
  }
  const normalizedOrg0 = normalizeFirebirdOrg(org0);
  const normalizedOrg1 = normalizeFirebirdOrg(org1);
  const key = `${normalizedOrg0}|${normalizedOrg1}|${rolContexto}`;
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && hit.expiresAt > now) return { credential: hit.credential, expiresAt: hit.expiresAt };

  const result = await getPool().request()
    .input('Org0', sql.VarChar(2), normalizedOrg0)
    .input('Org1', sql.VarChar(2), normalizedOrg1)
    .query(`
      SELECT TOP (1) UsuarioFirebird, CONVERT(VARCHAR(MAX), SecretoCifrado, 2) AS SecretoHex, RolFirebird, RolFirebirdEntidad
      FROM config.FirebirdOrganicaCredential WITH (READCOMMITTED)
      WHERE Org0=@Org0 AND Org1=@Org1 AND Activo=1
      ORDER BY FechaAlta DESC;
    `);
  const row = result.recordset[0];
  if (!row) {
    throw new FirebirdOrganicaCredentialError(
      `Sin credencial Firebird activa para la organica ${normalizedOrg0}/${normalizedOrg1}; el DBA debe darla de alta en config.FirebirdOrganicaCredential`,
      'FIREBIRD_CREDENCIAL_ORGANICA_NO_CONFIGURADA'
    );
  }
  const catalogUser = String(row.UsuarioFirebird).trim();
  const technicalUser = String(env.firebird.user).trim();
  if (catalogUser.localeCompare(technicalUser, undefined, { sensitivity: 'accent' }) === 0) {
    throw new FirebirdOrganicaCredentialError(
      `La credencial Firebird de la organica ${normalizedOrg0}/${normalizedOrg1} usa la cuenta tecnica de ambiente; el DBA debe asignar la cuenta propia de la entidad`,
      'FIREBIRD_CREDENCIAL_ORGANICA_USUARIO_TECNICO'
    );
  }
  if (!env.firebirdCatalog.masterKey) {
    throw new FirebirdOrganicaCredentialError('FIREBIRD_CATALOG_MASTER_KEY no configurada', 'FIREBIRD_CATALOG_MASTER_KEY_FALTANTE');
  }
  const role = rolContexto === 'ENTIDAD' ? row.RolFirebirdEntidad : row.RolFirebird;
  if (rolContexto === 'ENTIDAD' && role == null) {
    throw new FirebirdOrganicaCredentialError(
      `La organica ${normalizedOrg0}/${normalizedOrg1} no tiene RolFirebirdEntidad configurado; el DBA debe darlo de alta en config.FirebirdOrganicaCredential`,
      'FIREBIRD_CREDENCIAL_ROL_ENTIDAD_NO_CONFIGURADO'
    );
  }
  const credential: FirebirdScopeCredential = {
    org0: normalizedOrg0,
    org1: normalizedOrg1,
    user: catalogUser,
    password: decryptSecret(String(row.SecretoHex), env.firebirdCatalog.masterKey),
    role: role == null ? null : String(role),
    rolContexto,
  };
  const expiresAt = now + env.firebirdCatalog.ttlMs;
  cache.set(key, { expiresAt, credential });
  return { credential, expiresAt };
}

export async function getFirebirdScopeCredential(org0: string, org1: string, rolContexto: RolContexto = 'OPERATIVO'): Promise<FirebirdScopeCredential> {
  return (await getFirebirdScopeCredentialLease(org0, org1, rolContexto)).credential;
}

export function invalidateFirebirdScopeCredential(org0: string, org1: string): void {
  cache.delete(`${normalizeFirebirdOrg(org0)}|${normalizeFirebirdOrg(org1)}|ENTIDAD`);
  cache.delete(`${normalizeFirebirdOrg(org0)}|${normalizeFirebirdOrg(org1)}|OPERATIVO`);
}

export function firebirdCatalogCacheInfo(): { enabled: boolean; scopesActivos: number; ttlMs: number } {
  return { enabled: env.firebirdCatalog.enabled, scopesActivos: cache.size, ttlMs: env.firebirdCatalog.ttlMs };
}
