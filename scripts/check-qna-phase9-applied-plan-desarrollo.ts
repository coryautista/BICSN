import { DATABASE_ENVIRONMENTS,assertDatabaseEnvironment } from '../src/config/databaseEnvironments.js';
const development=DATABASE_ENVIRONMENTS.DESARROLLO;
process.env.SQLSERVER_DB=development.sqlDatabase; process.env.FIREBIRD_DATABASE=development.firebirdDatabase;
assertDatabaseEnvironment('DESARROLLO',process.env.SQLSERVER_DB,process.env.FIREBIRD_DATABASE);
const {connectDatabase,closeDatabaseConnection}=await import('../src/db/mssql.js');
const pool=await connectDatabase();
try {
  const result=await pool.request().batch(`SET STATISTICS XML ON;
    WITH Terminadas AS (
      SELECT tr.QnaProcesoId,tr.LiquidacionSnapshotId,tr.FechaCreacion FechaAplicacion,tr.QnaProcesoTransicionId,
        ROW_NUMBER() OVER(PARTITION BY tr.QnaProcesoId ORDER BY tr.FechaCreacion DESC,tr.QnaProcesoTransicionId DESC) rn
      FROM liquidacion.QnaProcesoTransicion tr
      JOIN liquidacion.QnaSnapshot s ON s.LiquidacionSnapshotId=tr.LiquidacionSnapshotId AND s.VersionEsquema=5
      WHERE tr.EstadoDestino='TERMINADO' AND tr.LiquidacionSnapshotId IS NOT NULL
    ), Aplicadas AS (
      SELECT p.QnaProcesoId,p.EntidadId,p.Anio,p.Quincena,p.Organica0,p.Organica1,p.Organica2,p.Organica3,
        t.LiquidacionSnapshotId,t.FechaAplicacion,t.QnaProcesoTransicionId
      FROM Terminadas t JOIN liquidacion.QnaProceso p ON p.QnaProcesoId=t.QnaProcesoId WHERE t.rn=1
    )
    SELECT TOP(100) a.QnaProcesoId,a.LiquidacionSnapshotId,a.FechaAplicacion
    FROM Aplicadas a JOIN liquidacion.QnaSnapshot s ON s.LiquidacionSnapshotId=a.LiquidacionSnapshotId
    ORDER BY a.Anio DESC,a.Quincena DESC,a.EntidadId,a.Organica0,a.Organica1,a.Organica2,a.Organica3,a.FechaAplicacion DESC,a.QnaProcesoTransicionId DESC;
    SET STATISTICS XML OFF;`);
  const serialized=JSON.stringify(result.recordsets);
  if(!serialized.includes('IX_QnaProcesoTransicion_EstadoProcesoFecha')) throw new Error('QNA_PHASE9_PLAN_NO_USA_INDICE_TERMINADO');
  console.log(JSON.stringify({environment:'DESARROLLO',database:development.sqlDatabase,index:'IX_QnaProcesoTransicion_EstadoProcesoFecha',planEvidence:true},null,2));
  console.log('QNA_PHASE9_APPLIED_PLAN_OK');
} finally { await closeDatabaseConnection(); }
