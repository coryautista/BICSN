import assert from 'node:assert/strict';
import { DATABASE_ENVIRONMENTS, assertDatabaseEnvironment } from '../src/config/databaseEnvironments.js';

const production = DATABASE_ENVIRONMENTS.PRODUCCION;
process.env.SQLSERVER_DB = production.sqlDatabase;
process.env.FIREBIRD_DATABASE = production.firebirdDatabase;
process.env.FIREBIRD_READ_ONLY = 'true';
process.env.QNA_LEGACY_DUAL_WRITE_ENABLED = 'true';
assertDatabaseEnvironment('PRODUCCION', process.env.SQLSERVER_DB, process.env.FIREBIRD_DATABASE);

const requiredObjects = [
  'liquidacion.QnaSnapshotDetalle',
  'liquidacion.QnaSnapshotFuenteDetalle',
  'liquidacion.QnaSnapshotTotal',
  'liquidacion.QnaLegacyProjection',
  'liquidacion.QnaLegacyReconciliacion',
  'liquidacion.QnaAplicacionIntento',
  'liquidacion.QnaAplicacionIntentoEvento',
  'liquidacion.QnaAplicacionResolucion'
] as const;
const requiredColumns = [
  ['liquidacion.QnaSnapshotDetalle', 'Interno'],
  ['liquidacion.QnaSnapshotDetalle', 'HashFila'],
  ['liquidacion.QnaSnapshotFuenteDetalle', 'PayloadVersion'],
  ['liquidacion.QnaSnapshotFuenteDetalle', 'PayloadCanonico'],
  ['liquidacion.QnaSnapshotFuenteDetalle', 'HashFila']
] as const;
const requiredArtifacts = [
  ['liquidacion.spProyectarLegacyDesdeSnapshotV5', 'P'],
  ['liquidacion.spConciliarLegacySnapshotV5', 'P'],
  ['retenciones.spProyectarRetencionesV3DesdeSnapshotV5', 'P'],
  ['liquidacion.TR_QnaAplicacionIntentoEvento_Inmutable', 'TR'],
  ['liquidacion.TR_QnaAplicacionResolucion_Inmutable', 'TR']
] as const;

const [mssql, firebird] = await Promise.all([
  import('../src/db/mssql.js'),
  import('../src/db/firebird.js')
]);
const pool = await mssql.connectDatabase();

try {
  const result = await pool.request().query(`
    SELECT DB_NAME() BaseDatos;
    SELECT v.Objeto,CASE WHEN OBJECT_ID(v.Objeto,N'U') IS NULL THEN 0 ELSE 1 END Existe
    FROM (VALUES ${requiredObjects.map((name) => `(N'${name}')`).join(',')}) v(Objeto);
    SELECT v.Objeto,v.Columna,CASE WHEN COL_LENGTH(v.Objeto,v.Columna) IS NULL THEN 0 ELSE 1 END Existe
    FROM (VALUES ${requiredColumns.map(([object, column]) => `(N'${object}',N'${column}')`).join(',')}) v(Objeto,Columna);
    SELECT v.Objeto,v.Tipo,CASE WHEN OBJECT_ID(v.Objeto,v.Tipo) IS NULL THEN 0 ELSE 1 END Existe
    FROM (VALUES ${requiredArtifacts.map(([object, type]) => `(N'${object}',N'${type}')`).join(',')}) v(Objeto,Tipo);
    SELECT fk.name Restriccion FROM sys.foreign_keys fk
    WHERE fk.parent_object_id IN (OBJECT_ID(N'liquidacion.QnaSnapshotDetalle'),OBJECT_ID(N'liquidacion.QnaSnapshotFuenteDetalle'))
      AND (fk.is_disabled=1 OR fk.is_not_trusted=1);
  `);
  assert.equal(String(result.recordsets[0][0]?.BaseDatos), production.sqlDatabase);
  const firebirdRows = await firebird.executeTechnicalQuery('SELECT CURRENT_TIMESTAMP FECHA_SERVIDOR FROM RDB$DATABASE');
  assert.equal(firebirdRows.length, 1);

  const missingObjects = result.recordsets[1].filter((row) => Number(row.Existe) !== 1);
  const missingColumns = result.recordsets[2].filter((row) => Number(row.Existe) !== 1);
  const missingArtifacts = result.recordsets[3].filter((row) => Number(row.Existe) !== 1);
  const untrustedConstraints = result.recordsets[4];
  const ready = missingObjects.length === 0 && missingColumns.length === 0
    && missingArtifacts.length === 0 && untrustedConstraints.length === 0;

  console.log(JSON.stringify({
    check: 'QNA_PHASE14_PRODUCCION_PREFLIGHT',
    environment: 'PRODUCCION',
    readOnly: true,
    sqlDatabase: production.sqlDatabase,
    firebirdDatabase: production.firebirdDatabase,
    qnaLegacyDualWriteEnabled: true,
    ready,
    missingObjects,
    missingColumns,
    missingArtifacts,
    untrustedConstraints,
    firebirdOk: true
  }, null, 2));
  if (!ready) throw new Error('QNA_PHASE14_PRODUCCION_SCHEMA_NOT_READY');
  console.log('QNA_PHASE14_PRODUCCION_PREFLIGHT_OK');
} finally {
  await Promise.allSettled([mssql.closeDatabaseConnection(), firebird.closeFirebirdConnection()]);
}
