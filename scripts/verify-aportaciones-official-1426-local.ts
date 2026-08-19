import assert from 'node:assert/strict';
import { connectDatabase, closeDatabaseConnection, sql } from '../src/db/mssql.js';
import { FormulaCalculoRepository } from '../src/modules/aportacionesFondos/infrastructure/persistence/FormulaCalculoRepository.js';
import { AportacionFondoCalculator } from '../src/modules/aportacionesFondos/domain/services/AportacionFondoCalculator.js';
import { AportacionesMonetaryKernel } from '../src/modules/aportacionesFondos/domain/services/AportacionesMonetaryKernel.js';
import { AportacionFondoRepository } from '../src/modules/aportacionesFondos/infrastructure/persistence/AportacionFondoRepository.js';

const GOLDEN = {
  ahorro: { afae: '34404.08', afaa: '68808.66', total: '103212.84' },
  vivienda: { afe: '24082.78', total: '24083.00' },
  prestaciones: { afpe: '318009.81', afpa: '61927.58', total: '379937.59' },
  cair: { afe: '27523.57', total: '27523.42' },
  totalAportaciones: '534756.85'
} as const;

const HISTORICO_PERSISTIDO = {
  ahorro: { afae: '34420.17', afaa: '68840.85', total: '103261.12' },
  vivienda: { afe: '24094.05', total: '24094.26' },
  prestaciones: { afpe: '318153.06', afpa: '61956.55', total: '380109.80' },
  cair: { afe: '27536.45', total: '27536.30' }
} as const;

async function main(): Promise<void> {
  const pool = await connectDatabase();
  try {
    const rows = await pool.request()
      .input('Org0', sql.Char(2), '04')
      .input('Org1', sql.Char(2), '24')
      .input('Anio', sql.Int, 2026)
      .input('Quincena', sql.Int, 14)
      .query(`
        SELECT interno, nombre, sueldo, COALESCE(otras_prestaciones, 0) AS otras_prestaciones,
          COALESCE(quinquenios, 0) AS quinquenios
        FROM aportaciones.IndividualesPrestacionesHistorico
        WHERE clave_organica_0=@Org0 AND clave_organica_1=@Org1
          AND anio=@Anio AND quincena=@Quincena
        ORDER BY interno
      `);
    assert.equal(rows.recordset.length, 169, 'La población histórica 1426 debe contener 169 afiliados');

    const formula = await new FormulaCalculoRepository(pool).obtenerPorPeriodo(2026, 14);
    const calculator = new AportacionFondoCalculator();
    const kernel = new AportacionesMonetaryKernel();
    const fondos = rows.recordset.map((row) => {
      const input = {
        interno: Number(row.interno),
        nombre: row.nombre == null ? null : String(row.nombre),
        sueldoMensual: String(row.sueldo ?? 0),
        otrasPrestacionesMensuales: String(row.otras_prestaciones ?? 0),
        quinqueniosMensual: String(row.quinquenios ?? 0),
        diasLaborados: Number(row.interno) === 85427 ? 13 : 15,
        diasOrigen: 'default' as const,
        baseCotizacionSueldo: null,
        baseCotizacionQuinquenios: null
      };
      return {
        ahorro: calculator.calcular('ahorro', input, formula),
        vivienda: calculator.calcular('vivienda', input, formula),
        prestaciones: calculator.calcular('prestaciones', input, formula),
        cair: calculator.calcular('cair', input, formula)
      };
    });
    const component = (values: string[]) => kernel.agregarComponenteA2(values);
    const fund = (values: string[]) => kernel.agregarA2(values);
    const actual = {
      ahorro: {
        afae: component(fondos.map(({ ahorro }) => ahorro.afae_d6!)),
        afaa: component(fondos.map(({ ahorro }) => ahorro.afaa_d6!)),
        total: fund(fondos.map(({ ahorro }) => ahorro.total_d6))
      },
      vivienda: {
        afe: component(fondos.map(({ vivienda }) => vivienda.afe_d6!)),
        total: fund(fondos.map(({ vivienda }) => vivienda.total_d6))
      },
      prestaciones: {
        afpe: component(fondos.map(({ prestaciones }) => prestaciones.afpe_d6!)),
        afpa: component(fondos.map(({ prestaciones }) => prestaciones.afpa_d6!)),
        total: fund(fondos.map(({ prestaciones }) => prestaciones.total_d6))
      },
      cair: {
        afe: component(fondos.map(({ cair }) => cair.afe_d6!)),
        total: fund(fondos.map(({ cair }) => cair.total_d6))
      }
    };
    const totalAportaciones = kernel.sumarA2([
      actual.ahorro.total,
      actual.vivienda.total,
      actual.prestaciones.total,
      actual.cair.total
    ]);
    assert.deepEqual({ ...actual, totalAportaciones }, GOLDEN);

    const repository = new AportacionFondoRepository(new FormulaCalculoRepository(pool));
    const [ahorroHistorico, viviendaHistorico, prestacionesHistorico, cairHistorico] = await Promise.all([
      repository.obtenerAportacionesIndividuales('ahorro', '04', '24', true, '1426'),
      repository.obtenerAportacionesIndividuales('vivienda', '04', '24', true, '1426'),
      repository.obtenerAportacionesIndividuales('prestaciones', '04', '24', true, '1426'),
      repository.obtenerAportacionesIndividuales('cair', '04', '24', true, '1426')
    ]);
    const historicos = [ahorroHistorico, viviendaHistorico, prestacionesHistorico, cairHistorico];
    assert.ok(historicos.every((fondo) => fondo.fuente_datos === 'HISTORICO_SQL'));
    assert.ok(historicos.every((fondo) => fondo.precision_policy === 'MXN-DETAIL6-AGG2-TRUNC-v1'));
    assert.ok(historicos.every((fondo) => fondo.formula_version_id === '1'));
    assert.ok(historicos.every((fondo) => fondo.datos.length === 169));
    assert.ok(historicos.every((fondo) => fondo.datos.every((row) => row.dias_laborados_origen === 'historico_snapshot')));
    assert.equal(ahorroHistorico.datos.find((row) => row.interno === 85427)?.dias_laborados, 13);
    assert.deepEqual(ahorroHistorico.resumen.componentes_a2, {
      afae: HISTORICO_PERSISTIDO.ahorro.afae,
      afaa: HISTORICO_PERSISTIDO.ahorro.afaa
    });
    assert.equal(ahorroHistorico.resumen.total_contribucion_a2, HISTORICO_PERSISTIDO.ahorro.total);
    assert.deepEqual(viviendaHistorico.resumen.componentes_a2, { afe: HISTORICO_PERSISTIDO.vivienda.afe });
    assert.equal(viviendaHistorico.resumen.total_contribucion_a2, HISTORICO_PERSISTIDO.vivienda.total);
    assert.deepEqual(prestacionesHistorico.resumen.componentes_a2, {
      afpe: HISTORICO_PERSISTIDO.prestaciones.afpe,
      afpa: HISTORICO_PERSISTIDO.prestaciones.afpa
    });
    assert.equal(prestacionesHistorico.resumen.total_contribucion_a2, HISTORICO_PERSISTIDO.prestaciones.total);
    assert.deepEqual(cairHistorico.resumen.componentes_a2, { afe: HISTORICO_PERSISTIDO.cair.afe });
    assert.equal(cairHistorico.resumen.total_contribucion_a2, HISTORICO_PERSISTIDO.cair.total);
    console.log(JSON.stringify({ poblacion: fondos.length, ...actual, totalAportaciones }, null, 2));
    console.log('APORTACIONES_OFFICIAL_1426_LOCAL_OK');
  } finally {
    await closeDatabaseConnection();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
