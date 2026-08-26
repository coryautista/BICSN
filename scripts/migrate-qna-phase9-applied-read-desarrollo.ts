import { readFile } from 'node:fs/promises';
import { DATABASE_ENVIRONMENTS, assertDatabaseEnvironment } from '../src/config/databaseEnvironments.js';

const execute = process.argv.includes('--execute');
const confirmed = process.argv.includes('--confirm-development=SII-ISSSSPEA-DES');
const development = DATABASE_ENVIRONMENTS.DESARROLLO;
if (execute && !confirmed) throw new Error('CONFIRMACION_REQUERIDA:--confirm-development=SII-ISSSSPEA-DES');
process.env.SQLSERVER_DB=development.sqlDatabase;
process.env.FIREBIRD_DATABASE=development.firebirdDatabase;
assertDatabaseEnvironment('DESARROLLO',process.env.SQLSERVER_DB,process.env.FIREBIRD_DATABASE);
const migration = await readFile(new URL('../database/migrations/20260826_15_add_qna_phase9_applied_read_index.sql',import.meta.url),'utf8');
const verification = await readFile(new URL('../database/migrations/20260826_16_verify_qna_phase9_applied_read_index.sql',import.meta.url),'utf8');
const { connectDatabase,closeDatabaseConnection }=await import('../src/db/mssql.js');
const pool=await connectDatabase();
try {
  const database=String((await pool.request().query('SELECT DB_NAME() BaseDatos')).recordset[0].BaseDatos);
  if(database!==development.sqlDatabase) throw new Error(`DESTINO_SQL_NO_PERMITIDO:${database}`);
  if(!execute){ console.log(JSON.stringify({environment:'DESARROLLO',database,execute:false,migration:'20260826_15_add_qna_phase9_applied_read_index.sql'},null,2)); console.log('QNA_PHASE9_APPLIED_READ_MIGRATION_DRY_RUN_OK'); }
  else { await pool.request().batch(migration); const evidence=(await pool.request().batch(verification)).recordset[0]; console.log(JSON.stringify({environment:'DESARROLLO',database,execute:true,evidence},null,2)); console.log('QNA_PHASE9_APPLIED_READ_MIGRATION_OK'); }
} finally { await closeDatabaseConnection(); }
