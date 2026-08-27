import {readFile} from 'node:fs/promises';
import sql from 'mssql';
import {DATABASE_ENVIRONMENTS,assertDatabaseEnvironment} from '../src/config/databaseEnvironments.js';
const execute=process.argv.includes('--execute');const confirmed=process.argv.includes('--confirm-development=SII-ISSSSPEA-DES');
if(execute&&!confirmed)throw new Error('CONFIRMACION_REQUERIDA');const development=DATABASE_ENVIRONMENTS.DESARROLLO;
process.env.SQLSERVER_DB=development.sqlDatabase;process.env.FIREBIRD_DATABASE=development.firebirdDatabase;
assertDatabaseEnvironment('DESARROLLO',process.env.SQLSERVER_DB,process.env.FIREBIRD_DATABASE);
const {connectDatabase,closeDatabaseConnection}=await import('../src/db/mssql.js');const pool=await connectDatabase();
try{const source=await readFile(new URL('../database/migrations/20260826_17_create_qna_phase11_attempt_ledger.sql',import.meta.url),'utf8');
  const transaction=new sql.Transaction(pool);await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
  try{for(const batch of source.split(/^\s*GO\s*$/gim).map(x=>x.trim()).filter(Boolean))await new sql.Request(transaction).batch(batch);
    if(execute){await transaction.commit();console.log('QNA_PHASE11_ATTEMPT_LEDGER_MIGRATION_OK');}
    else{await transaction.rollback();console.log('QNA_PHASE11_ATTEMPT_LEDGER_DRY_RUN_OK');}
  }catch(error){await transaction.rollback().catch(()=>undefined);throw error;}}
finally{await closeDatabaseConnection();}
