import assert from 'node:assert/strict';
import { DATABASE_ENVIRONMENTS, assertDatabaseEnvironment } from '../src/config/databaseEnvironments.js';

const development = DATABASE_ENVIRONMENTS.DESARROLLO;
process.env.SQLSERVER_DB = development.sqlDatabase;
process.env.FIREBIRD_DATABASE = development.firebirdDatabase;
assertDatabaseEnvironment('DESARROLLO', process.env.SQLSERVER_DB, process.env.FIREBIRD_DATABASE);

const org0 = process.argv[2] ?? '04';
const org1 = process.argv[3] ?? '24';
const anio = Number(process.argv[4] ?? '2026');
const quincena = Number(process.argv[5] ?? '15');
assert.match(org0, /^\d{2}$/);
assert.match(org1, /^\d{2}$/);
assert.ok(Number.isInteger(anio) && anio >= 2000 && anio <= 2100);
assert.ok(Number.isInteger(quincena) && quincena >= 1 && quincena <= 24);

const periodo = `${String(quincena).padStart(2, '0')}${String(anio).slice(-2)}`;
const { connectDatabase, closeDatabaseConnection, sql } = await import('../src/db/mssql.js');
const pool = await connectDatabase();

try {
  const bitacoraResult = await pool.request()
    .input('org0', sql.VarChar(30), org0)
    .input('org1', sql.VarChar(30), org1)
    .input('anio', sql.SmallInt, anio)
    .input('quincena', sql.TinyInt, quincena)
    .query(`
      SELECT TOP (1)
        AfectacionId, EntidadId, Org2, Org3, AplicacionMovimientosFinalizada,
        AplicacionMovimientosTotal, AplicacionMovimientosAplicados,
        AplicacionMovimientosCancelados, Resultado
      FROM afec.BitacoraAfectacionOrg
      WHERE Entidad='AFILIADOS' AND Org0=@org0 AND Org1=@org1
        AND Anio=@anio AND Quincena=@quincena
        AND Accion IN ('Aplicar','APLICAR')
      ORDER BY CreatedAt DESC, AfectacionId DESC;
    `);
  assert.equal(bitacoraResult.recordset.length, 1, 'BITACORA_APLICAR_NOT_FOUND');
  const bitacora = bitacoraResult.recordset[0];
  assert.ok(
    bitacora.AplicacionMovimientosFinalizada === true
      || Number(bitacora.AplicacionMovimientosFinalizada) === 1,
    'APLICACION_MOVIMIENTOS_NO_FINALIZADA'
  );
  assert.equal(String(bitacora.Resultado).trim().toUpperCase(), 'OK');

  const org2 = String(bitacora.Org2 ?? '01').trim() || '01';
  const org3 = String(bitacora.Org3 ?? '01').trim() || '01';
  const entidadId = bitacora.EntidadId == null ? 1 : Number(bitacora.EntidadId);

  const movimientosResult = await pool.request()
    .input('org0', sql.VarChar(30), org0)
    .input('org1', sql.VarChar(30), org1)
    .input('anio', sql.SmallInt, anio)
    .input('quincena', sql.TinyInt, quincena)
    .input('quincenaId', sql.VarChar(30), `${anio}-${String(quincena).padStart(2, '0')}`)
    .query(`
      SELECT
        COUNT(DISTINCT a.id) Total,
        SUM(CASE WHEN a.numValidacion=2 THEN 1 ELSE 0 END) Aprobados,
        SUM(CASE WHEN a.numValidacion=6 THEN 1 ELSE 0 END) Cancelados,
        SUM(CASE WHEN a.numValidacion=7 THEN 1 ELSE 0 END) Aplicados,
        SUM(CASE WHEN a.numValidacion NOT IN (2,6,7) THEN 1 ELSE 0 END) NoPermitidos
      FROM afi.Afiliado a
      INNER JOIN afi.AfiliadoOrg ao ON ao.afiliadoId=a.id
      WHERE ao.claveOrganica0=@org0 AND ao.claveOrganica1=@org1
        AND a.estatus=1 AND a.anioAplicacion=@anio AND a.quincenaAplicacion=@quincena
        AND EXISTS (
          SELECT 1 FROM afi.Movimiento m
          WHERE m.afiliadoId=a.id AND m.estatus='A' AND m.quincenaId=@quincenaId
        );
    `);
  const movimientos = movimientosResult.recordset[0];
  assert.equal(Number(movimientos.Aprobados ?? 0), 0, 'MOVIMIENTOS_APROBADOS_PENDIENTES');
  assert.equal(Number(movimientos.NoPermitidos ?? 0), 0, 'MOVIMIENTOS_ESTADO_NO_PERMITIDO');

  const revisionResult = await pool.request()
    .input('org0', sql.Char(2), org0)
    .input('org1', sql.Char(2), org1)
    .input('org2', sql.Char(2), org2)
    .input('org3', sql.Char(2), org3)
    .input('periodo', sql.Char(4), periodo)
    .query(`
      SELECT c.numeroConcepto, r.Estatus
      FROM conciliacion.Revision r
      INNER JOIN reportes.catalogoRevision c ON c.idcatalogoRevision=r.IdCatalogoRevision
      WHERE r.Organica0=@org0 AND r.Organica1=@org1
        AND r.Organica2=@org2 AND r.Organica3=@org3
        AND r.Periodo=@periodo AND c.numeroConcepto IN (1,3,4,5)
      ORDER BY c.numeroConcepto;
    `);
  assert.deepEqual(
    revisionResult.recordset.map((row) => Number(row.numeroConcepto)),
    [1, 3, 4, 5],
    'REVISION_MOVIMIENTOS_INCOMPLETA'
  );
  assert.ok(revisionResult.recordset.every((row) => String(row.Estatus).trim() === 'A'));

  console.log(JSON.stringify({
    ambiente: 'DESARROLLO',
    scope: { entidadId, anio, quincena, periodo, org0, org1, org2, org3 },
    bitacora: {
      finalizada: true,
      total: Number(bitacora.AplicacionMovimientosTotal ?? 0),
      aplicados: Number(bitacora.AplicacionMovimientosAplicados ?? 0),
      cancelados: Number(bitacora.AplicacionMovimientosCancelados ?? 0),
    },
    movimientos: {
      total: Number(movimientos.Total ?? 0),
      aprobadosPendientes: Number(movimientos.Aprobados ?? 0),
      aplicados: Number(movimientos.Aplicados ?? 0),
      cancelados: Number(movimientos.Cancelados ?? 0),
    },
    revisionMovimientos: [1, 3, 4, 5],
  }, null, 2));
  console.log('REVISION_MOVIMIENTOS_DESARROLLO_VERIFICADA');
} finally {
  await closeDatabaseConnection();
}
