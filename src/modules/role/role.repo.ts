import { getPool, sql } from '../../db/mssql.js';

export async function findRoleByName(name: string) {
  const p = await getPool();
  const r = await p.request()
    .input('name', sql.NVarChar(100), name)
    .query(`
      SELECT TOP 1 id, name, description, isSystem, createdAt
      FROM auth.role
      WHERE normalizedName = UPPER(@name)
    `);
  return r.recordset[0] as any | undefined;
}

export async function createRole(name: string, description?: string, isSystem = false) {
  const p = await getPool();
  const r = await p.request()
    .input('name', sql.NVarChar(100), name)
    .input('description', sql.NVarChar(300), description ?? null)
    .input('isSystem', sql.Bit, isSystem ? 1 : 0)
    .query(`
      INSERT INTO auth.role (name, description, isSystem)
      OUTPUT INSERTED.id, INSERTED.name, INSERTED.description, INSERTED.isSystem, INSERTED.createdAt
      VALUES (@name, @description, @isSystem)
    `);
  return r.recordset[0];
}

export async function listRoles() {
  const p = await getPool();
  const r = await p.request().query(`
    SELECT id, name, description, isSystem, createdAt
    FROM auth.role
    ORDER BY name ASC
  `);
  return r.recordset as any[];
}

export async function findUserById(userId: string) {
  const p = await getPool();
  const r = await p.request()
    .input('uid', sql.UniqueIdentifier, userId)
    .query(`
      SELECT TOP 1 id, username, email
      FROM auth.[user]
      WHERE id = @uid
    `);
  return r.recordset[0] as any | undefined;
}

export async function assignUserRole(userId: string, roleId: string) {
  const p = await getPool();
  // Evita duplicados: PK (userId, roleId)
  await p.request()
    .input('uid', sql.UniqueIdentifier, userId)
    .input('rid', sql.UniqueIdentifier, roleId)
    .query(`
      IF NOT EXISTS (SELECT 1 FROM auth.userRole WHERE userId = @uid AND roleId = @rid)
      INSERT INTO auth.userRole (userId, roleId) VALUES (@uid, @rid)
    `);
}

export async function unassignUserRole(userId: string, roleId: string) {
  const p = await getPool();
  await p.request()
    .input('uid', sql.UniqueIdentifier, userId)
    .input('rid', sql.UniqueIdentifier, roleId)
    .query(`DELETE FROM auth.userRole WHERE userId = @uid AND roleId = @rid`);
}
