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
  const [mssql, firebird, formulaModule, aportacionModule, moneyModule] = await Promise.all([
    import('../src/db/mssql.js'),
    import('../src/db/firebird.js'),
    import('../src/modules/aportacionesFondos/infrastructure/persistence/FormulaCalculoRepository.js'),
    import('../src/modules/aportacionesFondos/infrastructure/persistence/AportacionFondoRepository.js'),
    import('../src/modules/aportacionesFondos/domain/entities/PrestamoMoney.js'),
  ]);
  const pool = await mssql.connectDatabase();
  try {
    const database = await pool.request().query('SELECT DB_NAME() AS BaseDatos');
    assert.equal(database.recordset[0]?.BaseDatos, QUALITY.sqlDatabase);
    const snapshotCountBefore = await countSnapshots(pool);
    const repository = new aportacionModule.AportacionFondoRepository(new formulaModule.FormulaCalculoRepository(pool));

    const ahorro = await repository.obtenerAportacionesIndividuales('ahorro', ORG0, ORG1, true, PERIODO);
    const vivienda = await repository.obtenerAportacionesIndividuales('vivienda', ORG0, ORG1, true, PERIODO);
    const prestaciones = await repository.obtenerAportacionesIndividuales('prestaciones', ORG0, ORG1, true, PERIODO);
    const cair = await repository.obtenerAportacionesIndividuales('cair', ORG0, ORG1, true, PERIODO);
    for (const result of [ahorro, vivienda, prestaciones, cair]) {
      assert.equal(result.precision_policy, 'MXN-BASE2-LEAF2-FUND2-APSFONDOS-v3');
      assert.equal(result.datos.length, ahorro.datos.length);
      assert.ok(result.datos.every((row) => row.dias_laborados_origen === 'nomina'));
      assert.ok(result.datos.every((row) => /^-?(0|[1-9]\d*)\.\d{6}$/.test(row.total_d6)));
    }

    const guarderias = await repository.obtenerAportacionGuarderias(ORG0, ORG1, PERIODO);
    const transitorio = await repository.obtenerPensionNominaTransitorio('04', '60', ORG0, ORG1, PERIODO);
    const aguinaldo = await repository.obtenerAguinaldo(ORG0, ORG1, PERIODO);
    const pcp = await repository.obtenerPrestamos(ORG0, ORG1, PERIODO);
    const pmp = await repository.obtenerPrestamosMedianoPlazo(ORG0, ORG1, PERIODO);
    const hip = await repository.obtenerPrestamosHipotecarios(ORG0, ORG1, PERIODO, false);
    const sum = (values: Array<string | null>) => moneyModule.sumD6ToA2(values);
    const totals = {
      ahorroA2: ahorro.resumen.total_contribucion_a2,
      viviendaA2: vivienda.resumen.total_contribucion_a2,
      prestacionesA2: prestaciones.resumen.total_contribucion_a2,
      cairA2: cair.resumen.total_contribucion_a2,
      guarderiasA2: sum(guarderias.map((row) => row.recibo_total_d6)),
      transitorioA2: sum(transitorio.map((row) => row.total_d6)),
      aguinaldoA2: sum(aguinaldo.map((row) => row.general_d6)),
      pcpA2: sum(pcp.map((row) => row.total_d6)),
      pmpA2: sum(pmp.map((row) => row.total_d6)),
      hipA2: sum(hip.map((row) => row.cantidad_d6)),
    };
    const totalAportacionesA2 = addA2(totals.ahorroA2, totals.viviendaA2, totals.prestacionesA2, totals.cairA2, totals.guarderiasA2, totals.transitorioA2, totals.aguinaldoA2);
    const totalRetencionesA2 = addA2(totals.pcpA2, totals.pmpA2, totals.hipA2);
    const totalGeneralA2 = addA2(totalAportacionesA2, totalRetencionesA2);
    const snapshotCountAfter = await countSnapshots(pool);
    assert.equal(snapshotCountAfter, snapshotCountBefore, 'La prueba read-only no debe crear snapshots');

    console.log(JSON.stringify({
      environment: 'CALIDAD', sqlDatabase: QUALITY.sqlDatabase, firebirdDatabase: QUALITY.firebirdDatabase,
      periodo: PERIODO, organica: `${ORG0}-${ORG1}-01-01`, readOnly: true,
      snapshotsAntes: snapshotCountBefore, snapshotsDespues: snapshotCountAfter,
      registros: { base: ahorro.datos.length, guarderias: guarderias.length, transitorio: transitorio.length, aguinaldo: aguinaldo.length, pcp: pcp.length, pmp: pmp.length, hip: hip.length },
      totals: { ...totals, totalAportacionesA2, totalRetencionesA2, totalGeneralA2 },
    }, null, 2));
    assert.deepEqual({
      ahorroA2: totals.ahorroA2,
      viviendaA2: totals.viviendaA2,
      prestacionesA2: totals.prestacionesA2,
      cairA2: totals.cairA2,
      totalAportacionesA2,
      totalRetencionesA2,
      totalGeneralA2,
    }, {
      ahorroA2: '101762.98',
      viviendaA2: '23744.62',
      prestacionesA2: '374766.45',
      cairA2: '27136.95',
      totalAportacionesA2: '527411.00',
      totalRetencionesA2: '170055.38',
      totalGeneralA2: '697466.38',
    }, 'Los datos crudos Firebird de 1526 difieren del corte oficial conciliado');
    console.log('LIQUIDACION_QNA_1526_READONLY_OK');
  } finally {
    await Promise.allSettled([mssql.closeDatabaseConnection(), firebird.closeFirebirdConnection()]);
  }
}

async function countSnapshots(pool: { request(): { query(source: string): Promise<{ recordset: Array<{ Total: number }> }> } }): Promise<number> {
  const result = await pool.request().query(`
    SELECT COUNT(*) AS Total FROM liquidacion.QnaSnapshot
    WHERE Anio=2026 AND Quincena=15 AND Organica0='04' AND Organica1='24' AND Organica2='01' AND Organica3='01'`);
  return Number(result.recordset[0]?.Total ?? 0);
}

function addA2(...values: string[]): string {
  const cents = values.reduce((sum, value) => {
    assert.match(value, /^-?(0|[1-9]\d*)\.\d{2}$/);
    const negative = value.startsWith('-');
    const [whole, fraction] = (negative ? value.slice(1) : value).split('.');
    const amount = BigInt(whole) * 100n + BigInt(fraction);
    return sum + (negative ? -amount : amount);
  }, 0n);
  const negative = cents < 0n;
  const absolute = negative ? -cents : cents;
  return `${negative ? '-' : ''}${absolute / 100n}.${String(absolute % 100n).padStart(2, '0')}`;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
