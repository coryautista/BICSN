import { getPool, sql } from '../../db/mssql.js';

export async function findUserByUsernameOrEmail(usernameOrEmail: string) {
  const p = await getPool();
  const result = await p.request()
    .input('val', sql.NVarChar(320), usernameOrEmail)
    .query(`
      SELECT TOP 1
        CAST(u.id AS NVARCHAR(50)) as id,
        u.username,
        u.email,
        u.passwordHash,
        u.passwordAlgo,
        u.isLockedOut,
        u.lockoutEndAt,
        u.accessFailedCount,
        u.displayName,
        u.photoPath,
        u.idOrganica0,
        u.idOrganica1,
        u.idOrganica2,
        u.idOrganica3
      FROM auth.[user] u
      WHERE u.normalizedUsername = UPPER(@val)
         OR (u.email IS NOT NULL AND u.normalizedEmail = UPPER(@val))
    `);
  const row = result.recordset[0];
  if (!row) return undefined;
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    passwordHash: row.passwordHash,
    passwordAlgo: row.passwordAlgo,
    isLockedOut: row.isLockedOut === 1 || row.isLockedOut === true,
    lockoutEndAt: row.lockoutEndAt,
    accessFailedCount: row.accessFailedCount,
    displayName: row.displayName,
    photoPath: row.photoPath,
    idOrganica0: row.idOrganica0,
    idOrganica1: row.idOrganica1,
    idOrganica2: row.idOrganica2,
    idOrganica3: row.idOrganica3
  };
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
  const p = await getPool();
  await p.request()
    .input('username', sql.NVarChar(100), username)
    .input('email', sql.NVarChar(320), email)
    .input('pwd', sql.NVarChar(255), passwordHash)
    .input('algo', sql.VarChar(20), passwordAlgo)
    .input('displayName', sql.NVarChar(255), displayName ?? null)
    .input('photoPath', sql.NVarChar(255), photoPath ?? null)
    .input('idOrganica0', sql.NVarChar(2), idOrganica0?.toString() ?? null)
    .input('idOrganica1', sql.NVarChar(2), idOrganica1?.toString() ?? null)
    .input('idOrganica2', sql.NVarChar(2), idOrganica2?.toString() ?? null)
    .input('idOrganica3', sql.NVarChar(2), idOrganica3?.toString() ?? null)
    .query(`
      INSERT INTO auth.[user] (
        username, email, passwordHash, passwordAlgo,
        displayName, photoPath, idOrganica0, idOrganica1, idOrganica2, idOrganica3
      )
      VALUES(
        @username, @email, @pwd, @algo,
        @displayName, @photoPath, @idOrganica0, @idOrganica1, @idOrganica2, @idOrganica3
      )
    `);

  // Get the inserted record
  const selectResult = await p.request()
    .input('username', sql.NVarChar(100), username)
    .query(`
      SELECT TOP 1
        CAST(u.id AS NVARCHAR(50)) as id,
        u.username,
        u.email,
        u.displayName,
        u.photoPath,
        u.idOrganica0,
        u.idOrganica1,
        u.idOrganica2,
        u.idOrganica3
      FROM auth.[user] u
      WHERE u.username = @username
      ORDER BY u.createdAt DESC
    `);
  const row = selectResult.recordset[0];
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    displayName: row.displayName,
    photoPath: row.photoPath,
    idOrganica0: row.idOrganica0,
    idOrganica1: row.idOrganica1,
    idOrganica2: row.idOrganica2,
    idOrganica3: row.idOrganica3
  };
}

export async function getUserRoles(userId: string): Promise<{name: string, isEntidad: boolean}[]> {
  const p = await getPool();
  const r = await p.request()
    .input('uid', sql.UniqueIdentifier, userId)
    .query(`
      SELECT r.name, r.isEntidad FROM auth.userRole ur
      JOIN auth.role r ON r.id = ur.roleId
      WHERE ur.userId = @uid
    `);
  return r.recordset.map((x: any) => ({name: x.name, isEntidad: x.isEntidad === 1 || x.isEntidad === true}));
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

export async function findUserById(userId: string) {
  const p = await getPool();
  const r = await p.request()
    .input('userId', sql.UniqueIdentifier, userId)
    .query(`
      SELECT TOP 1
        CAST(u.id AS NVARCHAR(50)) as id,
        u.username,
        u.idOrganica0,
        u.idOrganica1,
        u.idOrganica2,
        u.idOrganica3
      FROM auth.[user] u
      WHERE u.id = @userId
    `);
  const row = r.recordset[0];
  if (!row) return undefined;
  return {
    id: row.id,
    username: row.username,
    idOrganica0: row.idOrganica0,
    idOrganica1: row.idOrganica1,
    idOrganica2: row.idOrganica2,
    idOrganica3: row.idOrganica3
  };
}
// Auth repository