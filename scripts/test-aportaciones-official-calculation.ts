import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  FORMULA_PARAMETRO_CLAVES,
  FORMULA_PRECISION_POLICY,
  type FormulaCalculo,
  type FormulaCalculoParametros
} from '../src/modules/aportacionesFondos/domain/entities/FormulaCalculo.js';
import { isMoneyA2, isMoneyD6 } from '../src/modules/aportacionesFondos/domain/entities/Money.js';
import { AportacionFondoCalculator } from '../src/modules/aportacionesFondos/domain/services/AportacionFondoCalculator.js';
import { AportacionesMonetaryKernel } from '../src/modules/aportacionesFondos/domain/services/AportacionesMonetaryKernel.js';
import {
  AhorroDetalleSchema,
  AhorroHeaderSchema
} from '../src/modules/aplicacionQuincenal/aplicacionQuincenal.schemas.js';

type Fixture = {
  formula: { parameters: Record<string, { value: string }> };
  cases: Array<{
    caseId: string;
    diasLaborados: string;
    sueldoMensualFirebird?: string;
    otrasPrestacionesFirebird?: string;
    baseCotizacionSueldoTxt?: string;
    baseCotizacionQuinqueniosTxt?: string;
  }>;
};

async function main(): Promise<void> {
  const fixtureUrl = new URL('./fixtures/aportaciones/periodo-1126.golden.json', import.meta.url);
  const fixture = JSON.parse(await readFile(fixtureUrl, 'utf8')) as Fixture;
  const parametros = Object.fromEntries(FORMULA_PARAMETRO_CLAVES.map((key) => [
    key,
    fixture.formula.parameters[key].value
  ])) as FormulaCalculoParametros;
  parametros.FRE_OTRAS = '0.267500000';
  parametros.FH_SUELDO = '0.003500000';
  parametros.FV_SUELDO = '0.014000000';
  const formula: FormulaCalculo = {
    formulaCalculoVersionId: '1',
    claveFormula: 'APORTACIONES-NOMINA',
    anioVigencia: 2026,
    numeroVersion: 1,
    quincenaDesde: 1,
    quincenaHasta: 24,
    precisionPolicy: FORMULA_PRECISION_POLICY,
    estado: 'ACTIVA',
    parametros,
    detalleParametros: []
  };
  const source = fixture.cases.find((item) => item.caseId === 'PARTIAL_001');
  assert.ok(source?.sueldoMensualFirebird);
  const input = {
    interno: 1,
    nombre: 'PRUEBA',
    sueldoMensual: source.sueldoMensualFirebird,
    otrasPrestacionesMensuales: source.otrasPrestacionesFirebird ?? '0',
    quinqueniosMensual: '0',
    diasLaborados: Number(source.diasLaborados),
    diasOrigen: 'nomina' as const,
    baseCotizacionSueldo: source.baseCotizacionSueldoTxt ?? null,
    baseCotizacionQuinquenios: source.baseCotizacionQuinqueniosTxt ?? '0'
  };
  const calculator = new AportacionFondoCalculator();
  const ahorro = calculator.calcular('ahorro', input, formula);
  const vivienda = calculator.calcular('vivienda', input, formula);
  const prestaciones = calculator.calcular('prestaciones', input, formula);
  const cair = calculator.calcular('cair', input, formula);

  assert.deepEqual(
    [ahorro.afae_d6, ahorro.afaa_d6, ahorro.total_d6],
    ['117.200000', '234.400000', '351.600000']
  );
  assert.deepEqual(
    [vivienda.fh_d6, vivienda.fv_d6, vivienda.afe_d6, vivienda.total_d6],
    ['16.410000', '65.630000', '82.040000', '82.040000']
  );
  assert.deepEqual(
    [prestaciones.afpe_d6, prestaciones.afpa_d6, prestaciones.total_d6],
    ['1043.090000', '210.960000', '1254.050000']
  );
  assert.deepEqual([cair.afe_d6, cair.total_d6], ['93.760000', '93.760000']);
  assert.equal(prestaciones.base_cotizacion_quinquenios_d6, '0.000000');
  assert.equal(prestaciones.quinquenios_aplicado_d6, '0.000000');
  assert.equal(ahorro.total, Number(ahorro.total_d6), 'El number legacy debe ser solo una proyección');
  assert.ok([ahorro, vivienda, prestaciones, cair].every((row) => isMoneyD6(row.total_d6)));

  const kernel = new AportacionesMonetaryKernel();
  const hijos = [
    kernel.agregarA2([ahorro.total_d6]),
    kernel.agregarA2([vivienda.total_d6]),
    kernel.agregarA2([prestaciones.total_d6]),
    kernel.agregarA2([cair.total_d6])
  ];
  const padre = kernel.sumarA2(hijos);
  assert.deepEqual(hijos, ['351.60', '82.04', '1254.05', '93.76']);
  assert.equal(padre, '1781.45');
  assert.ok(isMoneyA2(padre));

  const parcialConQuinquenio = {
    ...input,
    sueldoMensual: '18757.85',
    otrasPrestacionesMensuales: '1000.00',
    quinqueniosMensual: '1814.64',
    diasLaborados: 14,
    diasOrigen: 'default' as const,
    baseCotizacionSueldo: null,
    baseCotizacionQuinquenios: null
  };
  const prestacionesParciales = calculator.calcular('prestaciones', parcialConQuinquenio, formula);
  assert.equal(prestacionesParciales.sueldo_base_d6, '10160.980000');
  assert.equal(prestacionesParciales.quinquenios_aplicado_d6, '907.320000');
  assert.deepEqual(
    [prestacionesParciales.afpe_d6, prestacionesParciales.afpa_d6, prestacionesParciales.total_d6],
    ['2324.150000', '393.910000', '2718.060000']
  );

  const basesTxt1526 = {
    ...input,
    sueldoMensual: '15605.94',
    otrasPrestacionesMensuales: '0',
    quinqueniosMensual: '1814.64',
    diasLaborados: 15,
    baseCotizacionSueldo: '7802.97',
    baseCotizacionQuinquenios: '1209.76'
  };
  const ahorroTxt = calculator.calcular('ahorro', basesTxt1526, formula);
  const viviendaTxt = calculator.calcular('vivienda', basesTxt1526, formula);
  const prestacionesTxt = calculator.calcular('prestaciones', basesTxt1526, formula);
  const cairTxt = calculator.calcular('cair', basesTxt1526, formula);
  assert.deepEqual(
    [ahorroTxt, viviendaTxt, prestacionesTxt, cairTxt].map((row) => row.sueldo_proporcional_d6),
    ['7802.970000', '7802.970000', '7802.970000', '7802.970000']
  );
  assert.equal(prestacionesTxt.base_cotizacion_quinquenios_d6, '1209.760000');
  assert.equal(prestacionesTxt.quinquenios_aplicado_d6, '1209.760000');
  assert.equal(prestacionesTxt.sueldo_base_d6, '9012.730000');
  assert.deepEqual(
    [prestacionesTxt.afpe_d6, prestacionesTxt.afpa_d6, prestacionesTxt.total_d6],
    ['2059.770000', '351.130000', '2410.900000']
  );
  assert.throws(
    () => calculator.calcular('prestaciones', {
      ...basesTxt1526,
      baseCotizacionQuinquenios: null
    }, formula),
    /NOMINA_BASE_COTIZACION_REQUERIDA/
  );

  const golden1526 = {
    ahorro: kernel.sumarA2(['67842.16', '33920.82']),
    vivienda: kernel.sumarA2(['18995.66', '4748.96']),
    prestaciones: kernel.sumarA2(['61057.69', '313708.76']),
    cair: '27136.95'
  };
  assert.deepEqual(golden1526, {
    ahorro: '101762.98',
    vivienda: '23744.62',
    prestaciones: '374766.45',
    cair: '27136.95'
  });
  assert.equal(kernel.sumarA2(Object.values(golden1526)), '527411.00');
  assert.equal(kernel.sumarA2(['527411.00', '170055.38']), '697466.38');

  assert.equal(AhorroHeaderSchema.safeParse({
    clave_organica_0: '04', clave_organica_1: '24', quincena: 15, anio: 2026,
    usuario_id: 'test', total_empleados: 1, total_contribucion: 1, total_sueldo_base: 1
  }).success, false, 'El histórico oficial no debe aceptar encabezados sin A2 exacto');
  assert.equal(AhorroDetalleSchema.safeParse({
    clave_organica_0: '04', clave_organica_1: '24', quincena: 15, anio: 2026,
    interno: 1, nombre: 'TEST', sueldo: 1, quinquenios: 0, otras_prestaciones: 0,
    sueldo_base: 1, afae: 1, afaa: 1, total: 2
  }).success, false, 'El histórico oficial no debe aceptar detalle sin D6 exacto');

  console.log('APORTACIONES_OFFICIAL_CALCULATION_TESTS_OK');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
