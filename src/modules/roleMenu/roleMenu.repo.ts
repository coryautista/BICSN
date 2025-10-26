import { getPool, sql } from '../../db/mssql.js';
import { sql as sqlType } from '../../db/context.js';

export async function findRoleMenuById(id: number) {
  const p = await getPool();
  const r = await p.request()
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
  const row = r.recordset[0];
  if (!row) return undefined;
  return {
    id: row.id,
    roleId: row.roleId,
    menuId: row.menuId,
    createdAt: row.createdAt.toISOString()
  };
}

export async function listRoleMenus() {
  const p = await getPool();
  const r = await p.request().query(`
    SELECT
      id,
      roleId,
      menuId,
      createdAt
    FROM auth.RoleMenu
    ORDER BY createdAt DESC
  `);
  return r.recordset.map((row: any) => ({
    id: row.id,
    roleId: row.roleId,
    menuId: row.menuId,
    createdAt: row.createdAt.toISOString()
  }));
}

export async function findRoleMenusByRoleId(roleId: string) {
  const p = await getPool();
  const r = await p.request()
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
  return r.recordset.map((row: any) => ({
    id: row.id,
    roleId: row.roleId,
    menuId: row.menuId,
    createdAt: row.createdAt.toISOString()
  }));
}

export async function findRoleMenusByMenuId(menuId: number) {
  const p = await getPool();
  const r = await p.request()
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
  return r.recordset.map((row: any) => ({
    id: row.id,
    roleId: row.roleId,
    menuId: row.menuId,
    createdAt: row.createdAt.toISOString()
  }));
}

export async function createRoleMenu(roleId: string, menuId: number, createdAt: string, tx?: sqlType.Transaction) {
  const req = tx ? new sqlType.Request(tx) : (await getPool()).request();
  const r = await req
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
  const row = r.recordset[0];
  return {
    id: row.id,
    roleId: row.roleId,
    menuId: row.menuId,
    createdAt: row.createdAt.toISOString()
  };
}

export async function updateRoleMenu(id: number, roleId?: string, menuId?: number, createdAt?: string, tx?: sqlType.Transaction) {
  const req = tx ? new sqlType.Request(tx) : (await getPool()).request();
  const r = await req
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
  const row = r.recordset[0];
  if (!row) return undefined;
  return {
    id: row.id,
    roleId: row.roleId,
    menuId: row.menuId,
    createdAt: row.createdAt.toISOString()
  };
}

export async function deleteRoleMenu(id: number, tx?: sqlType.Transaction) {
  const req = tx ? new sqlType.Request(tx) : (await getPool()).request();
  const r = await req
    .input('id', sql.Int, id)
    .query(`
      DELETE FROM auth.RoleMenu
      OUTPUT DELETED.id
      WHERE id = @id
    `);
  return r.recordset[0]?.id;
}

export async function deleteRoleMenuByRoleAndMenu(roleId: string, menuId: number, tx?: sqlType.Transaction) {
  const req = tx ? new sqlType.Request(tx) : (await getPool()).request();
  const r = await req
    .input('roleId', sql.UniqueIdentifier, roleId)
    .input('menuId', sql.Int, menuId)
    .query(`
      DELETE FROM auth.RoleMenu
      OUTPUT DELETED.id
      WHERE roleId = @roleId AND menuId = @menuId
    `);
  return r.recordset[0]?.id;
}

export async function findRoleMenusByRoleNames(roleNames: string[]) {
  if (!roleNames || roleNames.length === 0) {
    return [];
  }

  const p = await getPool();
  // Convert role names to uppercase for comparison
  const upperRoleNames = roleNames.map(name => name.toUpperCase());

  // Create a comma-separated list for IN clause
  const placeholders = upperRoleNames.map((_, i) => `@role${i}`).join(',');
  const req = p.request();

  upperRoleNames.forEach((name, i) => {
    req.input(`role${i}`, sql.NVarChar(100), name);
  });

  const r = await req.query(`
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

  return r.recordset.map((row: any) => ({
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