import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  FORMULA_PARAMETRO_CLAVES,
  FORMULA_PRECISION_POLICY,
  type FormulaCalculoParametros
} from '../src/modules/aportacionesFondos/domain/entities/FormulaCalculo.js';
import { AportacionesMonetaryKernel } from '../src/modules/aportacionesFondos/domain/services/AportacionesMonetaryKernel.js';

interface GoldenCase {
  caseId: string;
  origin: string;
  diasLaborados: string;
  sueldoMensualFirebird?: string;
  otrasPrestacionesFirebird?: string;
  baseCotizacionQuinqueniosTxt?: string;
}

interface GoldenFixture {
  schemaVersion: number;
  source: { anio: number; quincena: number; readOnly: boolean };
  formula: {
    precisionPolicy: string;
    parameters: Record<string, { value: string }>;
  };
  cases: GoldenCase[];
}

async function main(): Promise<void> {
  const fixtureUrl = new URL('./fixtures/aportaciones/periodo-1126.golden.json', import.meta.url);
  const fixture = JSON.parse(await readFile(fixtureUrl, 'utf8')) as GoldenFixture;
  assert.equal(fixture.schemaVersion, 1);
  assert.deepEqual([fixture.source.anio, fixture.source.quincena, fixture.source.readOnly], [2026, 11, true]);
  assert.equal(fixture.formula.precisionPolicy, FORMULA_PRECISION_POLICY);
  assert.equal(Object.keys(fixture.formula.parameters).length, 15);

  const parameters = Object.fromEntries(FORMULA_PARAMETRO_CLAVES.map((key) => {
    const parameter = fixture.formula.parameters[key];
    assert.ok(parameter, `Falta parámetro ${key}`);
    return [key, parameter.value];
  })) as FormulaCalculoParametros;

  const kernel = new AportacionesMonetaryKernel();
  assert.equal(kernel.truncarA2('123.459999'), '123.45');
  assert.equal(kernel.truncarA2('-123.459999'), '-123.45');
  assert.equal(kernel.truncarA2('-0.009999'), '0.00');
  assert.equal(kernel.truncarD6('1.123456789'), '1.123456');
  assert.equal(kernel.agregarA2(['1.239999', '1.239999']), '2.47');
  assert.equal(kernel.agregarA2(['-1.239999', '-1.239999']), '-2.47');

  const partial = fixture.cases.find((item) => item.caseId === 'PARTIAL_001');
  assert.ok(partial?.sueldoMensualFirebird);
  const partialResult = kernel.calcularProporcionales({
    diasLaborados: partial.diasLaborados,
    sueldoMensual: partial.sueldoMensualFirebird,
    otrasPrestacionesMensuales: partial.otrasPrestacionesFirebird ?? '0',
    baseCotizacionQuinquenios: partial.baseCotizacionQuinqueniosTxt ?? '0',
    parametros: parameters
  });
  assert.deepEqual(partialResult, {
    sueldoProporcionalD6: '4688.044000',
    otrasPrestacionesProporcionalD6: '0.000000',
    baseCotizacionQuinqueniosD6: '0.000000',
    cairD6: '93.760880',
    fraD6: '210.961980',
    freD6: '1043.089790',
    fhD6: '16.408154',
    fvD6: '65.632616',
    faaD6: '234.402200',
    faeD6: '117.201100',
    fatD6: '351.603300'
  });

  const missingPayroll = fixture.cases.find((item) => item.origin === 'NOMINA_SIN_COINCIDENCIA');
  assert.ok(missingPayroll?.sueldoMensualFirebird);
  const zeroResult = kernel.calcularProporcionales({
    diasLaborados: '0',
    sueldoMensual: missingPayroll.sueldoMensualFirebird,
    otrasPrestacionesMensuales: missingPayroll.otrasPrestacionesFirebird ?? '0',
    baseCotizacionQuinquenios: '0',
    parametros: parameters
  });
  assert.ok(Object.values(zeroResult).every((value) => value === '0.000000'));

  assert.throws(() => kernel.calcularProporcionales({
    diasLaborados: '15.01',
    sueldoMensual: '10000',
    otrasPrestacionesMensuales: '0',
    baseCotizacionQuinquenios: '0',
    parametros: parameters
  }), /DIAS_LABORADOS_FUERA_RANGO/);

  console.log('APORTACIONES_PHASE1_TESTS_OK');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
