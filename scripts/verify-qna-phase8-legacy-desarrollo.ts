import { readFile } from 'node:fs/promises';
import { DATABASE_ENVIRONMENTS, assertDatabaseEnvironment } from '../src/config/databaseEnvironments.js';

const development = DATABASE_ENVIRONMENTS.DESARROLLO;
process.env.SQLSERVER_DB = development.sqlDatabase;
process.env.FIREBIRD_DATABASE = development.firebirdDatabase;
assertDatabaseEnvironment('DESARROLLO', process.env.SQLSERVER_DB, process.env.FIREBIRD_DATABASE);

async function main(): Promise<void> {
  const { connectDatabase, closeDatabaseConnection } = await import('../src/db/mssql.js');
  const pool = await connectDatabase();
  try {
    const database = String((await pool.request().query('SELECT DB_NAME() BaseDatos')).recordset[0].BaseDatos);
    if (database !== development.sqlDatabase) throw new Error(`DESTINO_SQL_NO_PERMITIDO:${database}`);
    const principalResult = await pool.request().input('LoginName', process.env.SQLSERVER_USER).query(`SELECT name Principal FROM sys.database_principals WHERE sid=SUSER_SID(@LoginName) AND type IN('S','U','G');`);
    const applicationPrincipal = String(principalResult.recordset[0]?.Principal ?? '');
    if (!applicationPrincipal) throw new Error('QNA_APPLICATION_DATABASE_PRINCIPAL_NOT_FOUND');
    const source = await readFile(new URL('../database/migrations/20260826_14_verify_qna_phase8_legacy_dual_write.sql', import.meta.url), 'utf8');
    const rows: any[] = [];
    for (const batch of source.split(/^\s*GO\s*$/gim).map((value) => value.trim()).filter(Boolean)) {
      rows.push(...((await pool.request().input('ApplicationPrincipal', applicationPrincipal).batch(batch)).recordsets ?? []).flat());
    }
    const evidence = rows.find((row) => row.Resultado === 'QNA_PHASE8_LEGACY_DUAL_WRITE_SCHEMA_OK');
    if (!evidence) throw new Error('VERIFICACION_SIN_MARCADOR_OK');
    console.log(JSON.stringify({ environment: 'DESARROLLO', sqlDatabase: database, firebirdDatabase: development.firebirdDatabase, applicationPrincipal, evidence }, null, 2));
    console.log('QNA_PHASE8_LEGACY_DESARROLLO_VERIFY_OK');
  } finally {
    await closeDatabaseConnection();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
