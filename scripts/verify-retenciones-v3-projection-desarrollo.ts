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
    const database = String((await pool.request().query('SELECT DB_NAME() AS BaseDatos')).recordset[0].BaseDatos);
    if (database!==development.sqlDatabase) throw new Error(`DESTINO_SQL_NO_PERMITIDO:${database}`);
    const source = await readFile(new URL('../database/migrations/20260826_12_verify_retenciones_v3_projection.sql', import.meta.url),'utf8');
    const rows: any[]=[];
    for (const batch of source.split(/^\s*GO\s*$/gim).map((value)=>value.trim()).filter(Boolean)) {
      rows.push(...((await pool.request().batch(batch)).recordsets ?? []).flat());
    }
    const evidence=rows.find((row)=>row.Resultado==='RETENCIONES_V3_PROJECTION_SCHEMA_OK');
    if (!evidence) throw new Error('VERIFICACION_SIN_MARCADOR_OK');
    console.log(JSON.stringify({ environment:'DESARROLLO',sqlDatabase:database,firebirdDatabase:development.firebirdDatabase,evidence },null,2));
    console.log('RETENCIONES_V3_PROJECTION_DESARROLLO_VERIFY_OK');
  } finally { await closeDatabaseConnection(); }
}
main().catch((error)=>{ console.error(error instanceof Error ? error.message : error); process.exitCode=1; });
