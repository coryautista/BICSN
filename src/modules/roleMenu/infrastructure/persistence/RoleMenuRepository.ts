import { ConnectionPool } from 'mssql';
import sql from 'mssql';
import { sql as sqlType } from '../../../../db/context.js';
import { IRoleMenuRepository } from '../../domain/repositories/IRoleMenuRepository.js';
import { RoleMenu, RoleMenuWithDetails } from '../../domain/entities/RoleMenu.js';

export class RoleMenuRepository implements IRoleMenuRepository {
  constructor(private mssqlPool: ConnectionPool) {}

  async findAll(): Promise<RoleMenu[]> {
    const result = await this.mssqlPool.request().query(`
      SELECT
        id,
        roleId,
        menuId,
        createdAt
      FROM auth.RoleMenu
      ORDER BY createdAt DESC
    `);
    
    return result.recordset.map((row: any) => ({
      id: row.id,
      roleId: row.roleId,
      menuId: row.menuId,
      createdAt: row.createdAt.toISOString()
    }));
  }

  async findById(id: number): Promise<RoleMenu | undefined> {
    const result = await this.mssqlPool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT
          id,
          roleId,
          menuId,
          createdAt
        FROM auth.RoleMenu
        WHERE id = @id
      `);
    
    const row = result.recordset[0];
    if (!row) return undefined;
    
    return {
      id: row.id,
      roleId: row.roleId,
      menuId: row.menuId,
      createdAt: row.createdAt.toISOString()
    };
  }

  async findByRoleId(roleId: string): Promise<RoleMenu[]> {
    const result = await this.mssqlPool.request()
      .input('roleId', sql.UniqueIdentifier, roleId)
      .query(`
        SELECT
          id,
          roleId,
          menuId,
          createdAt
        FROM auth.RoleMenu
        WHERE roleId = @roleId
        ORDER BY createdAt DESC
      `);
    
    return result.recordset.map((row: any) => ({
      id: row.id,
      roleId: row.roleId,
      menuId: row.menuId,
      createdAt: row.createdAt.toISOString()
    }));
  }

  async findByMenuId(menuId: number): Promise<RoleMenu[]> {
    const result = await this.mssqlPool.request()
      .input('menuId', sql.Int, menuId)
      .query(`
        SELECT
          id,
          roleId,
          menuId,
          createdAt
        FROM auth.RoleMenu
        WHERE menuId = @menuId
        ORDER BY createdAt DESC
      `);
    
    return result.recordset.map((row: any) => ({
      id: row.id,
      roleId: row.roleId,
      menuId: row.menuId,
      createdAt: row.createdAt.toISOString()
    }));
  }

  async findByRoleNames(roleNames: string[]): Promise<RoleMenuWithDetails[]> {
    if (!roleNames || roleNames.length === 0) {
      return [];
    }

    const upperRoleNames = roleNames.map(name => name.toUpperCase());
    const placeholders = upperRoleNames.map((_, i) => `@role${i}`).join(',');
    const req = this.mssqlPool.request();

    upperRoleNames.forEach((name, i) => {
      req.input(`role${i}`, sql.NVarChar(100), name);
    });

    const result = await req.query(`
      SELECT DISTINCT
        rm.id,
        rm.roleId,
        rm.menuId,
        rm.createdAt,
        r.name as roleName,
        m.nombre as menuName,
        m.componente as menuPath,
        m.icono as menuIcon,
        m.parentId as menuParentId,
        m.orden as menuOrder
      FROM auth.RoleMenu rm
      INNER JOIN auth.role r ON rm.roleId = r.id
      INNER JOIN dbo.Menu m ON rm.menuId = m.id
      WHERE UPPER(r.name) IN (${placeholders})
      ORDER BY m.orden ASC, m.nombre ASC
    `);

    return result.recordset.map((row: any) => ({
      id: row.id,
      roleId: row.roleId,
      menuId: row.menuId,
      createdAt: row.createdAt.toISOString(),
      role: {
        id: row.roleId,
        name: row.roleName
      },
      menu: {
        id: row.menuId,
        name: row.menuName,
        path: row.menuPath,
        icon: row.menuIcon,
        parentId: row.menuParentId,
        order: row.menuOrder
      }
    }));
  }

  async create(roleId: string, menuId: number, createdAt: string, tx?: sqlType.Transaction): Promise<RoleMenu> {
    const req = tx ? new sqlType.Request(tx) : this.mssqlPool.request();
    const result = await req
      .input('roleId', sql.UniqueIdentifier, roleId)
      .input('menuId', sql.Int, menuId)
      .input('createdAt', sql.DateTime2, createdAt)
      .query(`
        INSERT INTO auth.RoleMenu (roleId, menuId, createdAt)
        OUTPUT
          INSERTED.id,
          INSERTED.roleId,
          INSERTED.menuId,
          INSERTED.createdAt
        VALUES (@roleId, @menuId, @createdAt)
      `);
    
    const row = result.recordset[0];
    return {
      id: row.id,
      roleId: row.roleId,
      menuId: row.menuId,
      createdAt: row.createdAt.toISOString()
    };
  }

  async update(id: number, roleId?: string, menuId?: number, createdAt?: string, tx?: sqlType.Transaction): Promise<RoleMenu | undefined> {
    const req = tx ? new sqlType.Request(tx) : this.mssqlPool.request();
    const result = await req
      .input('id', sql.Int, id)
      .input('roleId', sql.UniqueIdentifier, roleId ?? null)
      .input('menuId', sql.Int, menuId ?? null)
      .input('createdAt', sql.DateTime2, createdAt ?? null)
      .query(`
        UPDATE auth.RoleMenu
        SET roleId = @roleId,
            menuId = @menuId,
            createdAt = @createdAt
        OUTPUT
          INSERTED.id,
          INSERTED.roleId,
          INSERTED.menuId,
          INSERTED.createdAt
        WHERE id = @id
      `);
    
    const row = result.recordset[0];
    if (!row) return undefined;
    
    return {
      id: row.id,
      roleId: row.roleId,
      menuId: row.menuId,
      createdAt: row.createdAt.toISOString()
    };
  }

  async delete(id: number, tx?: sqlType.Transaction): Promise<number | undefined> {
    const req = tx ? new sqlType.Request(tx) : this.mssqlPool.request();
    const result = await req
      .input('id', sql.Int, id)
      .query(`
        DELETE FROM auth.RoleMenu
        OUTPUT DELETED.id
        WHERE id = @id
      `);
    
    return result.recordset[0]?.id;
  }

  async deleteByRoleAndMenu(roleId: string, menuId: number, tx?: sqlType.Transaction): Promise<number | undefined> {
    const req = tx ? new sqlType.Request(tx) : this.mssqlPool.request();
    const result = await req
      .input('roleId', sql.UniqueIdentifier, roleId)
      .input('menuId', sql.Int, menuId)
      .query(`
        DELETE FROM auth.RoleMenu
        OUTPUT DELETED.id
        WHERE roleId = @roleId AND menuId = @menuId
      `);
    
    return result.recordset[0]?.id;
  }
}
