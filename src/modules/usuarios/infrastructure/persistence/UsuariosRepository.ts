import { sql } from '../../../../db/mssql.js';
import type { ConnectionPool } from 'mssql';
import { IUsuariosRepository } from '../../domain/repositories/IUsuariosRepository.js';
import { Usuario, CreateUsuarioData, UpdateUsuarioData, UsuarioRole } from '../../domain/entities/Usuario.js';

export class UsuariosRepository implements IUsuariosRepository {
  constructor(private mssqlPool: ConnectionPool) {}

  async findAll(): Promise<Usuario[]> {
    const result = await this.mssqlPool.request()
      .query(`
        SELECT
          CAST(id AS NVARCHAR(50)) as id,
          username,
          email,
          displayName,
          photoPath,
          isLockedOut,
          lockoutEndAt,
          accessFailedCount,
          idOrganica0,
          idOrganica1,
          idOrganica2,
          idOrganica3,
          createdAt,
          updatedAt
        FROM auth.[user]
        ORDER BY createdAt DESC
      `);
    
    return result.recordset.map(row => this.mapRowToUsuario(row));
  }

  async findById(userId: string): Promise<Usuario | undefined> {
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      throw new Error('Invalid usuarioId: must be a non-empty string');
    }

    const result = await this.mssqlPool.request()
      .input('userId', sql.VarChar(50), userId)
      .query(`
        SELECT
          CAST(id AS NVARCHAR(50)) as id,
          username,
          email,
          displayName,
          photoPath,
          isLockedOut,
          lockoutEndAt,
          accessFailedCount,
          idOrganica0,
          idOrganica1,
          idOrganica2,
          idOrganica3,
          createdAt,
          updatedAt
        FROM auth.[user]
        WHERE id = @userId
      `);
    
    const row = result.recordset[0];
    if (!row) return undefined;
    
    return this.mapRowToUsuario(row);
  }

  async create(data: CreateUsuarioData): Promise<Usuario> {
    await this.mssqlPool.request()
      .input('username', sql.NVarChar(100), data.username)
      .input('email', sql.NVarChar(320), data.email)
      .input('passwordHash', sql.NVarChar(255), data.passwordHash)
      .input('passwordAlgo', sql.VarChar(20), data.passwordAlgo)
      .input('displayName', sql.NVarChar(255), data.displayName ?? null)
      .input('photoPath', sql.NVarChar(255), data.photoPath ?? null)
      .input('idOrganica0', sql.NVarChar(2), data.idOrganica0?.toString() ?? null)
      .input('idOrganica1', sql.NVarChar(2), data.idOrganica1?.toString() ?? null)
      .input('idOrganica2', sql.NVarChar(2), data.idOrganica2?.toString() ?? null)
      .input('idOrganica3', sql.NVarChar(2), data.idOrganica3?.toString() ?? null)
      .query(`
        INSERT INTO auth.[user] (
          username, email, passwordHash, passwordAlgo,
          displayName, photoPath, idOrganica0, idOrganica1, idOrganica2, idOrganica3
        )
        VALUES(
          @username, @email, @passwordHash, @passwordAlgo,
          @displayName, @photoPath, @idOrganica0, @idOrganica1, @idOrganica2, @idOrganica3
        )
      `);

    const selectResult = await this.mssqlPool.request()
      .input('username', sql.NVarChar(100), data.username)
      .query(`
        SELECT TOP 1
          CAST(id AS NVARCHAR(50)) as id,
          username,
          email,
          displayName,
          photoPath,
          isLockedOut,
          lockoutEndAt,
          accessFailedCount,
          idOrganica0,
          idOrganica1,
          idOrganica2,
          idOrganica3,
          createdAt,
          updatedAt
        FROM auth.[user]
        WHERE username = @username
        ORDER BY createdAt DESC
      `);
    
    return this.mapRowToUsuario(selectResult.recordset[0]);
  }

  async update(userId: string, data: UpdateUsuarioData): Promise<Usuario | undefined> {
    const updates: string[] = [];
    const request = this.mssqlPool.request().input('userId', sql.UniqueIdentifier, userId);

    if (data.email !== undefined) {
      updates.push('email = @email');
      request.input('email', sql.NVarChar(320), data.email);
    }
    if (data.displayName !== undefined) {
      updates.push('displayName = @displayName');
      request.input('displayName', sql.NVarChar(255), data.displayName);
    }
    if (data.photoPath !== undefined) {
      updates.push('photoPath = @photoPath');
      request.input('photoPath', sql.NVarChar(255), data.photoPath);
    }
    if (data.idOrganica0 !== undefined) {
      updates.push('idOrganica0 = @idOrganica0');
      request.input('idOrganica0', sql.NVarChar(2), data.idOrganica0?.toString() ?? null);
    }
    if (data.idOrganica1 !== undefined) {
      updates.push('idOrganica1 = @idOrganica1');
      request.input('idOrganica1', sql.NVarChar(2), data.idOrganica1?.toString() ?? null);
    }
    if (data.idOrganica2 !== undefined) {
      updates.push('idOrganica2 = @idOrganica2');
      request.input('idOrganica2', sql.NVarChar(2), data.idOrganica2?.toString() ?? null);
    }
    if (data.idOrganica3 !== undefined) {
      updates.push('idOrganica3 = @idOrganica3');
      request.input('idOrganica3', sql.NVarChar(2), data.idOrganica3?.toString() ?? null);
    }

    if (updates.length === 0) {
      return this.findById(userId);
    }

    updates.push('updatedAt = SYSUTCDATETIME()');

    await request.query(`
      UPDATE auth.[user]
      SET ${updates.join(', ')}
      WHERE id = @userId
    `);

    return this.findById(userId);
  }

  async delete(userId: string): Promise<boolean> {
    const result = await this.mssqlPool.request()
      .input('userId', sql.UniqueIdentifier, userId)
      .query(`
        DELETE FROM auth.[user]
        WHERE id = @userId
      `);
    
    return result.rowsAffected[0] > 0;
  }

  async getUserRoles(userId: string): Promise<UsuarioRole[]> {
    const result = await this.mssqlPool.request()
      .input('userId', sql.UniqueIdentifier, userId)
      .query(`
        SELECT 
          CAST(r.id AS NVARCHAR(50)) as roleId,
          r.name as roleName,
          r.isEntidad
        FROM auth.userRole ur
        JOIN auth.role r ON r.id = ur.roleId
        WHERE ur.userId = @userId
      `);
    
    return result.recordset.map((row: any) => ({
      roleId: row.roleId,
      roleName: row.roleName,
      isEntidad: row.isEntidad === 1 || row.isEntidad === true
    }));
  }

  async assignRole(userId: string, roleId: string): Promise<void> {
    await this.mssqlPool.request()
      .input('userId', sql.UniqueIdentifier, userId)
      .input('roleId', sql.UniqueIdentifier, roleId)
      .query(`
        IF NOT EXISTS (SELECT 1 FROM auth.userRole WHERE userId = @userId AND roleId = @roleId)
        BEGIN
          INSERT INTO auth.userRole (userId, roleId)
          VALUES (@userId, @roleId)
        END
      `);
  }

  async removeRole(userId: string, roleId: string): Promise<void> {
    await this.mssqlPool.request()
      .input('userId', sql.UniqueIdentifier, userId)
      .input('roleId', sql.UniqueIdentifier, roleId)
      .query(`
        DELETE FROM auth.userRole
        WHERE userId = @userId AND roleId = @roleId
      `);
  }

  async findByUsername(username: string): Promise<Usuario | undefined> {
    if (!username || typeof username !== 'string' || username.trim().length === 0) {
      throw new Error('Invalid username: must be a non-empty string');
    }

    const result = await this.mssqlPool.request()
      .input('username', sql.NVarChar(100), username)
      .query(`
        SELECT
          CAST(id AS NVARCHAR(50)) as id,
          username,
          email,
          displayName,
          photoPath,
          isLockedOut,
          lockoutEndAt,
          accessFailedCount,
          idOrganica0,
          idOrganica1,
          idOrganica2,
          idOrganica3,
          createdAt,
          updatedAt
        FROM auth.[user]
        WHERE username = @username
      `);
    
    const row = result.recordset[0];
    if (!row) return undefined;
    
    return this.mapRowToUsuario(row);
  }

  async findByEmail(email: string): Promise<Usuario | undefined> {
    if (!email || typeof email !== 'string' || email.trim().length === 0) {
      throw new Error('Invalid email: must be a non-empty string');
    }

    const result = await this.mssqlPool.request()
      .input('email', sql.NVarChar(320), email)
      .query(`
        SELECT
          CAST(id AS NVARCHAR(50)) as id,
          username,
          email,
          displayName,
          photoPath,
          isLockedOut,
          lockoutEndAt,
          accessFailedCount,
          idOrganica0,
          idOrganica1,
          idOrganica2,
          idOrganica3,
          createdAt,
          updatedAt
        FROM auth.[user]
        WHERE email = @email
      `);
    
    const row = result.recordset[0];
    if (!row) return undefined;
    
    return this.mapRowToUsuario(row);
  }

  private mapRowToUsuario(row: any): Usuario {
    return {
      id: row.id,
      username: row.username,
      email: row.email,
      displayName: row.displayName,
      photoPath: row.photoPath,
      isLockedOut: row.isLockedOut === 1 || row.isLockedOut === true,
      lockoutEndAt: row.lockoutEndAt,
      accessFailedCount: row.accessFailedCount,
      idOrganica0: row.idOrganica0,
      idOrganica1: row.idOrganica1,
      idOrganica2: row.idOrganica2,
      idOrganica3: row.idOrganica3,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    };
  }
}

// Singleton instance

