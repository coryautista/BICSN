import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import sql from 'mssql';
import {DATABASE_ENVIRONMENTS,assertDatabaseEnvironment} from '../src/config/databaseEnvironments.js';

const development=DATABASE_ENVIRONMENTS.DESARROLLO;process.env.SQLSERVER_DB=development.sqlDatabase;process.env.FIREBIRD_DATABASE=development.firebirdDatabase;
assertDatabaseEnvironment('DESARROLLO',process.env.SQLSERVER_DB,process.env.FIREBIRD_DATABASE);
const {connectDatabase,closeDatabaseConnection}=await import('../src/db/mssql.js');const pool=await connectDatabase();const transaction=new sql.Transaction(pool);let active=false;
try{await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);active=true;
  await new sql.Request(transaction).batch(`ALTER TABLE liquidacion.QnaAplicacionIntento DROP CONSTRAINT CK_QnaAplicacionIntento_Invariante;
    DROP INDEX UX_QnaAplicacionIntento_Claim ON liquidacion.QnaAplicacionIntento;
    DROP TRIGGER liquidacion.TR_QnaAplicacionResolucion_Inmutable;`);
  const source=await readFile(new URL('../database/migrations/20260826_17_create_qna_phase11_attempt_ledger.sql',import.meta.url),'utf8');
  for(const batch of source.split(/^\s*GO\s*$/gim).map(value=>value.trim()).filter(Boolean))await new sql.Request(transaction).batch(batch);
  const repaired=(await new sql.Request(transaction).query(`SELECT
    (SELECT COUNT(*)FROM sys.check_constraints WHERE name='CK_QnaAplicacionIntento_Invariante' AND is_disabled=0 AND is_not_trusted=0)Checks,
    (SELECT COUNT(*)FROM sys.indexes WHERE object_id=OBJECT_ID('liquidacion.QnaAplicacionIntento') AND name='UX_QnaAplicacionIntento_Claim' AND is_unique=1 AND is_disabled=0)Indexes,
    (SELECT COUNT(*)FROM sys.triggers WHERE name='TR_QnaAplicacionResolucion_Inmutable' AND is_disabled=0)Triggers`)).recordset[0];
  assert.deepEqual(Object.values(repaired).map(Number),[1,1,1]);await transaction.rollback();active=false;console.log('QNA_PHASE11_MIGRATION_REPAIR_DESARROLLO_OK');
}finally{if(active)await transaction.rollback().catch(()=>undefined);await closeDatabaseConnection();}
