import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const FORMAT_VERSION = 1;
const IV_BYTES = 12;
const TAG_BYTES = 16;

function keyFrom(masterKey: string): Buffer {
  if (!/^[0-9a-fA-F]{64}$/.test(masterKey)) {
    throw new Error('FIREBIRD_CATALOG_MASTER_KEY_INVALIDA: se requiere hex de 32 bytes (64 caracteres)');
  }
  return Buffer.from(masterKey, 'hex');
}

export function encryptSecret(plain: string, masterKey: string): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv('aes-256-gcm', keyFrom(masterKey), iv);
  const ciphertext = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([Buffer.from([FORMAT_VERSION]), iv, tag, ciphertext]).toString('hex').toUpperCase();
}

export function decryptSecret(payload: string, masterKey: string): string {
  const raw = Buffer.from(payload, 'hex');
  if (raw.length < 1 + IV_BYTES + TAG_BYTES || raw[0] !== FORMAT_VERSION) {
    throw new Error('FIREBIRD_CATALOG_SECRETO_INVALIDO');
  }
  const iv = raw.subarray(1, 1 + IV_BYTES);
  const tag = raw.subarray(1 + IV_BYTES, 1 + IV_BYTES + TAG_BYTES);
  const ciphertext = raw.subarray(1 + IV_BYTES + TAG_BYTES);
  const decipher = createDecipheriv('aes-256-gcm', keyFrom(masterKey), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}
