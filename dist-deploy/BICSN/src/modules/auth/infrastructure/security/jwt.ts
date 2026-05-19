import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../../../../config/env.js';
import { newRefreshTokenOpaque, sha256 } from './crypto.js';

type AccessClaims = {
  sub: string;
  roles: string[];
  entidades: boolean[];
  jti: string;
  iss: string;
  aud: string;
  idOrganica0?: string | null;
  idOrganica1?: string | null;
  idOrganica2?: string | null;
  idOrganica3?: string | null;
};

export function signAccessToken(
  userId: string,
  roles: string[],
  entidades: boolean[],
  idOrganica0?: string | null,
  idOrganica1?: string | null,
  idOrganica2?: string | null,
  idOrganica3?: string | null
) {
  const jti = uuidv4();
  const payload: AccessClaims = {
    sub: userId,
    roles,
    entidades,
    jti,
    iss: env.jwt.iss,
    aud: env.jwt.aud,
    idOrganica0,
    idOrganica1,
    idOrganica2,
    idOrganica3
  };

  const token = (jwt.sign as any)(payload, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessTtl
  });

  const decoded = jwt.decode(token) as AccessClaims & { iat: number; exp: number };
  const { exp } = decoded;

  return { token, exp, jti };
}

export function generateRefreshToken() {
  const token = newRefreshTokenOpaque();
  const hash = sha256(token);
  const ttlMinutes = env.cookie.refreshTtlMin;

  return { token, hash, ttlMinutes };
}

export function verifyAccessToken(token: string): AccessClaims & { iat: number; exp: number } {
  try {
    return jwt.verify(token, env.jwt.accessSecret) as AccessClaims & { iat: number; exp: number };
  } catch (error) {
    throw new Error('INVALID_TOKEN');
  }
}
