import assert from 'node:assert/strict';
import sql from 'mssql';
import { DATABASE_ENVIRONMENTS, assertDatabaseEnvironment } from '../src/config/databaseEnvironments.js';
import type { ImportesRevision, RevisionTarea } from '../src/modules/reportes/revision/domain/Revision.types.js';

const development = DATABASE_ENVIRONMENTS.DESARROLLO;
process.env.SQLSERVER_DB = development.sqlDatabase;
process.env.FIREBIRD_DATABASE = development.firebirdDatabase;
process.env.FIREBIRD_READ_ONLY = 'true';
assertDatabaseEnvironment('DESARROLLO', process.env.SQLSERVER_DB, process.env.FIREBIRD_DATABASE);

const [{ connectDatabase, closeDatabaseConnection }, firebird, { RevisionRepository }] = await Promise.all([
  import('../src/db/mssql.js'),
  import('../src/db/firebird.js'),
  import('../src/modules/reportes/revision/infrastructure/persistence/RevisionRepository.js'),
]);

const pool = await connectDatabase();
const revisionRepo = new RevisionRepository(pool);
const usuarioId = 'REVISION_ROLLBACK_ONLY';
let transaction: sql.Transaction | null = null;

try {
  const candidate = await findCandidate(pool);
  assert(candidate, 'REVISION_MOVIMIENTOS_SIN_SCOPE_ROLLBACK_DISPONIBLE');
  const tarea: RevisionTarea = {
    idRevisionTarea: 0,
    org0: candidate.org0,
    org1: candidate.org1,
    org2: candidate.org2,
    org3: candidate.org3,
    periodo: candidate.targetPeriod,
    usuarioId,
    intentos: 0,
    claimToken: '',
    liquidacionSnapshotId: null,
  };

  const saldoAnterior = await revisionRepo.calcularSaldoAnterior(tarea);
  const [altas, bajas, suspensiones] = await Promise.all([
    revisionRepo.calcularAltasBajas(tarea, 'AL'),
    revisionRepo.calcularAltasBajas(tarea, 'BA'),
    revisionRepo.calcularAltasBajas(tarea, 'LB'),
  ]);
  const calculations = [
    { tarea, numeroConcepto: 1, importes: saldoAnterior.importes },
    { tarea, numeroConcepto: 3, importes: altas.importes },
    { tarea, numeroConcepto: 4, importes: bajas.importes },
    { tarea, numeroConcepto: 5, importes: suspensiones.importes },
  ];

  const baseline = await counts(pool, tarea);
  assert.equal(baseline.revisions, 0, 'El scope de prueba debe estar vacío para conceptos 1/3/4/5');

  transaction = new sql.Transaction(pool);
  await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);

  const inserted = await revisionRepo.guardarRevisionesEnTransaccion(transaction, calculations);
  assert.deepEqual(inserted.map((item) => item.operacion), ['INSERT', 'INSERT', 'INSERT', 'INSERT']);

  const unchanged = await revisionRepo.guardarRevisionesEnTransaccion(transaction, calculations);
  assert.deepEqual(unchanged.map((item) => item.operacion), ['SIN_CAMBIOS', 'SIN_CAMBIOS', 'SIN_CAMBIOS', 'SIN_CAMBIOS']);

  const changedConcept3: ImportesRevision = {
    ...(altas.importes as ImportesRevision),
    CAIR: Number(altas.importes.CAIR) + 0.01,
  };
  const updated = await revisionRepo.guardarRevisionesEnTransaccion(transaction, [{
    tarea,
    numeroConcepto: 3,
    importes: changedConcept3,
  }]);
  assert.equal(updated[0].operacion, 'UPDATE');
  assert.ok(updated[0].idRevisionHistorico, 'La actualización debe generar RevisionHistorico');

  const inside = await counts(transaction, tarea);
  assert.equal(inside.revisions, 4);
  assert.equal(inside.history, 1);

  await transaction.rollback();
  transaction = null;

  const after = await counts(pool, tarea);
  assert.deepEqual(after, baseline, 'ROLLBACK debe restaurar los conteos originales');
  console.log('REVISION_MOVIMIENTOS_INTEGRATION_ROLLBACK_DESARROLLO_OK');
} catch (error) {
  if (transaction) await transaction.rollback().catch(() => undefined);
  const message = error instanceof Error ? error.message : String(error);
  console.error(`REVISION_MOVIMIENTOS_INTEGRATION_BLOCKER: ${message}`);
  process.exitCode = 1;
} finally {
  await Promise.all([firebird.closeFirebirdPool(), closeDatabaseConnection()]);
}

interface Candidate {
  org0: string;
  org1: string;
  org2: string;
  org3: string;
  targetPeriod: string;
}

async function findCandidate(pool: sql.ConnectionPool): Promise<Candidate | null> {
  const source = await pool.request().query(`
    SELECT TOP (100) r.Organica0, r.Organica1, r.Organica2, r.Organica3, r.Periodo
    FROM conciliacion.Revision r
    INNER JOIN reportes.catalogoRevision c ON c.idcatalogoRevision=r.IdCatalogoRevision
    WHERE c.numeroConcepto=12 AND c.activo=1 AND r.Estatus='A'
    ORDER BY TRY_CONVERT(INT,RIGHT(r.Periodo,2)) DESC, TRY_CONVERT(INT,LEFT(r.Periodo,2)) DESC, r.IdRevision DESC;
  `);
  for (const row of source.recordset) {
    const previousPeriod = String(row.Periodo).trim();
    if (!/^\d{4}$/.test(previousPeriod)) continue;
    const targetPeriod = nextPeriod(previousPeriod);
    const tarea = {
      org0: String(row.Organica0).trim(),
      org1: String(row.Organica1).trim(),
      org2: String(row.Organica2).trim(),
      org3: String(row.Organica3).trim(),
      periodo: targetPeriod,
    };
    const existing = await counts(pool, tarea);
    if (existing.revisions === 0) return { ...tarea, targetPeriod };
  }
  return null;
}

function nextPeriod(period: string): string {
  const quincena = Number(period.slice(0, 2));
  const year = Number(period.slice(2));
  return quincena === 24
    ? `01${String((year + 1) % 100).padStart(2, '0')}`
    : `${String(quincena + 1).padStart(2, '0')}${String(year).padStart(2, '0')}`;
}

async function counts(
  connection: sql.ConnectionPool | sql.Transaction,
  scope: Pick<RevisionTarea, 'org0' | 'org1' | 'org2' | 'org3' | 'periodo'>
): Promise<{ revisions: number; history: number }> {
  const result = await new sql.Request(connection)
    .input('org0', sql.Char(2), scope.org0)
    .input('org1', sql.Char(2), scope.org1)
    .input('org2', sql.Char(2), scope.org2)
    .input('org3', sql.Char(2), scope.org3)
    .input('periodo', sql.Char(4), scope.periodo)
    .query(`
      SELECT COUNT(*) AS Total
      FROM conciliacion.Revision r
      INNER JOIN reportes.catalogoRevision c ON c.idcatalogoRevision=r.IdCatalogoRevision
      WHERE r.Organica0=@org0 AND r.Organica1=@org1 AND r.Organica2=@org2 AND r.Organica3=@org3
        AND r.Periodo=@periodo AND c.numeroConcepto IN (1,3,4,5);

      SELECT COUNT(*) AS Total
      FROM conciliacion.RevisionHistorico h
      INNER JOIN conciliacion.Revision r ON r.IdRevision=h.IdRevision
      INNER JOIN reportes.catalogoRevision c ON c.idcatalogoRevision=r.IdCatalogoRevision
      WHERE r.Organica0=@org0 AND r.Organica1=@org1 AND r.Organica2=@org2 AND r.Organica3=@org3
        AND r.Periodo=@periodo AND c.numeroConcepto IN (1,3,4,5);
    `);
  return {
    revisions: Number(result.recordsets[0][0]?.Total ?? 0),
    history: Number(result.recordsets[1][0]?.Total ?? 0),
  };
}
