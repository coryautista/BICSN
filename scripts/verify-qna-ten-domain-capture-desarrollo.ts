import assert from 'node:assert/strict';
import { DATABASE_ENVIRONMENTS, assertDatabaseEnvironment } from '../src/config/databaseEnvironments.js';

const DEVELOPMENT = DATABASE_ENVIRONMENTS.DESARROLLO;
const scope = {
  entidadId: 1,
  anio: 2026,
  quincena: 15,
  organica0: '04',
  organica1: '24',
  organica2: '01',
  organica3: '01'
};

process.env.SQLSERVER_DB = DEVELOPMENT.sqlDatabase;
process.env.FIREBIRD_DATABASE = DEVELOPMENT.firebirdDatabase;
process.env.FIREBIRD_READ_ONLY = 'true';
assertDatabaseEnvironment('DESARROLLO', process.env.SQLSERVER_DB, process.env.FIREBIRD_DATABASE);

async function main(): Promise<void> {
  const [mssql, firebird, formulaModule, repositoryModule, captureModule] = await Promise.all([
    import('../src/db/mssql.js'),
    import('../src/db/firebird.js'),
    import('../src/modules/aportacionesFondos/infrastructure/persistence/FormulaCalculoRepository.js'),
    import('../src/modules/aportacionesFondos/infrastructure/persistence/AportacionFondoRepository.js'),
    import('../src/modules/liquidacionQna/application/queries/CaptureQnaTenDomainsQuery.js')
  ]);
  const pool = await mssql.connectDatabase();

  try {
    const database = await pool.request().query('SELECT DB_NAME() AS BaseDatos');
    assert.equal(database.recordset[0]?.BaseDatos, DEVELOPMENT.sqlDatabase);
    const snapshotsBefore = await countSnapshots(pool);
    const repository = new repositoryModule.AportacionFondoRepository(
      new formulaModule.FormulaCalculoRepository(pool)
    );
    const capture = await new captureModule.CaptureQnaTenDomainsQuery(repository).execute({
      ...scope,
      ambiente: 'DESARROLLO',
      usuarioId: 'VALIDACION_READ_ONLY'
    });
    const snapshotsAfter = await countSnapshots(pool);

    assert.equal(capture.periodo, '1526');
    assert.equal(capture.hipProcedure, 'AP_S_HIP_QNA');
    assert.equal(snapshotsAfter, snapshotsBefore, 'La captura read-only no debe crear snapshots');

    console.log(JSON.stringify({
      environment: capture.ambiente,
      sqlDatabase: DEVELOPMENT.sqlDatabase,
      firebirdDatabase: DEVELOPMENT.firebirdDatabase,
      periodo: capture.periodo,
      organica: `${scope.organica0}-${scope.organica1}-${scope.organica2}-${scope.organica3}`,
      readOnly: true,
      hipProcedure: capture.hipProcedure,
      snapshotsBefore,
      snapshotsAfter,
      fondos: Object.fromEntries(Object.entries(capture.fondos).map(([domain, fund]) => [domain, {
        registros: fund.rows.length,
        totalA2: fund.totalA2
      }])),
      auxiliares: Object.fromEntries(Object.entries(capture.auxiliares).map(([domain, source]) => [domain, {
        estado: source.source.estado,
        registros: source.details.length,
        totalA2: source.totalA2,
        procedure: source.procedure
      }]))
    }, null, 2));
    console.log('QNA_TEN_DOMAIN_CAPTURE_DESARROLLO_READONLY_OK');
  } finally {
    await Promise.allSettled([mssql.closeDatabaseConnection(), firebird.closeFirebirdConnection()]);
  }
}

async function countSnapshots(pool: {
  request(): { query(source: string): Promise<{ recordset: Array<{ Total: number }> }> };
}): Promise<number> {
  const result = await pool.request().query(`
    SELECT COUNT(*) AS Total
    FROM liquidacion.QnaSnapshot
    WHERE EntidadId = ${scope.entidadId}
      AND Anio = ${scope.anio}
      AND Quincena = ${scope.quincena}
      AND Organica0 = '${scope.organica0}'
      AND Organica1 = '${scope.organica1}'
      AND Organica2 = '${scope.organica2}'
      AND Organica3 = '${scope.organica3}'`);
  return Number(result.recordset[0]?.Total ?? 0);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
