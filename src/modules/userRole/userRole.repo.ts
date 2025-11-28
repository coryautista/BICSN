import { getPool, sql } from '../../db/mssql.js';
import { sql as sqlType } from '../../db/context.js';

export async function findUserRoleByIds(usuarioId: string, roleId: string) {
  if (!usuarioId || typeof usuarioId !== 'string' || usuarioId.trim().length === 0) {
    throw new Error('Invalid usuarioId: must be a non-empty string');
  }
  if (!roleId || typeof roleId !== 'string' || roleId.trim().length === 0) {
    throw new Error('Invalid roleId: must be a non-empty string');
  }
  const p = await getPool();
  const r = await p.request()
    .input('usuarioId', sql.UniqueIdentifier, usuarioId)
    .input('roleId', sql.UniqueIdentifier, roleId)
    .query(`
      SELECT
        userId,
        roleId
      FROM auth.userRole
      WHERE userId = @usuarioId AND roleId = @roleId
    `);
  const row = r.recordset[0];
  if (!row) return undefined;
  return {
    usuarioId: row.userId,
    roleId: row.roleId
  };
}

export async function listUserRoles() {
  const p = await getPool();
  const r = await p.request().query(`
    SELECT
      userId,
      roleId
    FROM auth.userRole
    ORDER BY userId ASC, roleId ASC
  `);
  return r.recordset.map((row: any) => ({
    usuarioId: row.userId,
    roleId: row.roleId
  }));
}

export async function listUserRolesByUsuario(usuarioId: string) {
  if (!usuarioId || typeof usuarioId !== 'string' || usuarioId.trim().length === 0) {
    throw new Error('Invalid usuarioId: must be a non-empty string');
  }
  const p = await getPool();
  const r = await p.request()
    .input('usuarioId', sql.UniqueIdentifier, usuarioId)
    .query(`
      SELECT
        userId,
        roleId
      FROM auth.userRole
      WHERE userId = @usuarioId
      ORDER BY roleId ASC
    `);
  return r.recordset.map((row: any) => ({
    usuarioId: row.userId,
    roleId: row.roleId
  }));
}

export async function createUserRole(usuarioId: string, roleId: string, esActivo: boolean, tx?: sqlType.Transaction) {
  if (!usuarioId || typeof usuarioId !== 'string' || usuarioId.trim().length === 0) {
    throw new Error('Invalid usuarioId: must be a non-empty string');
  }
  if (!roleId || typeof roleId !== 'string' || roleId.trim().length === 0) {
    throw new Error('Invalid roleId: must be a non-empty string');
  }
  if (typeof esActivo !== 'boolean') {
    throw new Error('Invalid esActivo: must be a boolean');
  }
  const req = tx ? new sqlType.Request(tx) : (await getPool()).request();
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

export async function updateUserRole(_usuarioId: string, _roleId: string, _esActivo?: boolean, _userId?: string, _tx?: sqlType.Transaction) {
  // This table doesn't support updates - it's a simple mapping table
  throw new Error('UPDATE not supported for userRole table');
}

export async function deleteUserRole(usuarioId: string, roleId: string, tx?: sqlType.Transaction) {
  if (!usuarioId || typeof usuarioId !== 'string' || usuarioId.trim().length === 0) {
    throw new Error('Invalid usuarioId: must be a non-empty string');
  }
  if (!roleId || typeof roleId !== 'string' || roleId.trim().length === 0) {
    throw new Error('Invalid roleId: must be a non-empty string');
  }
  const req = tx ? new sqlType.Request(tx) : (await getPool()).request();
  const result = await req
    .input('usuarioId', sql.UniqueIdentifier, usuarioId)
    .input('roleId', sql.UniqueIdentifier, roleId)
    .query(`
      DELETE FROM auth.userRole
      WHERE userId = @usuarioId AND roleId = @roleId
    `);
  
  if (result.rowsAffected[0] === 0) {
    throw new Error('USER_ROLE_NOT_FOUND');
  }
  
  return { usuarioId, roleId };
}