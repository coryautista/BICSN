import { ConnectionPool } from 'mssql';
import sql from 'mssql';
import { sql as sqlType } from '../../../../db/context.js';
import { IRoleRepository } from '../../domain/repositories/IRoleRepository.js';
import { Role } from '../../domain/entities/Role.js';

export class RoleRepository implements IRoleRepository {
  constructor(private mssqlPool: ConnectionPool) {}

  async findAll(): Promise<Role[]> {
    const result = await this.mssqlPool.request().query(`
      SELECT
        CAST(id AS NVARCHAR(50)) as id,
        name,
        description,
        CAST(isSystem AS BIT) as isSystem,
        CAST(isEntidad AS BIT) as isEntidad,
        createdAt
      FROM auth.role
      ORDER BY name ASC
    `);
    
    return result.recordset.map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      isSystem: row.isSystem === 1 || row.isSystem === true,
      isEntidad: row.isEntidad === 1 || row.isEntidad === true,
      createdAt: row.createdAt
    }));
  }

  async findById(id: string): Promise<Role | undefined> {
    const result = await this.mssqlPool.request()
      .input('id', sql.UniqueIdentifier, id)
      .query(`
        SELECT TOP 1
          CAST(id AS NVARCHAR(50)) as id,
          name,
          description,
          isSystem,
          isEntidad,
          createdAt
        FROM auth.role
        WHERE id = @id
      `);
    
    const row = result.recordset[0];
    if (!row) return undefined;
    
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      isSystem: row.isSystem === 1 || row.isSystem === true,
      isEntidad: row.isEntidad === 1 || row.isEntidad === true,
      createdAt: row.createdAt
    };
  }

  async findByName(name: string): Promise<Role | undefined> {
    const result = await this.mssqlPool.request()
      .input('name', sql.NVarChar(100), name)
      .query(`
        SELECT TOP 1
          CAST(id AS NVARCHAR(50)) as id,
          name,
          description,
          isSystem,
          isEntidad,
          createdAt
        FROM auth.role
        WHERE normalizedName = UPPER(@name)
      `);
    
    const row = result.recordset[0];
    if (!row) return undefined;
    
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      isSystem: row.isSystem === 1 || row.isSystem === true,
      isEntidad: row.isEntidad === 1 || row.isEntidad === true,
      createdAt: row.createdAt
    };
  }

  async create(
    data: { name: string; description?: string; isSystem?: boolean; isEntidad?: boolean },
    tx?: sqlType.Transaction
  ): Promise<Role> {
    // Validaciones
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Role name is required');
    }
    if (data.name.length > 100) {
      throw new Error('Role name must not exceed 100 characters');
    }
    if (data.description && data.description.length > 300) {
      throw new Error('Role description must not exceed 300 characters');
    }

    const req = tx ? new sqlType.Request(tx) : this.mssqlPool.request();
    const result = await req
      .input('name', sql.NVarChar(100), data.name)
      .input('description', sql.NVarChar(300), data.description ?? null)
      .input('isSystem', sql.Bit, data.isSystem ? 1 : 0)
      .input('isEntidad', sql.Bit, data.isEntidad ? 1 : 0)
      .query(`
        INSERT INTO auth.role (name, description, isSystem, isEntidad)
        OUTPUT
          CAST(INSERTED.id AS NVARCHAR(50)) as id,
          INSERTED.name,
          INSERTED.description,
          INSERTED.isSystem,
          INSERTED.isEntidad,
          INSERTED.createdAt
        VALUES (@name, @description, @isSystem, @isEntidad)
      `);

    const row = result.recordset[0];
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      isSystem: row.isSystem === 1 || row.isSystem === true,
      isEntidad: row.isEntidad === 1 || row.isEntidad === true,
      createdAt: row.createdAt
    };
  }

  async createWithoutOutput(
    data: { name: string; description?: string; isSystem?: boolean; isEntidad?: boolean },
    tx?: sqlType.Transaction
  ): Promise<void> {
    // Validaciones
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Role name is required');
    }
    if (data.name.length > 100) {
      throw new Error('Role name must not exceed 100 characters');
    }
    if (data.description && data.description.length > 300) {
      throw new Error('Role description must not exceed 300 characters');
    }

    const req = tx ? new sqlType.Request(tx) : this.mssqlPool.request();
    await req
      .input('name', sql.NVarChar(100), data.name)
      .input('description', sql.NVarChar(300), data.description ?? null)
      .input('isSystem', sql.Bit, data.isSystem ? 1 : 0)
      .input('isEntidad', sql.Bit, data.isEntidad ? 1 : 0)
      .query(`
        INSERT INTO auth.role (name, description, isSystem, isEntidad)
        VALUES (@name, @description, @isSystem, @isEntidad)
      `);
  }

  async findUserById(userId: string): Promise<any | undefined> {
    const result = await this.mssqlPool.request()
      .input('uid', sql.UniqueIdentifier, userId)
      .query(`
        SELECT TOP 1
          CAST(id AS NVARCHAR(50)) as id,
          username,
          email,
          displayName,
          photoPath,
          idOrganica0,
          idOrganica1,
          idOrganica2,
          idOrganica3
        FROM auth.[user]
        WHERE id = @uid
      `);
    
    const row = result.recordset[0];
    if (!row) return undefined;
    
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

  async assignUserRole(userId: string, roleId: string, tx?: sqlType.Transaction): Promise<void> {
    const req = tx ? new sqlType.Request(tx) : this.mssqlPool.request();
    await req
      .input('uid', sql.UniqueIdentifier, userId)
      .input('rid', sql.UniqueIdentifier, roleId)
      .query(`
        IF NOT EXISTS (SELECT 1 FROM auth.userRole WHERE userId = @uid AND roleId = @rid)
        INSERT INTO auth.userRole (userId, roleId) VALUES (@uid, @rid)
      `);
  }

  async unassignUserRole(userId: string, roleId: string, tx?: sqlType.Transaction): Promise<void> {
    const req = tx ? new sqlType.Request(tx) : this.mssqlPool.request();
    await req
      .input('uid', sql.UniqueIdentifier, userId)
      .input('rid', sql.UniqueIdentifier, roleId)
      .query(`DELETE FROM auth.userRole WHERE userId = @uid AND roleId = @rid`);
  }
}
