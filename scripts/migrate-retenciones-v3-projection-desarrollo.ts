import { readFile } from 'node:fs/promises';
import { DATABASE_ENVIRONMENTS, assertDatabaseEnvironment } from '../src/config/databaseEnvironments.js';

const execute = process.argv.includes('--execute');
const confirmed = process.argv.includes('--confirm-development=SII-ISSSSPEA-DES');
const development = DATABASE_ENVIRONMENTS.DESARROLLO;
if (execute && !confirmed) throw new Error('CONFIRMACION_REQUERIDA:--confirm-development=SII-ISSSSPEA-DES');
process.env.SQLSERVER_DB = development.sqlDatabase;
process.env.FIREBIRD_DATABASE = development.firebirdDatabase;
assertDatabaseEnvironment('DESARROLLO', process.env.SQLSERVER_DB, process.env.FIREBIRD_DATABASE);

const batches = (source: string) => source.split(/^\s*GO\s*$/gim).map((value) => value.trim()).filter(Boolean);
async function run(pool: any, file: string): Promise<any[]> {
  const source = await readFile(new URL(`../database/migrations/${file}`, import.meta.url), 'utf8');
  const rows: any[] = [];
  for (const batch of batches(source)) rows.push(...((await pool.request().batch(batch)).recordsets ?? []).flat());
  return rows;
}
async function counts(pool: any): Promise<Record<string, string>> {
  const result = await pool.request().query(`SELECT DB_NAME() AS BaseDatos,
    (SELECT COUNT_BIG(*) FROM retenciones.RetencionPCPHistoricoV3) AS PCP,
    (SELECT COUNT_BIG(*) FROM retenciones.RetencionPMPHistoricoV3) AS PMP,
    (SELECT COUNT_BIG(*) FROM retenciones.RetencionHIPHistoricoV3) AS HIP;`);
  return Object.fromEntries(Object.entries(result.recordset[0]).map(([key,value]) => [key,String(value)]));
}
async function main(): Promise<void> {
  const { connectDatabase, closeDatabaseConnection } = await import('../src/db/mssql.js');
  const pool = await connectDatabase();
  try {
    const before = await counts(pool);
    if (before.BaseDatos !== development.sqlDatabase) throw new Error(`DESTINO_SQL_NO_PERMITIDO:${before.BaseDatos}`);
    if (!execute) {
      console.log(JSON.stringify({ environment: 'DESARROLLO', execute: false, before }, null, 2));
      console.log('RETENCIONES_V3_PROJECTION_DESARROLLO_DRY_RUN_OK');
      return;
    }
    await run(pool, '20260826_11_strengthen_retenciones_v3_projection.sql');
    const evidence = await run(pool, '20260826_12_verify_retenciones_v3_projection.sql');
    const after = await counts(pool);
    if (before.PCP!==after.PCP || before.PMP!==after.PMP || before.HIP!==after.HIP) throw new Error('MIGRACION_MODIFICO_FILAS_EXISTENTES');
    if (!evidence.some((row) => row.Resultado==='RETENCIONES_V3_PROJECTION_SCHEMA_OK')) throw new Error('VERIFICACION_SIN_MARCADOR_OK');
    console.log(JSON.stringify({ environment: 'DESARROLLO', execute: true, before, after }, null, 2));
    console.log('RETENCIONES_V3_PROJECTION_DESARROLLO_MIGRATION_OK');
  } finally { await closeDatabaseConnection(); }
}
main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode=1; });
