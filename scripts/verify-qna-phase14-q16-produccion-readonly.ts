import assert from 'node:assert/strict';
import { DATABASE_ENVIRONMENTS, assertDatabaseEnvironment } from '../src/config/databaseEnvironments.js';

const production = DATABASE_ENVIRONMENTS.PRODUCCION;
process.env.SQLSERVER_DB = production.sqlDatabase;
process.env.FIREBIRD_DATABASE = production.firebirdDatabase;
assertDatabaseEnvironment('PRODUCCION', process.env.SQLSERVER_DB, process.env.FIREBIRD_DATABASE);

const [{ connectDatabase, closeDatabaseConnection }, { LiquidacionQnaRepository }] = await Promise.all([
  import('../src/db/mssql.js'),
  import('../src/modules/liquidacionQna/infrastructure/persistence/LiquidacionQnaRepository.js'),
]);
const pool = await connectDatabase();

try {
  const result = await pool.request().query(`
    SELECT LiquidacionSnapshotId,EntidadId,Anio,Quincena,Organica0,Organica1,Organica2,Organica3,VersionEsquema
    FROM liquidacion.QnaSnapshot WHERE LiquidacionSnapshotId=2;
  `);
  const row = result.recordset[0];
  assert.ok(row, 'Falta el snapshot productivo esperado LiquidacionSnapshotId=2');
  assert.equal(Number(row.Anio), 2026);
  assert.equal(Number(row.Quincena), 16);

  const repository = new LiquidacionQnaRepository(pool);
  const snapshot = await repository.getById('2');
  const summary = await repository.getAppliedSummary({
    entidadId: Number(row.EntidadId),
    anio: Number(row.Anio),
    quincena: Number(row.Quincena),
    organica0: String(row.Organica0),
    organica1: String(row.Organica1),
    organica2: String(row.Organica2),
    organica3: String(row.Organica3),
    esAdmin: true,
  });
  assert.ok(snapshot, 'El repositorio no pudo leer el snapshot 2');
  assert.ok(summary, 'El repositorio no pudo leer el resumen aplicado Q16/2026');
  assert.equal(summary.liquidacionSnapshotId, '2');

  console.log(JSON.stringify({
    check: 'QNA_PHASE14_Q16_PRODUCCION_REPOSITORY_READ',
    environment: 'PRODUCCION',
    readOnly: true,
    sqlDatabase: production.sqlDatabase,
    snapshot: {
      liquidacionSnapshotId: snapshot.liquidacionSnapshotId,
      versionEsquema: snapshot.versionEsquema,
      fuentes: snapshot.fuentes.length,
      fuenteDetalles: snapshot.detalles.length,
    },
    appliedSummary: {
      liquidacionSnapshotId: summary.liquidacionSnapshotId,
      fuente: summary.fuente,
      periodo: summary.periodo,
      fuentes: summary.fuentes.length,
      registros: summary.totales.registros,
      totalAportacionesA2: summary.totales.totalAportacionesA2,
      totalRetencionesA2: summary.totales.totalRetencionesA2,
      totalGeneralA2: summary.totales.totalGeneralA2,
      advertencias: summary.advertencias,
    },
  }, null, 2));
  console.log('QNA_PHASE14_Q16_PRODUCCION_REPOSITORY_READONLY_OK');
} finally {
  await closeDatabaseConnection();
}
