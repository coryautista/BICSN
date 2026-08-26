import {DATABASE_ENVIRONMENTS,assertDatabaseEnvironment} from '../src/config/databaseEnvironments.js';
import {appliedAllSourcesCte,appliedAllSourcesSearch,appliedStructuralConflictSql,legacyOwnershipConflictSql} from '../src/modules/liquidacionQna/infrastructure/persistence/LiquidacionQnaRepository.js';
const development=DATABASE_ENVIRONMENTS.DESARROLLO;
process.env.SQLSERVER_DB=development.sqlDatabase;process.env.FIREBIRD_DATABASE=development.firebirdDatabase;
assertDatabaseEnvironment('DESARROLLO',process.env.SQLSERVER_DB,process.env.FIREBIRD_DATABASE);
const {connectDatabase,closeDatabaseConnection}=await import('../src/db/mssql.js');
const pool=await connectDatabase();
try{
  const result=await pool.request().batch(`SET STATISTICS XML ON;
    DECLARE @Busqueda NVARCHAR(206)=N'%fixture%',@Offset INT=0,@Tamanio INT=100;
    ${appliedAllSourcesCte()} SELECT TOP(1) COALESCE(a.IntegrityCode,CASE WHEN a.Fuente='HISTORICO_LEGACY' THEN 'QNA_APLICADA_LEGACY_OWNERSHIP_CONFLICT' ELSE 'QNA_APLICADA_INTEGRIDAD_INVALIDA' END)
      FROM Elegibles a WHERE ${appliedAllSourcesSearch()} AND (a.IntegrityCode IS NOT NULL OR (a.Fuente='HISTORICO_LEGACY' AND ${legacyOwnershipConflictSql('a')}) OR (a.Fuente<>'HISTORICO_LEGACY' AND ${appliedStructuralConflictSql('a')}));
    ${appliedAllSourcesCte()} SELECT COUNT(*) Total FROM Elegibles a WHERE ${appliedAllSourcesSearch()};
    ${appliedAllSourcesCte()} SELECT * FROM Elegibles a WHERE ${appliedAllSourcesSearch()} ORDER BY a.Anio DESC,a.Quincena DESC,a.EntidadId,a.Organica0,a.Organica1,a.Organica2,a.Organica3,a.FechaAplicacion DESC,a.OrdenTie DESC OFFSET @Offset ROWS FETCH NEXT @Tamanio ROWS ONLY;
    SET STATISTICS XML OFF;`);
  const plan=JSON.stringify(result.recordsets);
  if(!plan.includes('IX_BitacoraOrg_Lookup'))throw new Error('QNA_PHASE10_PLAN_NO_USA_INDICE_TERMINADO_LEGACY');
  if(!plan.includes('IX_QnaProcesoTransicion_EstadoProcesoFecha'))throw new Error('QNA_PHASE10_PLAN_NO_USA_INDICE_TRANSICION');
  if(!plan.includes('IX_IndividualesAhorroHistorico_QnaEntidad')&&!plan.includes('IX_IndividualesAhorroHistorico_OrganicaPeriodo'))throw new Error('QNA_PHASE10_PLAN_NO_USA_INDICE_DETALLE_LEGACY');
  if(!plan.includes('QnaLegacyScopeOwnership'))throw new Error('QNA_PHASE10_PLAN_NO_CUBRE_OWNERSHIP');
  console.log('QNA_PHASE10_APPLIED_PLAN_DESARROLLO_OK');
}finally{await closeDatabaseConnection();}
