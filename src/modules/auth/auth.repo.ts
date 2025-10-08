import { getPool, sql } from '../../db/mssql.js';

export async function findUserByUsernameOrEmail(usernameOrEmail: string) {
  const p = await getPool();
  const r = await p.request()
    .input('val', sql.NVarChar(320), usernameOrEmail)
    .query(`
      SELECT TOP 1
        u.id, u.username, u.email, u.passwordHash, u.passwordAlgo,
        u.isLockedOut, u.lockoutEndAt, u.accessFailedCount
      FROM auth.[user] u
      WHERE u.normalizedUsername = UPPER(@val)
         OR (u.email IS NOT NULL AND u.normalizedEmail = UPPER(@val))
    `);
  return r.recordset[0] as any | undefined;
}

export async function createUser(username: string, email: string | null, passwordHash: string, passwordAlgo: string) {
  const p = await getPool();
  const r = await p.request()
    .input('username', sql.NVarChar(100), username)
    .input('email', sql.NVarChar(320), email)
    .input('pwd', sql.NVarChar(255), passwordHash)
    .input('algo', sql.VarChar(20), passwordAlgo)
    .query(`
      INSERT INTO auth.[user] (username, email, passwordHash, passwordAlgo)
      OUTPUT INSERTED.id, INSERTED.username, INSERTED.email
      VALUES(@username, @email, @pwd, @algo)
    `);
  return r.recordset[0];
}

export async function getUserRoles(userId: string): Promise<string[]> {
  const p = await getPool();
  const r = await p.request()
    .input('uid', sql.UniqueIdentifier, userId)
    .query(`
      SELECT r.name FROM auth.userRole ur
      JOIN auth.role r ON r.id = ur.roleId
      WHERE ur.userId = @uid
    `);
  return r.recordset.map((x: any) => x.name);
}

export async function registerFailedLogin(userId: string, maxFailures = 5, lockoutMinutes = 15) {
  const p = await getPool();
  await p.request()
    .input('userId', sql.UniqueIdentifier, userId)
    .input('maxFailures', sql.Int, maxFailures)
    .input('lockoutMinutes', sql.Int, lockoutMinutes)
    .execute('auth.uspRegisterFailedLogin');
}

export async function registerSuccessfulLogin(userId: string) {
  const p = await getPool();
  await p.request()
    .input('userId', sql.UniqueIdentifier, userId)
    .execute('auth.uspRegisterSuccessfulLogin');
}

export async function issueRefreshToken(userId: string, tokenHash: Buffer, ttlMinutes: number, ip?: string, ua?: string) {
  const p = await getPool();
  await p.request()
    .input('userId', sql.UniqueIdentifier, userId)
    .input('tokenHash', sql.VarBinary(64), tokenHash)
    .input('ttlMinutes', sql.Int, ttlMinutes)
    .input('ip', sql.NVarChar(64), ip ?? null)
    .input('ua', sql.NVarChar(300), ua ?? null)
    .execute('auth.uspIssueRefreshToken');
}

export async function rotateRefreshToken(currentHash: Buffer, newHash: Buffer, ttlMinutes: number, ip?: string, ua?: string) {
  const p = await getPool();
  await p.request()
    .input('currentTokenHash', sql.VarBinary(64), currentHash)
    .input('newTokenHash', sql.VarBinary(64), newHash)
    .input('ttlMinutes', sql.Int, ttlMinutes)
    .input('ip', sql.NVarChar(64), ip ?? null)
    .input('ua', sql.NVarChar(300), ua ?? null)
    .execute('auth.uspRotateRefreshToken');
}

export async function revokeAllRefreshTokensForUser(userId: string) {
  const p = await getPool();
  await p.request()
    .input('userId', sql.UniqueIdentifier, userId)
    .execute('auth.uspRevokeAllRefreshTokensForUser');
}

export async function denylistJwt(jti: string, userId: string | null, expiresAtIso: string, reason?: string) {
  const p = await getPool();
  await p.request()
    .input('jti', sql.NVarChar(50), jti)
    .input('userId', userId ? sql.UniqueIdentifier : sql.UniqueIdentifier, userId ?? null)
    .input('expiresAt', sql.DateTime2, new Date(expiresAtIso))
    .input('reason', sql.NVarChar(200), reason ?? null)
    .execute('auth.uspDenylistJwt');
}

export async function isJtiDenylisted(jti: string): Promise<boolean> {
  const p = await getPool();
  const r = await p.request()
    .input('jti', sql.NVarChar(50), jti)
    .query(`SELECT 1 FROM auth.jwtDenylist WHERE jti = @jti AND expiresAt > SYSUTCDATETIME()`);
  return r.recordset.length > 0;
}
// Auth repository