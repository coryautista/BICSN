import { DATABASE_ENVIRONMENTS, assertDatabaseEnvironment } from '../src/config/databaseEnvironments.js';

const development=DATABASE_ENVIRONMENTS.DESARROLLO;
process.env.SQLSERVER_DB=development.sqlDatabase;
process.env.FIREBIRD_DATABASE=development.firebirdDatabase;
assertDatabaseEnvironment('DESARROLLO',process.env.SQLSERVER_DB,process.env.FIREBIRD_DATABASE);
const {connectDatabase,closeDatabaseConnection}=await import('../src/db/mssql.js');
const pool=await connectDatabase();
try{
  const result=await pool.request().query(`SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;
    SELECT DB_NAME() BaseDatos,s.VersionEsquema,s.Estado,COUNT_BIG(*) Registros FROM liquidacion.QnaSnapshot s GROUP BY s.VersionEsquema,s.Estado ORDER BY s.VersionEsquema,s.Estado;
    SELECT CONCAT(OBJECT_SCHEMA_NAME(c.object_id),'.',OBJECT_NAME(c.object_id)) Tabla,c.column_id Orden,c.name Columna,TYPE_NAME(c.user_type_id) Tipo,c.is_nullable Nullable
    FROM sys.columns c WHERE c.object_id IN(OBJECT_ID('afec.BitacoraAfectacionOrg'),OBJECT_ID('liquidacion.QnaSnapshot'),OBJECT_ID('liquidacion.QnaSnapshotFuente'),
      OBJECT_ID('liquidacion.QnaSnapshotTotal'),OBJECT_ID('liquidacion.QnaSnapshotDetalle'),OBJECT_ID('liquidacion.QnaSnapshotFuenteDetalle'),OBJECT_ID('aportaciones.ResumenHistorico'),
      OBJECT_ID('conciliacion.RevisionAplicacionHistorico')) ORDER BY Tabla,c.column_id;
    SELECT CONCAT(OBJECT_SCHEMA_NAME(i.object_id),'.',OBJECT_NAME(i.object_id)) Tabla,i.name Indice,STRING_AGG(CONVERT(NVARCHAR(MAX),c.name),'|') WITHIN GROUP(ORDER BY ic.key_ordinal,ic.index_column_id) Columnas
    FROM sys.indexes i JOIN sys.index_columns ic ON ic.object_id=i.object_id AND ic.index_id=i.index_id JOIN sys.columns c ON c.object_id=ic.object_id AND c.column_id=ic.column_id
    WHERE i.object_id IN(OBJECT_ID('afec.BitacoraAfectacionOrg'),OBJECT_ID('liquidacion.QnaProcesoTransicion')) GROUP BY i.object_id,i.name ORDER BY Tabla,i.name;`);
  console.log(JSON.stringify({environment:'DESARROLLO',database:development.sqlDatabase,sets:result.recordsets},null,2));
  console.log('QNA_PHASE10_APPLIED_INVENTORY_DESARROLLO_READONLY_OK');
}finally{await closeDatabaseConnection();}
