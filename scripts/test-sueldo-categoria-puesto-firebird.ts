import assert from 'node:assert/strict';
import { resolverSueldoFirebirdCategoriaPuesto } from '../src/modules/afiliado/domain/services/SueldoCategoriaPuestoPolicy.js';

assert.equal(resolverSueldoFirebirdCategoriaPuesto('AL', 20_000, 80), 16_000);
assert.equal(resolverSueldoFirebirdCategoriaPuesto('CS', 20_000, 100), 20_000);
assert.equal(resolverSueldoFirebirdCategoriaPuesto('AL', 12_345.67, 82.5), 10_185.18);

for (const codigo of ['BA', 'LI', 'LT', 'LB']) {
  assert.equal(resolverSueldoFirebirdCategoriaPuesto(codigo, 20_000, 80), 20_000);
}

assert.throws(
  () => resolverSueldoFirebirdCategoriaPuesto('AL', 20_000, 0),
  /PORCENTAJE_CATEGORIA_PUESTO_INVALIDO/,
);
assert.throws(
  () => resolverSueldoFirebirdCategoriaPuesto('CS', 20_000, 101),
  /PORCENTAJE_CATEGORIA_PUESTO_INVALIDO/,
);

console.log('Contrato SUELDO/PORC para DP_EDITA_ENTIDAD verificado.');
