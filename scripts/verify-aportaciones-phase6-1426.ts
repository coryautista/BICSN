import assert from 'node:assert/strict';
import { DATABASE_ENVIRONMENTS, assertDatabaseEnvironment } from '../src/config/databaseEnvironments.js';

const QUALITY = DATABASE_ENVIRONMENTS.CALIDAD;
process.env.SQLSERVER_DB = QUALITY.sqlDatabase;
process.env.FIREBIRD_DATABASE = QUALITY.firebirdDatabase;
assertDatabaseEnvironment('CALIDAD', process.env.SQLSERVER_DB, process.env.FIREBIRD_DATABASE);

async function main(): Promise<void> {
  const [{ connectDatabase, closeDatabaseConnection }, { SnapshotCalculoV2Repository }, { ListSnapshotCalculoV2Query }] = await Promise.all([
    import('../src/db/mssql.js'),
    import('../src/modules/aportacionesFondos/infrastructure/persistence/SnapshotCalculoV2Repository.js'),
    import('../src/modules/aportacionesFondos/application/queries/ListSnapshotCalculoV2Query.js')
  ]);
  const pool = await connectDatabase();
  try {
    const repository = new SnapshotCalculoV2Repository(pool);
    const query = new ListSnapshotCalculoV2Query(repository);
    const result = await query.execute({
      pagina: 1, tamanio: 20, entidadId: 1, anio: 2026, quincena: 14,
      organica0: '04', organica1: '24', fuente: 'HISTORICO_SQL', estado: 'COMPLETO'
    });
    assert.equal(result.paginacion.total, 1);
    assert.equal(result.datos.length, 1);
    const item = result.datos[0];
    assert.equal(item.snapshot.snapshotId, '1');
    assert.equal(item.veredicto.politicaVersion, 'MXN-A2-DIFF-0.20-v1');
    assert.equal(item.veredicto.general, 'APROBADO');
    assert.equal(item.veredicto.fondos.FAT.revisa, 'DIFERENCIA_ESPERADA_PRECISION');
    assert.equal(item.veredicto.fondos.FAT.historico, 'COINCIDE');
    assert.equal(item.veredicto.fondos.FAI.historico, 'SIN_BASELINE');
    assert.equal(item.ultimaDecision, null);
    assert.equal(await repository.guardarDecision({
      snapshotId: '999999999', decision: 'OBSERVADO', comentario: 'probe-no-insert',
      usuarioId: '00000000-0000-0000-0000-000000000000'
    }), null);
    console.log(JSON.stringify({
      total: result.paginacion.total,
      snapshotId: item.snapshot.snapshotId,
      veredicto: item.veredicto,
      ultimaDecision: item.ultimaDecision
    }, null, 2));
    console.log('APORTACIONES_PHASE6_1426_OK');
  } finally {
    await closeDatabaseConnection();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
