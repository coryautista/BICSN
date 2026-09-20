import 'dotenv/config';
import { resolveSqlDatabaseEnvironment } from './databaseEnvironments.js';

export function parseQnaLegacyDualWriteEnabled(value: string | undefined): boolean {
  if (value === undefined) return true;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true') return true;
  if (normalized === 'false') return false;
  throw new Error('QNA_LEGACY_DUAL_WRITE_ENABLED_INVALIDO');
}

export function assertQnaLegacyDualWriteConfiguration(
  enabled: boolean,
  sqlDatabase: string,
  disableConfirmation: string | undefined
): void {
  if (enabled || resolveSqlDatabaseEnvironment(sqlDatabase) === 'DESARROLLO') return;
  if (disableConfirmation?.trim() !== sqlDatabase) {
    throw new Error(`QNA_LEGACY_DUAL_WRITE_DISABLE_CONFIRMATION_REQUIRED:${sqlDatabase}`);
  }
}

const sqlDatabase = process.env.SQLSERVER_DB!;
const legacyDualWriteEnabled = parseQnaLegacyDualWriteEnabled(process.env.QNA_LEGACY_DUAL_WRITE_ENABLED);
assertQnaLegacyDualWriteConfiguration(
  legacyDualWriteEnabled,
  sqlDatabase,
  process.env.QNA_LEGACY_DUAL_WRITE_DISABLE_CONFIRMATION
);

export function parseFirebirdCatalogEnabled(value: string | undefined): boolean {
  if (value === undefined) return true;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true') return true;
  if (normalized === 'false') return false;
  throw new Error('FIREBIRD_CATALOG_ENABLED_INVALIDO');
}

const firebirdCatalogEnabled = parseFirebirdCatalogEnabled(process.env.FIREBIRD_CATALOG_ENABLED);
const firebirdCatalogTtlMs = Number(process.env.FIREBIRD_CATALOG_TTL_MS ?? 300000);
if (!Number.isFinite(firebirdCatalogTtlMs) || firebirdCatalogTtlMs < 1000 || firebirdCatalogTtlMs > 300000) {
  throw new Error('FIREBIRD_CATALOG_TTL_MS_INVALIDO: el TTL debe estar entre 1000 y 300000 ms');
}
const firebirdCatalogMasterKey = process.env.FIREBIRD_CATALOG_MASTER_KEY ?? '';
if (firebirdCatalogEnabled && !/^[0-9a-fA-F]{64}$/.test(firebirdCatalogMasterKey)) {
  throw new Error('FIREBIRD_CATALOG_MASTER_KEY_INVALIDA: se requiere hex de 32 bytes (64 caracteres)');
}

export const env = {
  host: process.env.HOST ?? '0.0.0.0',
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  logLevel: process.env.LOG_LEVEL ?? 'info',
  features: {
    snapshotCalculoV2ShadowEnabled: process.env.SNAPSHOT_CALCULO_V2_SHADOW_ENABLED === 'true',
    snapshotCalculoV2ReadEnabled: process.env.SNAPSHOT_CALCULO_V2_READ_ENABLED === 'true',
    snapshotCalculoV2OfficialReadEnabled: process.env.SNAPSHOT_CALCULO_V2_OFFICIAL_READ_ENABLED === 'true'
  },
  qna: {
    legacyDualWriteEnabled
  },
  firebirdCatalog: {
    enabled: firebirdCatalogEnabled,
    ttlMs: firebirdCatalogTtlMs,
    masterKey: firebirdCatalogMasterKey
  },
  sql: {
    user: process.env.SQLSERVER_USER!,
    password: process.env.SQLSERVER_PASSWORD!,
    server: process.env.SQLSERVER_SERVER!,
    database: sqlDatabase,
    port: Number(process.env.SQLSERVER_PORT ?? 1433),
    options: {
      encrypt: process.env.SQLSERVER_ENCRYPT === 'true',
      trustServerCertificate: process.env.SQLSERVER_TRUST_CERT === 'true'
    },
    pool: { max: 10, min: 1, idleTimeoutMillis: 30000 }
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET!,
    accessTtl: process.env.JWT_ACCESS_TTL ?? '12h',
    iss: process.env.JWT_ISS ?? 'api',
    aud: process.env.JWT_AUD ?? 'api-clients'
  },
  cookie: {
    domain: process.env.COOKIE_DOMAIN ?? 'localhost',
    secure: process.env.COOKIE_SECURE === 'true',
    refreshTtlMin: Number(process.env.REFRESH_TTL_MIN ?? 10080)
  },
  firebird: {
    host: process.env.FIREBIRD_HOST!,
    port: Number(process.env.FIREBIRD_PORT ?? 3050),
    database: process.env.FIREBIRD_DATABASE!,
    user: process.env.FIREBIRD_USER!,
    password: process.env.FIREBIRD_PASSWORD!,
    role: process.env.FIREBIRD_ROLE,
    charset: process.env.FIREBIRD_CHARSET ?? 'WIN1252', // OCTETS (force buffer for manual decoding), NONE, UTF8, WIN1252
    clientLib: process.env.FIREBIRD_CLIENT_LIB, // Ruta a fbclient.dll/.so (opcional, usa default si no se especifica)
    timeoutMs: Number(process.env.FIREBIRD_TIMEOUT_MS ?? 30000) // Default query timeout in ms
  },
  ftp: {
    host: process.env.FTP_HOST ?? '10.20.1.17',
    port: Number(process.env.FTP_PORT ?? 22),
    user: process.env.FTP_USER ?? 'Des',
    password: process.env.FTP_PASS ?? 'sy?FAWI1',
    basePath: process.env.FTP_BASE_PATH ?? '/Autodeterminacion/Desarrollo'
  }

};
