import assert from 'node:assert/strict';
import { NominaDiasLaboradosResolver } from '../src/modules/aportacionesFondos/domain/services/NominaDiasLaboradosResolver.js';

const resolver = new NominaDiasLaboradosResolver();
const sinArchivo = { tieneArchivo: false, registros: new Map() };
const conArchivo = {
  tieneArchivo: true,
  registros: new Map([
    ['RFCVALIDO010', { dias: 10, baseCotizacionSueldo: 500, baseCotizacionQuinquenios: 125.25 }],
    ['RFCCERO00000', { dias: 0, baseCotizacionSueldo: 0, baseCotizacionQuinquenios: 0 }],
    ['RFCNULO00000', { dias: null, baseCotizacionSueldo: 0, baseCotizacionQuinquenios: 80 }]
  ])
};

assert.deepEqual(resolver.resolve('RFCVALIDO010', conArchivo, false), {
  dias: 15,
  origen: 'default',
  baseCotizacionSueldo: null,
  baseCotizacionQuinquenios: null
});
assert.deepEqual(resolver.resolve('RFCVALIDO010', sinArchivo, true), {
  dias: 15,
  origen: 'default',
  baseCotizacionSueldo: null,
  baseCotizacionQuinquenios: null
});
assert.deepEqual(resolver.resolve(' rfcvalido010 ', conArchivo, true), {
  dias: 10,
  origen: 'nomina',
  baseCotizacionSueldo: 500,
  baseCotizacionQuinquenios: 125.25
});
assert.deepEqual(resolver.resolve('RFCCERO00000', conArchivo, true), {
  dias: 0,
  origen: 'nomina',
  baseCotizacionSueldo: 0,
  baseCotizacionQuinquenios: 0
});
assert.deepEqual(resolver.resolve('RFCNULO00000', conArchivo, true), {
  dias: 0,
  origen: 'nomina',
  baseCotizacionSueldo: 0,
  baseCotizacionQuinquenios: 80
});
assert.deepEqual(resolver.resolve('RFCFALTANTE0', conArchivo, true), {
  dias: 0,
  origen: 'nomina_sin_coincidencia',
  baseCotizacionSueldo: null,
  baseCotizacionQuinquenios: null
});

for (const dias of [-0.01, 15.01, Number.NaN]) {
  assert.throws(
    () => resolver.resolve('RFCFUERARANGO', {
      tieneArchivo: true,
      registros: new Map([['RFCFUERARANGO', { dias, baseCotizacionQuinquenios: null }]])
    }, true),
    /DiasLaborados fuera de rango/
  );
}

console.log('APORTACIONES_PHASE3_TESTS_OK');
