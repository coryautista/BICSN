import assert from 'node:assert/strict';
import { DATABASE_ENVIRONMENTS, assertDatabaseEnvironment } from '../src/config/databaseEnvironments.js';

const QUALITY = DATABASE_ENVIRONMENTS.CALIDAD;
process.env.SQLSERVER_DB = QUALITY.sqlDatabase;
process.env.FIREBIRD_DATABASE = QUALITY.firebirdDatabase;
assertDatabaseEnvironment('CALIDAD', process.env.SQLSERVER_DB, process.env.FIREBIRD_DATABASE);

async function main(): Promise<void> {
  const [{ connectDatabase, closeDatabaseConnection }, { SnapshotCalculoV2Repository }, { GetSnapshotCalculoV2Query }] = await Promise.all([
    import('../src/db/mssql.js'),
    import('../src/modules/aportacionesFondos/infrastructure/persistence/SnapshotCalculoV2Repository.js'),
    import('../src/modules/aportacionesFondos/application/queries/GetSnapshotCalculoV2Query.js')
  ]);
  const pool = await connectDatabase();
  try {
    const query = new GetSnapshotCalculoV2Query(new SnapshotCalculoV2Repository(pool));
    const filtro = {
      entidadId: 1, anio: 2026, quincena: 14,
      organica0: '04', organica1: '24', organica2: '01', organica3: '01',
      fuente: 'HISTORICO_SQL' as const, incluirDetalles: false
    };
    const result = await query.execute(filtro);
    assert.ok(result, 'SNAPSHOT_V2_1426_NO_ENCONTRADO');
    assert.equal(result.snapshot.snapshotId, '1');
    assert.equal(result.snapshot.registros, 169);
    assert.equal(result.snapshot.detalles, undefined);
    assert.equal(result.snapshot.totalesA2.FAT, '103261.12');
    assert.equal(result.revisa?.FAT, '103212.74');
    assert.equal(result.historico.FAT, '103261.12');
    assert.equal(result.comparacion.FAT.diferenciaRevisa, '48.38');
    assert.equal(result.comparacion.FAT.diferenciaHistorico, '0.00');
    assert.equal(result.comparacion.FAI.diferenciaHistorico, null);
    assert.deepEqual(result.linea, { estatus: 'VIGENTE', importe: '736168.13' });

    const withDetails = await query.execute({ ...filtro, incluirDetalles: true });
    assert.equal(withDetails?.snapshot.detalles?.length, 169);
    for (const detail of withDetails?.snapshot.detalles ?? []) {
      assert.equal('rfc' in detail, false);
      assert.equal('nombre' in detail, false);
      assert.match(detail.empleadoClaveHash, /^[0-9A-F]{64}$/);
    }
    assert.equal(await query.execute({ ...filtro, revision: 999 }), null);

    console.log(JSON.stringify({
      snapshotId: result.snapshot.snapshotId,
      revision: result.snapshot.revision,
      registros: result.snapshot.registros,
      detallesAnonimizados: withDetails?.snapshot.detalles?.length,
      comparacion: result.comparacion,
      linea: result.linea
    }, null, 2));
    console.log('APORTACIONES_PHASE5_READ_1426_OK');
  } finally {
    await closeDatabaseConnection();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
