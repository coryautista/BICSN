import { sql } from '../../../../db/mssql.js';
import type { ConnectionPool } from 'mssql';
import { IAuthRepository } from '../../domain/repositories/IAuthRepository.js';
import { User, UserRole, CreateUserData } from '../../domain/entities/User.js';

// Función helper para normalizar claves orgánicas a formato de 2 dígitos
function normalizeClaveOrganica(value: string | number | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  return String(value).trim().padStart(2, '0');
}

export class AuthRepository implements IAuthRepository {
  constructor(private mssqlPool: ConnectionPool) {}

  async findUserByUsernameOrEmail(usernameOrEmail: string): Promise<User | undefined> {
    const result = await this.mssqlPool.request()
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
    
    return this.mapRowToUser(row);
  }

  async findUserById(userId: string): Promise<User | undefined> {
    const result = await this.mssqlPool.request()
      .input('userId', sql.UniqueIdentifier, userId)
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
        WHERE u.id = @userId
      `);
    
    const row = result.recordset[0];
    if (!row) return undefined;
    
    return this.mapRowToUser(row);
  }

  async createUser(data: CreateUserData): Promise<User> {
    await this.mssqlPool.request()
      .input('username', sql.NVarChar(100), data.username)
      .input('email', sql.NVarChar(320), data.email)
      .input('pwd', sql.NVarChar(255), data.passwordHash)
      .input('algo', sql.VarChar(20), data.passwordAlgo)
      .input('displayName', sql.NVarChar(255), data.displayName ?? null)
      .input('photoPath', sql.NVarChar(255), data.photoPath ?? null)
      .input('idOrganica0', sql.NVarChar(2), normalizeClaveOrganica(data.idOrganica0))
      .input('idOrganica1', sql.NVarChar(2), normalizeClaveOrganica(data.idOrganica1))
      .input('idOrganica2', sql.NVarChar(2), data.idOrganica2?.toString() ?? null)
      .input('idOrganica3', sql.NVarChar(2), data.idOrganica3?.toString() ?? null)
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

    const selectResult = await this.mssqlPool.request()
      .input('username', sql.NVarChar(100), data.username)
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
        WHERE u.username = @username
        ORDER BY u.createdAt DESC
      `);
    
    return this.mapRowToUser(selectResult.recordset[0]);
  }

  async getUserRoles(userId: string): Promise<UserRole[]> {
    const result = await this.mssqlPool.request()
      .input('uid', sql.UniqueIdentifier, userId)
      .query(`
        SELECT r.name, r.isEntidad 
        FROM auth.userRole ur
        JOIN auth.role r ON r.id = ur.roleId
        WHERE ur.userId = @uid
      `);
    
    return result.recordset.map((x: any) => ({
      name: x.name,
      isEntidad: x.isEntidad === 1 || x.isEntidad === true
    }));
  }

  async registerFailedLogin(userId: string, maxFailures = 5, lockoutMinutes = 15): Promise<void> {
    await this.mssqlPool.request()
      .input('userId', sql.UniqueIdentifier, userId)
      .input('maxFailures', sql.Int, maxFailures)
      .input('lockoutMinutes', sql.Int, lockoutMinutes)
      .execute('auth.uspRegisterFailedLogin');
  }

  async registerSuccessfulLogin(userId: string): Promise<void> {
    await this.mssqlPool.request()
      .input('userId', sql.UniqueIdentifier, userId)
      .execute('auth.uspRegisterSuccessfulLogin');
  }

  async issueRefreshToken(userId: string, tokenHash: Buffer, ttlMinutes: number, ip?: string, ua?: string): Promise<void> {
    await this.mssqlPool.request()
      .input('userId', sql.UniqueIdentifier, userId)
      .input('tokenHash', sql.VarBinary(64), tokenHash)
      .input('ttlMinutes', sql.Int, ttlMinutes)
      .input('ip', sql.NVarChar(64), ip ?? null)
      .input('ua', sql.NVarChar(300), ua ?? null)
      .execute('auth.uspIssueRefreshToken');
  }

  async rotateRefreshToken(currentHash: Buffer, newHash: Buffer, ttlMinutes: number, ip?: string, ua?: string): Promise<void> {
    await this.mssqlPool.request()
      .input('currentTokenHash', sql.VarBinary(64), currentHash)
      .input('newTokenHash', sql.VarBinary(64), newHash)
      .input('ttlMinutes', sql.Int, ttlMinutes)
      .input('ip', sql.NVarChar(64), ip ?? null)
      .input('ua', sql.NVarChar(300), ua ?? null)
      .execute('auth.uspRotateRefreshToken');
  }

  async revokeAllRefreshTokensForUser(userId: string): Promise<void> {
    await this.mssqlPool.request()
      .input('userId', sql.UniqueIdentifier, userId)
      .execute('auth.uspRevokeAllRefreshTokensForUser');
  }

  async denylistJwt(jti: string, userId: string | null, expiresAt: Date, reason?: string): Promise<void> {
    await this.mssqlPool.request()
      .input('jti', sql.NVarChar(50), jti)
      .input('userId', userId ? sql.UniqueIdentifier : sql.UniqueIdentifier, userId ?? null)
      .input('expiresAt', sql.DateTime2, expiresAt)
      .input('reason', sql.NVarChar(200), reason ?? null)
      .execute('auth.uspDenylistJwt');
  }

  async isJtiDenylisted(jti: string): Promise<boolean> {
    const result = await this.mssqlPool.request()
      .input('jti', sql.NVarChar(50), jti)
      .query(`SELECT 1 FROM auth.jwtDenylist WHERE jti = @jti AND expiresAt > SYSUTCDATETIME()`);
    
    return result.recordset.length > 0;
  }

  private mapRowToUser(row: any): User {
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
}
