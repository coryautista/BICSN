import { getPool } from '../../db/mssql.js';
import { AuthRepository } from './infrastructure/persistence/AuthRepository.js';

async function getRepository(): Promise<AuthRepository> {
  return new AuthRepository(await getPool());
}

export async function findUserByUsernameOrEmail(usernameOrEmail: string) {
  return (await getRepository()).findUserByUsernameOrEmail(usernameOrEmail);
}

export async function createUser(
  username: string,
  email: string | null,
  passwordHash: string,
  passwordAlgo: string,
  displayName?: string | null,
  photoPath?: string | null,
  idOrganica0?: number | null,
  idOrganica1?: number | null,
  idOrganica2?: number | null,
  idOrganica3?: number | null
) {
  return (await getRepository()).createUser({
    username,
    email,
    passwordHash,
    passwordAlgo,
    displayName,
    photoPath,
    idOrganica0,
    idOrganica1,
    idOrganica2,
    idOrganica3
  });
}

export async function getUserRoles(userId: string) {
  return (await getRepository()).getUserRoles(userId);
}

export async function registerFailedLogin(userId: string, maxFailures = 5, lockoutMinutes = 15) {
  return (await getRepository()).registerFailedLogin(userId, maxFailures, lockoutMinutes);
}

export async function registerSuccessfulLogin(userId: string) {
  return (await getRepository()).registerSuccessfulLogin(userId);
}

export async function issueRefreshToken(userId: string, tokenHash: Buffer, ttlMinutes: number, ip?: string, ua?: string) {
  return (await getRepository()).issueRefreshToken(userId, tokenHash, ttlMinutes, ip, ua);
}

export async function rotateRefreshToken(currentHash: Buffer, newHash: Buffer, ttlMinutes: number, ip?: string, ua?: string) {
  return (await getRepository()).rotateRefreshToken(currentHash, newHash, ttlMinutes, ip, ua);
}

export async function revokeAllRefreshTokensForUser(userId: string) {
  return (await getRepository()).revokeAllRefreshTokensForUser(userId);
}

export async function denylistJwt(jti: string, userId: string | null, expiresAtIso: string, reason?: string) {
  return (await getRepository()).denylistJwt(jti, userId, new Date(expiresAtIso), reason);
}

export async function isJtiDenylisted(jti: string): Promise<boolean> {
  return (await getRepository()).isJtiDenylisted(jti);
}

export async function findUserById(userId: string) {
  return (await getRepository()).findUserById(userId);
}
