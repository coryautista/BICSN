import argon2 from 'argon2';
import { randomBytes, createHash } from 'crypto';

export async function hashPassword(plain: string) {
  const hash = await argon2.hash(plain, { type: argon2.argon2id });
  return { hash, algo: 'argon2id' as const };
}

export async function verifyPassword(storedHash: string, plain: string, algo: string) {
  if (algo?.toLowerCase().startsWith('argon2')) {
    return argon2.verify(storedHash, plain);
  }
  throw new Error('UNSUPPORTED_PASSWORD_ALGO');
}

export function newRefreshTokenOpaque(): string {
  return randomBytes(32).toString('base64url');
}

export function sha256(input: string | Buffer): Buffer {
  return createHash('sha256').update(input).digest();
}
