import sql from 'mssql';
import 'dotenv/config';
import { DATABASE_ENVIRONMENTS, assertDatabaseEnvironment } from '../src/config/databaseEnvironments.js';

function argumentValue(name: string): string | undefined {
  const prefix = `--${name}=`;
  return process.argv.find((argument) => argument.startsWith(prefix))?.slice(prefix.length);
}

const org0 = argumentValue('org0');
const org1 = argumentValue('org1');
const apply = process.argv.includes('--apply');
const passwordEnvName = argumentValue('password-env') ?? 'FIREBIRD_PASSWORD';
const userEnvName = argumentValue('user-env') ?? 'FIREBIRD_USER';
const roleEnvName = argumentValue('role-env') ?? 'FIREBIRD_ROLE';

if (!org0 || !org1) {
  console.error('Uso: tsx scripts/firebird-credential-encrypt.ts --org0=04 --org1=24 [--password-env=FIREBIRD_PASSWORD] [--user-env=FIREBIRD_USER] [--role-env=FIREBIRD_ROLE] [--apply]');
  process.exit(2);
}

const masterKey = process.env.FIREBIRD_CATALOG_MASTER_KEY ?? '';
if (!/^[0-9a-fA-F]{64}$/.test(masterKey)) {
  console.error('FIREBIRD_CATALOG_MASTER_KEY_INVALIDA: exporte FIREBIRD_CATALOG_MASTER_KEY con hex de 32 bytes (64 caracteres).');
  process.exit(1);
}

const password = process.env[passwordEnvName];
const user = process.env[userEnvName];
const role = process.env[roleEnvName];
if (!password || !user) {
  console.error(`Faltan ${userEnvName}/${passwordEnvName} en el entorno para construir la fila semilla.`);
  process.exit(1);
}

const { encryptSecret } = await import('../src/shared/crypto/symmetric.js');
const secretHex = encryptSecret(password, masterKey);
if (!/^\d{1,2}$/.test(org0.trim()) || !/^\d{1,2}$/.test(org1.trim())) {
  throw new Error('FIREBIRD_CATALOG_ORGANICA_INVALIDA');
}
const normalizedOrg0 = org0.trim().padStart(2, '0');
const normalizedOrg1 = org1.trim().padStart(2, '0');

const updateSql = `
UPDATE config.FirebirdOrganicaCredential
SET UsuarioFirebird=@Usuario, SecretoCifrado=CONVERT(VARBINARY(MAX), @Secreto, 2), RolFirebird=@Rol,
  Activo=1, FechaRotacion=SYSUTCDATETIME()
WHERE Org0=@Org0 AND Org1=@Org1;`;
const insertSql = `
INSERT INTO config.FirebirdOrganicaCredential (Org0, Org1, UsuarioFirebird, SecretoCifrado, RolFirebird)
VALUES (@Org0, @Org1, @Usuario, CONVERT(VARBINARY(MAX), @Secreto, 2), @Rol);`;

if (!apply) {
  console.log(JSON.stringify({
    org0: normalizedOrg0,
    org1: normalizedOrg1,
    usuario: user,
    rol: role ?? null,
    secretoHex,
    sql: `UPDATE/INSERT config.FirebirdOrganicaCredential (Org0='${normalizedOrg0}', Org1='${normalizedOrg1}', Usuario=N'${user}', Rol=${role ? `N'${role}'` : 'NULL'}, Secreto=0x${secretHex.slice(0, 32)}...)`,
  }, null, 2));
  console.log('FIREBIRD_CREDENTIAL_ENCRYPT_PREVIEW_OK');
  process.exit(0);
}

const development = DATABASE_ENVIRONMENTS.DESARROLLO;
process.env.SQLSERVER_DB = development.sqlDatabase;
process.env.FIREBIRD_DATABASE = development.firebirdDatabase;
assertDatabaseEnvironment('DESARROLLO', process.env.SQLSERVER_DB, process.env.FIREBIRD_DATABASE);

const { connectDatabase, closeDatabaseConnection } = await import('../src/db/mssql.js');
const pool = await connectDatabase();
try {
  const request = pool.request()
    .input('Org0', sql.VarChar(2), normalizedOrg0)
    .input('Org1', sql.VarChar(2), normalizedOrg1)
    .input('Usuario', sql.VarChar(64), user)
    .input('Secreto', sql.VarChar(sql.MAX), secretHex)
    .input('Rol', sql.VarChar(64), role ?? null);
  const updated = await request.query(updateSql);
  if ((updated.rowsAffected[0] ?? 0) === 0) await request.query(insertSql);
  console.log(JSON.stringify({ org0: normalizedOrg0, org1: normalizedOrg1, usuario: user, rol: role ?? null }, null, 2));
  console.log('FIREBIRD_CREDENTIAL_SEED_APPLIED_OK');
} finally {
  await closeDatabaseConnection();
}
