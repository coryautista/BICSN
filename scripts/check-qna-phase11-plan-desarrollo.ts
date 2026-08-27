import { DATABASE_ENVIRONMENTS, assertDatabaseEnvironment } from '../src/config/databaseEnvironments.js';
const development=DATABASE_ENVIRONMENTS.DESARROLLO;process.env.SQLSERVER_DB=development.sqlDatabase;process.env.FIREBIRD_DATABASE=development.firebirdDatabase;
assertDatabaseEnvironment('DESARROLLO',process.env.SQLSERVER_DB,process.env.FIREBIRD_DATABASE);
const {connectDatabase,closeDatabaseConnection}=await import('../src/db/mssql.js');const pool=await connectDatabase();
try{const plan=await pool.request().batch(`SET STATISTICS XML ON;
  SELECT TOP(1) * FROM liquidacion.QnaAplicacionIntento WHERE QnaProcesoId=1 ORDER BY FechaCreacion DESC,QnaAplicacionIntentoId DESC;
  SET STATISTICS XML OFF;`);const xml=JSON.stringify(plan.recordsets);if(!xml.includes('IX_QnaAplicacionIntento_ProcesoFecha'))throw new Error('QNA_PHASE11_PLAN_NO_USA_INDICE_INTENTO');
  console.log('QNA_PHASE11_PLAN_DESARROLLO_OK');}finally{await closeDatabaseConnection();}
