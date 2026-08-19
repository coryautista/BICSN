import assert from 'node:assert/strict';
import { d2ToD6, sumD6ToA2 } from '../src/modules/aportacionesFondos/domain/entities/PrestamoMoney.js';
import { decimalSourceToD6 } from '../src/modules/aportacionesFondos/domain/entities/Money.js';

assert.equal(d2ToD6('125.40'), '125.400000');
assert.equal(d2ToD6('-00012.3'), '-12.300000');
assert.equal(d2ToD6('0'), '0.000000');
assert.equal(d2ToD6('-0.00'), '0.000000');
assert.equal(d2ToD6(null), null);
assert.notEqual(d2ToD6('0.00'), null);
assert.throws(() => d2ToD6('1.234'), /D2_INVALIDO/);
assert.throws(() => d2ToD6('1e2'), /D2_INVALIDO/);

assert.equal(sumD6ToA2(['1.230000', '2.340000', null]), '3.57');
assert.equal(sumD6ToA2(['1.999999', '1.999999']), '3.99');
assert.equal(sumD6ToA2(['-1.239999']), '-1.23');
assert.equal(sumD6ToA2([]), '0.00');

assert.equal(decimalSourceToD6('001.2345'), '1.234500');
assert.equal(decimalSourceToD6('-0.000000'), '0.000000');
assert.equal(decimalSourceToD6(0), '0.000000');
assert.throws(() => decimalSourceToD6('1.2345678'), /MONEY_SOURCE_INVALIDO/);

console.log('Prestamos D2/D6/A2 contract tests passed');
