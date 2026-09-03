import sql from 'mssql';
import 'dotenv/config';
import { DATABASE_ENVIRONMENTS, assertDatabaseEnvironment } from '../src/config/databaseEnvironments.js';
import { decryptSecret } from '../src/shared/crypto/symmetric.js';

const development = DATABASE_ENVIRONMENTS.DESARROLLO;
process.env.SQLSERVER_DB = development.sqlDatabase;
process.env.FIREBIRD_DATABASE = development.firebirdDatabase;
assertDatabaseEnvironment('DESARROLLO', process.env.SQLSERVER_DB, process.env.FIREBIRD_DATABASE);

function argumentValue(name: string): string | undefined {
  const prefix = `--${name}=`;
  return process.argv.find((argument) => argument.startsWith(prefix))?.slice(prefix.length);
}

const onlyOrg0 = argumentValue('org0');
const onlyOrg1 = argumentValue('org1');
const masterKey = process.env.FIREBIRD_CATALOG_MASTER_KEY ?? '';
const masterKeyValida = /^[0-9a-fA-F]{64}$/.test(masterKey);

const { connectDatabase, closeDatabaseConnection } = await import('../src/db/mssql.js');
const pool = await connectDatabase();

try {
  const result = await pool.request().query(`
    SELECT Org0, Org1, UsuarioFirebird, CONVERT(VARCHAR(MAX), SecretoCifrado, 2) AS SecretoHex,
      RolFirebird, Activo, FechaAlta, FechaRotacion, DATALENGTH(SecretoCifrado) AS SecretoBytes
    FROM config.FirebirdOrganicaCredential
    ORDER BY Org0, Org1;
  `);
  const rows = result.recordset
    .filter((row) => (onlyOrg0 ? String(row.Org0) === onlyOrg0.padStart(2, '0') : true))
    .filter((row) => (onlyOrg1 ? String(row.Org1) === onlyOrg1.padStart(2, '0') : true));

  const decryptables = rows.map((row) => {
    if (!masterKeyValida) return { org: `${row.Org0}/${row.Org1}`, decryptable: null };
    try {
      decryptSecret(String(row.SecretoHex), masterKey);
      return { org: `${row.Org0}/${row.Org1}`, decryptable: true };
    } catch {
      return { org: `${row.Org0}/${row.Org1}`, decryptable: false };
    }
  });

  console.log(JSON.stringify({
    check: 'FIREBIRD_ORGANICA_CREDENTIALS_VERIFY',
    environment: 'DESARROLLO',
    sqlDatabase: development.sqlDatabase,
    readOnly: true,
    masterKeyConfigurada: masterKeyValida,
    filas: rows.map((row) => ({
      org0: String(row.Org0), org1: String(row.Org1),
      usuario: String(row.UsuarioFirebird), rol: row.RolFirebird == null ? null : String(row.RolFirebird),
      activo: Boolean(row.Activo), secretoBytes: Number(row.SecretoBytes),
      fechaAlta: row.FechaAlta, fechaRotacion: row.FechaRotacion,
    })),
    decryptables,
  }, null, 2));
  if (rows.length === 0) throw new Error('FIREBIRD_CATALOG_SIN_FILAS');
  if (decryptables.some((item) => item.decryptable === false)) throw new Error('FIREBIRD_CATALOG_SECRETO_ILEGIBLE');
  console.log('FIREBIRD_ORGANICA_CREDENTIALS_VERIFY_OK');
} finally {
  await closeDatabaseConnection();
}
