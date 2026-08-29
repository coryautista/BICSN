import assert from 'node:assert/strict';
import { parseNominaAplicacionQnalTxt } from '../src/modules/nomina/application/NominaAplicacionQnalTxtParser.js';

const detail = (overrides: Record<number, string> = {}) => {
  const fields = [
    '0126007', '2', 'SYN000001', 'SYNX000101T01', 'PERSONA SINTETICA',
    '10.00', '20.00', '30.00', '40.00', '1000.00',
    '', '2000.00', '0.00', '0.00', '20260415',
    '0.00', '50.25', '0.00', '0.00', '0.00'
  ];
  for (const [index, value] of Object.entries(overrides)) fields[Number(index) - 1] = value;
  return fields.join('@');
};

let result = parseNominaAplicacionQnalTxt(Buffer.from(detail(), 'latin1'));
assert.deepEqual(result.errores, []);
assert.equal(result.registros.length, 1);
assert.equal(result.registros[0].layoutVersion, '20');
assert.equal(result.registros[0].cair, 50.25);
assert.equal(result.registros[0].descuentosOtros, null);
assert.equal(result.registros[0].descuentoPrestamoMedianoPlazo, null);
assert.equal(result.registros[0].cairVoluntario, null);

result = parseNominaAplicacionQnalTxt(Buffer.from(`\n\n${detail()}\n`, 'latin1'));
assert.equal(result.registros[0].numeroLinea, 3);

for (const [field, value, expectedField] of [
  [6, 'ABC', 'AportacionAfiliadoFondoAhorro'],
  [6, '1.234', 'AportacionAfiliadoFondoAhorro'],
  [6, '10000000000.00', 'AportacionAfiliadoFondoAhorro'],
  [15, '20260229', 'FechaMovimiento'],
  [15, '15/04/2026', 'FechaMovimiento'],
] as const) {
  result = parseNominaAplicacionQnalTxt(Buffer.from(detail({ [field]: value }), 'latin1'));
  assert(result.errores.some((error) => error.campo === expectedField), `Debe rechazar campo ${field}=${value}`);
}

for (const field of [16, 18, 19, 20]) {
  result = parseNominaAplicacionQnalTxt(Buffer.from(detail({ [field]: '0.01' }), 'latin1'));
  assert(result.errores.some((error) => error.campo === `Campo${field}`), `Debe rechazar campo no certificado ${field}`);
  result = parseNominaAplicacionQnalTxt(Buffer.from(detail({ [field]: '' }), 'latin1'));
  assert(!result.errores.some((error) => error.campo === `Campo${field}`));
}

const layout35 = `${detail()}@${Array(15).fill('0').join('@')}`;
result = parseNominaAplicacionQnalTxt(Buffer.from(layout35, 'latin1'));
assert(result.errores.some((error) => error.campo === 'Layout'));
assert.equal(result.registros.length, 0);

console.log('NOMINA_LAYOUT20_PARSER_OK');
