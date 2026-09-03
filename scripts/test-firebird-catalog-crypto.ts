import assert from 'node:assert/strict';
import { decryptSecret, encryptSecret } from '../src/shared/crypto/symmetric.js';

const key = '01'.repeat(32);
const plain = 'credencial-firebird-de-prueba';
const encrypted = encryptSecret(plain, key);

assert.notEqual(encrypted, plain);
assert.equal(decryptSecret(encrypted, key), plain);
const tampered = `${encrypted.slice(0, -2)}${encrypted.endsWith('00') ? '01' : '00'}`;
assert.throws(() => decryptSecret(tampered, key));
assert.throws(() => encryptSecret(plain, 'invalid'), /FIREBIRD_CATALOG_MASTER_KEY_INVALIDA/);

console.log('FIREBIRD_CATALOG_CRYPTO_OK');
