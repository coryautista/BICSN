import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../../config/env.js';
import { hashPassword, verifyPassword, newRefreshTokenOpaque, sha256 } from './auth.crypto.js';
import {
  findUserByUsernameOrEmail, createUser, getUserRoles,
  registerFailedLogin, registerSuccessfulLogin,
  issueRefreshToken, rotateRefreshToken, revokeAllRefreshTokensForUser,
  denylistJwt, isJtiDenylisted
} from './auth.repo.js';

type AccessClaims = {
  sub: string;
  roles: string[];
  entidades: boolean[];
  jti: string;
  iss: string;
  aud: string;
};

export async function register(
  username: string,
  email: string | undefined,
  password: string,
  displayName?: string,
  photoPath?: string,
  idOrganica0?: number,
  idOrganica1?: number,
  idOrganica2?: number,
  idOrganica3?: number
) {
  const { hash, algo } = await hashPassword(password);
  const u = await createUser(
    username,
    email ?? null,
    hash,
    algo,
    displayName,
    photoPath,
    idOrganica0,
    idOrganica1,
    idOrganica2,
    idOrganica3
  );
  return u;
}

export async function login(usernameOrEmail: string, password: string, ip?: string, ua?: string) {
  console.log('Login service called for:', usernameOrEmail);
  const u = await findUserByUsernameOrEmail(usernameOrEmail);
  console.log('User found:', u ? 'YES' : 'NO');
  if (!u) throw new Error('INVALID_CREDENTIALS');

  if (u.isLockedOut && u.lockoutEndAt && new Date(u.lockoutEndAt) > new Date()) {
    throw new Error('LOCKED_OUT');
  }

  const ok = await verifyPassword(u.passwordHash, password, u.passwordAlgo);
  console.log('Password verification:', ok ? 'SUCCESS' : 'FAILED');
  if (!ok) {
    await registerFailedLogin(u.id);
    throw new Error('INVALID_CREDENTIALS');
  }

  await registerSuccessfulLogin(u.id);

  const rolesData = await getUserRoles(u.id);
  console.log('User roles:', rolesData);
  const roles = rolesData.map(r => r.name);
  const entidades = rolesData.map(r => r.isEntidad);
  const access = signAccessToken(u.id, roles, entidades);
  const refreshPlain = newRefreshTokenOpaque();

  const refreshHash = sha256(refreshPlain);

  await issueRefreshToken(u.id, refreshHash, env.cookie.refreshTtlMin, ip, ua);

  return { userId: u.id, username: u.username, accessToken: access.token, accessExp: access.exp, refreshToken: refreshPlain };
}
export async function rotateRefresh(currentRefreshPlain: string, ip?: string, ua?: string) {
  const currentHash = sha256(currentRefreshPlain);
  const newPlain = newRefreshTokenOpaque();
  const newHash = sha256(newPlain);

  await rotateRefreshToken(currentHash, newHash, env.cookie.refreshTtlMin, ip, ua);
  return newPlain;
}

export async function logoutAll(userId: string) {
  await revokeAllRefreshTokensForUser(userId);
}

export function signAccessToken(userId: string, roles: string[], entidades: boolean[]) {
  const jti = uuidv4();
  const payload: AccessClaims = { sub: userId, roles, entidades, jti, iss: env.jwt.iss, aud: env.jwt.aud };
  const token = (jwt.sign as any)(payload, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessTtl
  });
  const decoded = jwt.decode(token) as AccessClaims & { iat: number, exp: number };
  const { exp } = decoded;
  return { token, jti, exp };
}

export async function denylistAccessToken(jti: string, userId: string | null, exp: number) {
  const expiresAtIso = new Date(exp * 1000).toISOString();
  await denylistJwt(jti, userId, expiresAtIso, 'logout');
}

export async function isAccessDenylisted(jti: string) {
  return isJtiDenylisted(jti);
}

export function verifyAccess(token: string) {
  return jwt.verify(token, env.jwt.accessSecret, { issuer: env.jwt.iss, audience: env.jwt.aud }) as AccessClaims & { iat: number, exp: number };
}
// Auth service