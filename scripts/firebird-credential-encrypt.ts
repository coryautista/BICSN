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
const environmentName = (argumentValue('environment') ?? 'DESARROLLO').toUpperCase();
const passwordEnvName = argumentValue('password-env') ?? 'FIREBIRD_PASSWORD';
const userEnvName = argumentValue('user-env') ?? 'FIREBIRD_USER';
const roleEnvName = argumentValue('role-env') ?? 'FIREBIRD_ROLE';
const roleEntidadEnvName = argumentValue('role-entidad-env');

if (!org0 || !org1) {
  console.error('Uso: tsx scripts/firebird-credential-encrypt.ts --org0=04 --org1=24 [--environment=DESARROLLO|CALIDAD] [--password-env=FIREBIRD_PASSWORD] [--user-env=FIREBIRD_USER] [--role-env=FIREBIRD_ROLE] [--apply]');
  process.exit(2);
}
if (environmentName !== 'DESARROLLO' && environmentName !== 'CALIDAD') {
  throw new Error('FIREBIRD_CATALOG_ENVIRONMENT_INVALIDO: use DESARROLLO o CALIDAD');
}
const environment = environmentName as 'DESARROLLO' | 'CALIDAD';
if (apply && environment === 'CALIDAD') {
  const confirmed = process.argv.includes('--confirm-quality=SII-ISSSSPEA');
  const backupReference = (
    argumentValue('backup-reference')
    ?? process.argv.slice(2).find((argument) => !argument.startsWith('--'))
  )?.trim();
  if (!confirmed) throw new Error('CONFIRMACION_REQUERIDA:--confirm-quality=SII-ISSSSPEA');
  if (!backupReference) throw new Error('RESPALDO_REQUERIDO: proporcione la referencia verificable como argumento final');
}

const masterKey = process.env.FIREBIRD_CATALOG_MASTER_KEY ?? '';
if (!/^[0-9a-fA-F]{64}$/.test(masterKey)) {
  console.error('FIREBIRD_CATALOG_MASTER_KEY_INVALIDA: exporte FIREBIRD_CATALOG_MASTER_KEY con hex de 32 bytes (64 caracteres).');
  process.exit(1);
}

const password = process.env[passwordEnvName];
const user = process.env[userEnvName];
const role = process.env[roleEnvName];
const roleEntidad = roleEntidadEnvName ? process.env[roleEntidadEnvName] : undefined;
if (roleEntidadEnvName && !roleEntidad) {
  console.error(`Falta ${roleEntidadEnvName} en el entorno para el rol entidad.`);
  process.exit(1);
}
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
    RolFirebirdEntidad=COALESCE(@RolEntidad, RolFirebirdEntidad), Activo=1, FechaRotacion=SYSUTCDATETIME()
  WHERE Org0=@Org0 AND Org1=@Org1;`;
const insertSql = `
  INSERT INTO config.FirebirdOrganicaCredential (Org0, Org1, UsuarioFirebird, SecretoCifrado, RolFirebird, RolFirebirdEntidad)
  VALUES (@Org0, @Org1, @Usuario, CONVERT(VARBINARY(MAX), @Secreto, 2), @Rol, @RolEntidad);`;

if (!apply) {
  console.log(JSON.stringify({
    org0: normalizedOrg0,
    org1: normalizedOrg1,
    usuario: user,
    rol: role ?? null,
    rolEntidad: roleEntidad ?? null,
    secretoBytes: secretHex.length / 2,
    destino: DATABASE_ENVIRONMENTS[environment].sqlDatabase,
  }, null, 2));
  console.log('FIREBIRD_CREDENTIAL_ENCRYPT_PREVIEW_OK');
  process.exit(0);
}

const target = DATABASE_ENVIRONMENTS[environment];
process.env.SQLSERVER_DB = target.sqlDatabase;
process.env.FIREBIRD_DATABASE = target.firebirdDatabase;
assertDatabaseEnvironment(environment, process.env.SQLSERVER_DB, process.env.FIREBIRD_DATABASE);

const { connectDatabase, closeDatabaseConnection } = await import('../src/db/mssql.js');
const pool = await connectDatabase();
try {
  const request = pool.request()
    .input('Org0', sql.VarChar(2), normalizedOrg0)
    .input('Org1', sql.VarChar(2), normalizedOrg1)
    .input('Usuario', sql.VarChar(64), user)
    .input('Secreto', sql.VarChar(sql.MAX), secretHex)
    .input('Rol', sql.VarChar(64), role ?? null)
    .input('RolEntidad', sql.VarChar(64), roleEntidad ?? null);
  const updated = await request.query(updateSql);
  if ((updated.rowsAffected[0] ?? 0) === 0) await request.query(insertSql);
  console.log(JSON.stringify({ environment, sqlDatabase: target.sqlDatabase, org0: normalizedOrg0, org1: normalizedOrg1, usuario: user, rol: role ?? null, rolEntidad: roleEntidad ?? null }, null, 2));
  console.log('FIREBIRD_CREDENTIAL_SEED_APPLIED_OK');
} finally {
  await closeDatabaseConnection();
}
