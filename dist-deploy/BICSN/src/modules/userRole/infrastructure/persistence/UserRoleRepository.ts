import { ConnectionPool } from 'mssql';
import sql from 'mssql';
import { sql as sqlType } from '../../../../db/context.js';
import { IUserRoleRepository } from '../../domain/repositories/IUserRoleRepository.js';
import { UserRole } from '../../domain/entities/UserRole.js';

export class UserRoleRepository implements IUserRoleRepository {
  constructor(private mssqlPool: ConnectionPool) {}

  async findAll(): Promise<UserRole[]> {
    const result = await this.mssqlPool.request().query(`
      SELECT
        userId,
        roleId
      FROM auth.userRole
      ORDER BY userId ASC, roleId ASC
    `);
    
    return result.recordset.map((row: any) => ({
      usuarioId: row.userId,
      roleId: row.roleId
    }));
  }

  async findByIds(usuarioId: string, roleId: string): Promise<UserRole | undefined> {
    // Validaciones
    if (!usuarioId || typeof usuarioId !== 'string' || usuarioId.trim().length === 0) {
      throw new Error('Invalid usuarioId: must be a non-empty string');
    }
    if (!roleId || typeof roleId !== 'string' || roleId.trim().length === 0) {
      throw new Error('Invalid roleId: must be a non-empty string');
    }

    const result = await this.mssqlPool.request()
      .input('usuarioId', sql.UniqueIdentifier, usuarioId)
      .input('roleId', sql.UniqueIdentifier, roleId)
      .query(`
        SELECT
          userId,
          roleId
        FROM auth.userRole
        WHERE userId = @usuarioId AND roleId = @roleId
      `);
    
    const row = result.recordset[0];
    if (!row) return undefined;
    
    return {
      usuarioId: row.userId,
      roleId: row.roleId
    };
  }

  async findByUsuarioId(usuarioId: string): Promise<UserRole[]> {
    // Validaciones
    if (!usuarioId || typeof usuarioId !== 'string' || usuarioId.trim().length === 0) {
      throw new Error('Invalid usuarioId: must be a non-empty string');
    }

    const result = await this.mssqlPool.request()
      .input('usuarioId', sql.UniqueIdentifier, usuarioId)
      .query(`
        SELECT
          userId,
          roleId
        FROM auth.userRole
        WHERE userId = @usuarioId
        ORDER BY roleId ASC
      `);
    
    return result.recordset.map((row: any) => ({
      usuarioId: row.userId,
      roleId: row.roleId
    }));
  }

  async create(usuarioId: string, roleId: string, tx?: sqlType.Transaction): Promise<UserRole> {
    // Validaciones
    if (!usuarioId || typeof usuarioId !== 'string' || usuarioId.trim().length === 0) {
      throw new Error('Invalid usuarioId: must be a non-empty string');
    }
    if (!roleId || typeof roleId !== 'string' || roleId.trim().length === 0) {
      throw new Error('Invalid roleId: must be a non-empty string');
    }

    const req = tx ? new sqlType.Request(tx) : this.mssqlPool.request();
    await req
      .input('usuarioId', sql.UniqueIdentifier, usuarioId)
      .input('roleId', sql.UniqueIdentifier, roleId)
      .query(`
        INSERT INTO auth.userRole (userId, roleId)
        VALUES (@usuarioId, @roleId)
      `);
    
    return {
      usuarioId: usuarioId,
      roleId: roleId
    };
  }

  async delete(usuarioId: string, roleId: string, tx?: sqlType.Transaction): Promise<{ usuarioId: string; roleId: string }> {
    // Validaciones
    if (!usuarioId || typeof usuarioId !== 'string' || usuarioId.trim().length === 0) {
      throw new Error('Invalid usuarioId: must be a non-empty string');
    }
    if (!roleId || typeof roleId !== 'string' || roleId.trim().length === 0) {
      throw new Error('Invalid roleId: must be a non-empty string');
    }

    const req = tx ? new sqlType.Request(tx) : this.mssqlPool.request();
    await req
      .input('usuarioId', sql.UniqueIdentifier, usuarioId)
      .input('roleId', sql.UniqueIdentifier, roleId)
      .query(`
        DELETE FROM auth.userRole
        WHERE userId = @usuarioId AND roleId = @roleId
      `);
    
    return { usuarioId, roleId };
  }
}
