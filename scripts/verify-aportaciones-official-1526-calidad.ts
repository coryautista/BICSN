import assert from 'node:assert/strict';
import { DATABASE_ENVIRONMENTS, assertDatabaseEnvironment } from '../src/config/databaseEnvironments.js';

const QUALITY = DATABASE_ENVIRONMENTS.CALIDAD;
const PERIODO = '1526';
const ORG0 = '04';
const ORG1 = '24';

process.env.SQLSERVER_DB = QUALITY.sqlDatabase;
process.env.FIREBIRD_DATABASE = QUALITY.firebirdDatabase;
process.env.FIREBIRD_READ_ONLY = 'true';
assertDatabaseEnvironment('CALIDAD', process.env.SQLSERVER_DB, process.env.FIREBIRD_DATABASE);

async function main(): Promise<void> {
  const [{ connectDatabase, closeDatabaseConnection }, { closeFirebirdConnection }, formulaModule, aportacionModule, kernelModule] = await Promise.all([
    import('../src/db/mssql.js'),
    import('../src/db/firebird.js'),
    import('../src/modules/aportacionesFondos/infrastructure/persistence/FormulaCalculoRepository.js'),
    import('../src/modules/aportacionesFondos/infrastructure/persistence/AportacionFondoRepository.js'),
    import('../src/modules/aportacionesFondos/domain/services/AportacionesMonetaryKernel.js')
  ]);
  const pool = await connectDatabase();
  try {
    const formulaRepository = new formulaModule.FormulaCalculoRepository(pool);
    const repository = new aportacionModule.AportacionFondoRepository(formulaRepository);
    const result = await repository.obtenerAportacionesIndividuales('ahorro', ORG0, ORG1, true, PERIODO);
    assert.equal(result.precision_policy, 'MXN-BASE2-LEAF2-FUND2-APSFONDOS-v3');
    assert.equal(result.fuente_datos, 'CALCULO_VIVO');
    assert.match(result.formula_version_id, /^\d+$/);
    assert.ok(result.datos.length > 0);
    assert.ok(result.datos.every((row) => /^-?(0|[1-9]\d*)\.\d{6}$/.test(row.total_d6)));
    assert.ok(result.datos.every((row) => row.dias_laborados_origen === 'nomina'), '1526 debe usar exclusivamente días del TXT vigente');
    const kernel = new kernelModule.AportacionesMonetaryKernel();
    assert.equal(
      result.resumen.total_contribucion_a2,
      kernel.agregarA2(result.datos.map((row) => row.total_d6))
    );
    assert.deepEqual(result.resumen.componentes_a2, { afae: '33920.82', afaa: '67842.16' });
    assert.equal(result.resumen.total_contribucion_a2, '101762.98');
    console.log(JSON.stringify({
      environment: 'CALIDAD',
      periodo: PERIODO,
      organica: `${ORG0}-${ORG1}`,
      registros: result.datos.length,
      origenesDias: [...new Set(result.datos.map((row) => row.dias_laborados_origen))].sort(),
      precisionPolicy: result.precision_policy,
      formulaVersionId: result.formula_version_id,
      totalAhorroA2: result.resumen.total_contribucion_a2,
      readOnly: true
    }, null, 2));
  } finally {
    await closeDatabaseConnection();
    await closeFirebirdConnection();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
