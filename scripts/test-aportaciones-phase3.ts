import assert from 'node:assert/strict';
import { NominaDiasLaboradosResolver } from '../src/modules/aportacionesFondos/domain/services/NominaDiasLaboradosResolver.js';

const resolver = new NominaDiasLaboradosResolver();
const sinArchivo = { tieneArchivo: false, registros: new Map() };
const conArchivo = {
  tieneArchivo: true,
  registros: new Map([
    ['RFCVALIDO010', { dias: 10, baseCotizacionQuinquenios: 125.25 }],
    ['RFCCERO00000', { dias: 0, baseCotizacionQuinquenios: 0 }],
    ['RFCNULO00000', { dias: null, baseCotizacionQuinquenios: 80 }]
  ])
};

assert.deepEqual(resolver.resolve('RFCVALIDO010', conArchivo, false), {
  dias: 15,
  origen: 'default',
  baseCotizacionQuinquenios: null
});
assert.deepEqual(resolver.resolve('RFCVALIDO010', sinArchivo, true), {
  dias: 15,
  origen: 'default',
  baseCotizacionQuinquenios: null
});
assert.deepEqual(resolver.resolve(' rfcvalido010 ', conArchivo, true), {
  dias: 10,
  origen: 'nomina',
  baseCotizacionQuinquenios: 125.25
});
assert.deepEqual(resolver.resolve('RFCCERO00000', conArchivo, true), {
  dias: 0,
  origen: 'nomina',
  baseCotizacionQuinquenios: 0
});
assert.deepEqual(resolver.resolve('RFCNULO00000', conArchivo, true), {
  dias: 0,
  origen: 'nomina',
  baseCotizacionQuinquenios: 80
});
assert.deepEqual(resolver.resolve('RFCFALTANTE0', conArchivo, true), {
  dias: 0,
  origen: 'nomina_sin_coincidencia',
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
