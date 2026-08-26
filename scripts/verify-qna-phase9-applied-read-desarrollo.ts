import { readFile } from 'node:fs/promises';
import { DATABASE_ENVIRONMENTS, assertDatabaseEnvironment } from '../src/config/databaseEnvironments.js';

const development=DATABASE_ENVIRONMENTS.DESARROLLO;
process.env.SQLSERVER_DB=development.sqlDatabase;
process.env.FIREBIRD_DATABASE=development.firebirdDatabase;
assertDatabaseEnvironment('DESARROLLO',process.env.SQLSERVER_DB,process.env.FIREBIRD_DATABASE);
const source=await readFile(new URL('../database/migrations/20260826_16_verify_qna_phase9_applied_read_index.sql',import.meta.url),'utf8');
const { connectDatabase,closeDatabaseConnection }=await import('../src/db/mssql.js');
const pool=await connectDatabase();
try {
  const result=await pool.request().batch(source);
  const evidence=result.recordset[0];
  if(evidence?.Resultado!=='QNA_PHASE9_APPLIED_READ_INDEX_OK') throw new Error('QNA_PHASE9_VERIFICACION_SIN_EVIDENCIA');
  console.log(JSON.stringify({environment:'DESARROLLO',sqlDatabase:development.sqlDatabase,firebirdDatabase:development.firebirdDatabase,evidence},null,2));
  console.log('QNA_PHASE9_APPLIED_READ_VERIFY_OK');
} finally { await closeDatabaseConnection(); }
