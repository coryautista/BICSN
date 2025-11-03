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
    .input('usuarioId', sql.VarChar(50), usuarioId)
    .input('roleId', sql.VarChar(50), roleId)
    .query(`
      SELECT
        UsuarioID,
        RoleID,
        EsActivo,
        createdAt,
        updatedAt,
        createdBy,
        updatedBy
      FROM auth.UserRoles
      WHERE UsuarioID = @usuarioId AND RoleID = @roleId
    `);
  const row = r.recordset[0];
  if (!row) return undefined;
  return {
    usuarioId: row.UsuarioID,
    roleId: row.RoleID,
    esActivo: row.EsActivo,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy
  };
}

export async function listUserRoles() {
  const p = await getPool();
  const r = await p.request().query(`
    SELECT
      UsuarioID,
      RoleID,
      EsActivo,
      createdAt,
      updatedAt,
      createdBy,
      updatedBy
    FROM auth.UserRoles
    ORDER BY UsuarioID ASC, RoleID ASC
  `);
  return r.recordset.map((row: any) => ({
    usuarioId: row.UsuarioID,
    roleId: row.RoleID,
    esActivo: row.EsActivo,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy
  }));
}

export async function listUserRolesByUsuario(usuarioId: string) {
  if (!usuarioId || typeof usuarioId !== 'string' || usuarioId.trim().length === 0) {
    throw new Error('Invalid usuarioId: must be a non-empty string');
  }
  const p = await getPool();
  const r = await p.request()
    .input('usuarioId', sql.VarChar(50), usuarioId)
    .query(`
      SELECT
        UsuarioID,
        RoleID,
        EsActivo,
        createdAt,
        updatedAt,
        createdBy,
        updatedBy
      FROM auth.UserRoles
      WHERE UsuarioID = @usuarioId
      ORDER BY RoleID ASC
    `);
  return r.recordset.map((row: any) => ({
    usuarioId: row.UsuarioID,
    roleId: row.RoleID,
    esActivo: row.EsActivo,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy
  }));
}

export async function createUserRole(usuarioId: string, roleId: string, esActivo: boolean, userId?: string, tx?: sqlType.Transaction) {
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
  const r = await req
    .input('usuarioId', sql.VarChar(50), usuarioId)
    .input('roleId', sql.VarChar(50), roleId)
    .input('esActivo', sql.Bit, esActivo)
    .input('createdBy', sql.VarChar(128), userId ?? null)
    .input('updatedBy', sql.VarChar(128), userId ?? null)
    .query(`
      INSERT INTO auth.UserRoles (UsuarioID, RoleID, EsActivo, createdBy, updatedBy)
      OUTPUT
        INSERTED.UsuarioID,
        INSERTED.RoleID,
        INSERTED.EsActivo,
        INSERTED.createdAt,
        INSERTED.updatedAt,
        INSERTED.createdBy,
        INSERTED.updatedBy
      VALUES (@usuarioId, @roleId, @esActivo, @createdBy, @updatedBy)
    `);
  const row = r.recordset[0];
  return {
    usuarioId: row.UsuarioID,
    roleId: row.RoleID,
    esActivo: row.EsActivo,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy
  };
}

export async function updateUserRole(usuarioId: string, roleId: string, esActivo?: boolean, userId?: string, tx?: sqlType.Transaction) {
  if (!usuarioId || typeof usuarioId !== 'string' || usuarioId.trim().length === 0) {
    throw new Error('Invalid usuarioId: must be a non-empty string');
  }
  if (!roleId || typeof roleId !== 'string' || roleId.trim().length === 0) {
    throw new Error('Invalid roleId: must be a non-empty string');
  }
  if (esActivo !== undefined && typeof esActivo !== 'boolean') {
    throw new Error('Invalid esActivo: must be a boolean');
  }
  const req = tx ? new sqlType.Request(tx) : (await getPool()).request();
  const r = await req
    .input('usuarioId', sql.VarChar(50), usuarioId)
    .input('roleId', sql.VarChar(50), roleId)
    .input('esActivo', sql.Bit, esActivo ?? null)
    .input('updatedBy', sql.VarChar(128), userId ?? null)
    .query(`
      UPDATE auth.UserRoles
      SET EsActivo = @esActivo,
          updatedAt = SYSUTCDATETIME(),
          updatedBy = @updatedBy
      OUTPUT
        INSERTED.UsuarioID,
        INSERTED.RoleID,
        INSERTED.EsActivo,
        INSERTED.createdAt,
        INSERTED.updatedAt,
        INSERTED.createdBy,
        INSERTED.updatedBy
      WHERE UsuarioID = @usuarioId AND RoleID = @roleId
    `);
  const row = r.recordset[0];
  if (!row) return undefined;
  return {
    usuarioId: row.UsuarioID,
    roleId: row.RoleID,
    esActivo: row.EsActivo,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy
  };
}

export async function deleteUserRole(usuarioId: string, roleId: string, tx?: sqlType.Transaction) {
  if (!usuarioId || typeof usuarioId !== 'string' || usuarioId.trim().length === 0) {
    throw new Error('Invalid usuarioId: must be a non-empty string');
  }
  if (!roleId || typeof roleId !== 'string' || roleId.trim().length === 0) {
    throw new Error('Invalid roleId: must be a non-empty string');
  }
  const req = tx ? new sqlType.Request(tx) : (await getPool()).request();
  const r = await req
    .input('usuarioId', sql.VarChar(50), usuarioId)
    .input('roleId', sql.VarChar(50), roleId)
    .query(`
      DELETE FROM auth.UserRoles
      OUTPUT DELETED.UsuarioID, DELETED.RoleID
      WHERE UsuarioID = @usuarioId AND RoleID = @roleId
    `);
  return r.recordset[0] ? { usuarioId: r.recordset[0].UsuarioID, roleId: r.recordset[0].RoleID } : undefined;
}