import sql from 'mssql';
import { env } from '../config/env.js';
import { getPool } from './mssql.js';
import { decryptSecret } from '../shared/crypto/symmetric.js';

export interface FirebirdScopeCredential {
  org0: string;
  org1: string;
  user: string;
  password: string;
  role: string | null;
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

export async function getFirebirdScopeCredential(org0: string, org1: string): Promise<FirebirdScopeCredential> {
  if (!env.firebirdCatalog.enabled) {
    throw new FirebirdOrganicaCredentialError('Catalogo de credenciales Firebird deshabilitado', 'FIREBIRD_CATALOG_DESHABILITADO');
  }
  const normalizedOrg0 = normalizeFirebirdOrg(org0);
  const normalizedOrg1 = normalizeFirebirdOrg(org1);
  const key = `${normalizedOrg0}|${normalizedOrg1}`;
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && hit.expiresAt > now) return hit.credential;

  const result = await getPool().request()
    .input('Org0', sql.VarChar(2), normalizedOrg0)
    .input('Org1', sql.VarChar(2), normalizedOrg1)
    .query(`
      SELECT TOP (1) UsuarioFirebird, CONVERT(VARCHAR(MAX), SecretoCifrado, 2) AS SecretoHex, RolFirebird
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
  if (!env.firebirdCatalog.masterKey) {
    throw new FirebirdOrganicaCredentialError('FIREBIRD_CATALOG_MASTER_KEY no configurada', 'FIREBIRD_CATALOG_MASTER_KEY_FALTANTE');
  }
  const credential: FirebirdScopeCredential = {
    org0: normalizedOrg0,
    org1: normalizedOrg1,
    user: String(row.UsuarioFirebird),
    password: decryptSecret(String(row.SecretoHex), env.firebirdCatalog.masterKey),
    role: row.RolFirebird == null ? null : String(row.RolFirebird),
  };
  cache.set(key, { expiresAt: now + env.firebirdCatalog.ttlMs, credential });
  return credential;
}

export function invalidateFirebirdScopeCredential(org0: string, org1: string): void {
  cache.delete(`${normalizeFirebirdOrg(org0)}|${normalizeFirebirdOrg(org1)}`);
}

export function firebirdCatalogCacheInfo(): { enabled: boolean; scopesActivos: number; ttlMs: number } {
  return { enabled: env.firebirdCatalog.enabled, scopesActivos: cache.size, ttlMs: env.firebirdCatalog.ttlMs };
}
