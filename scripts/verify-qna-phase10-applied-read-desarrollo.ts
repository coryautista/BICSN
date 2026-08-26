import assert from 'node:assert/strict';
import {DATABASE_ENVIRONMENTS,assertDatabaseEnvironment} from '../src/config/databaseEnvironments.js';

const development=DATABASE_ENVIRONMENTS.DESARROLLO;
process.env.SQLSERVER_DB=development.sqlDatabase;
process.env.FIREBIRD_DATABASE=development.firebirdDatabase;
assertDatabaseEnvironment('DESARROLLO',process.env.SQLSERVER_DB,process.env.FIREBIRD_DATABASE);
const {connectDatabase,closeDatabaseConnection}=await import('../src/db/mssql.js');
const pool=await connectDatabase();
try{
  const result=await pool.request().query(`SELECT DB_NAME() BaseDatos;
    SELECT v.Nombre,o.object_id FROM(VALUES
      ('afec.BitacoraAfectacionOrg'),('liquidacion.QnaSnapshot'),('liquidacion.QnaSnapshotFuente'),('liquidacion.QnaSnapshotTotal'),
      ('liquidacion.QnaSnapshotDetalle'),('liquidacion.QnaSnapshotFuenteDetalle'),('liquidacion.QnaProceso'),('liquidacion.QnaProcesoTransicion'),
      ('liquidacion.QnaLegacyScopeOwnership'),('aportaciones.IndividualesAhorroHistorico'),('aportaciones.IndividualesViviendaHistorico'),
      ('aportaciones.IndividualesPrestacionesHistorico'),('aportaciones.IndividualesCairHistorico'),('aportaciones.GuarderiasHistorico'),
      ('aportaciones.PensionNominaTransitorioHistorico'),('aportaciones.AguinaldoHistorico'),('retenciones.PrestamosCortoPlazoHistorico'),
      ('retenciones.PrestamosMedianoPlazoHistorico'),('retenciones.PrestamosHipotecariosHistorico'),('aportaciones.ResumenHistorico'),
      ('conciliacion.RevisionAplicacionHistorico'))v(Nombre) LEFT JOIN sys.objects o ON o.object_id=OBJECT_ID(v.Nombre);
    SELECT CONCAT(OBJECT_SCHEMA_NAME(c.object_id),'.',OBJECT_NAME(c.object_id)) Tabla,c.name Columna FROM sys.columns c
      WHERE c.name IN('QnaLiquidacionSnapshotId','QnaSourceOrden') AND c.object_id IN(OBJECT_ID('aportaciones.IndividualesAhorroHistorico'),OBJECT_ID('aportaciones.IndividualesViviendaHistorico'),
        OBJECT_ID('aportaciones.IndividualesPrestacionesHistorico'),OBJECT_ID('aportaciones.IndividualesCairHistorico'),OBJECT_ID('aportaciones.GuarderiasHistorico'),OBJECT_ID('aportaciones.PensionNominaTransitorioHistorico'),
        OBJECT_ID('aportaciones.AguinaldoHistorico'),OBJECT_ID('retenciones.PrestamosCortoPlazoHistorico'),OBJECT_ID('retenciones.PrestamosMedianoPlazoHistorico'),OBJECT_ID('retenciones.PrestamosHipotecariosHistorico'));
    SELECT name FROM sys.indexes WHERE object_id=OBJECT_ID('liquidacion.QnaProcesoTransicion') AND name='IX_QnaProcesoTransicion_EstadoProcesoFecha' AND is_disabled=0;
    SELECT name FROM sys.indexes WHERE object_id=OBJECT_ID('afec.BitacoraAfectacionOrg') AND name='IX_BitacoraOrg_Lookup' AND is_disabled=0;`);
  const sets=result.recordsets as Array<Array<Record<string,unknown>>>;
  assert.equal(sets[0][0].BaseDatos,development.sqlDatabase);
  assert.deepEqual(sets[1].filter(row=>row.object_id==null),[],'Faltan stores persistidos aceptados por fase 10');
  assert.equal(sets[2].length,20,'Los diez stores deben conservar provenance V5 completo');
  assert.equal(sets[3].length,1,'Falta indice determinista de transiciones');
  assert.equal(sets[4].length,1,'Falta indice de evidencia TERMINADO por alcance');
  console.log('QNA_PHASE10_APPLIED_READ_VERIFIER_DESARROLLO_OK');
}finally{await closeDatabaseConnection();}
