import { getPool, sql } from '../../db/mssql.js';
import { sql as sqlType } from '../../db/context.js';

export async function findRoleById(id: string) {
  const p = await getPool();
  const r = await p.request()
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
  const row = r.recordset[0];
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

export async function findRoleByName(name: string) {
  const p = await getPool();
  const r = await p.request()
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
  const row = r.recordset[0];
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

export async function createRole(name: string, description?: string, isSystem = false, isEntidad = false, tx?: sqlType.Transaction) {
  const req = tx ? new sqlType.Request(tx) : (await getPool()).request();
  const r = await req
    .input('name', sql.NVarChar(100), name)
    .input('description', sql.NVarChar(300), description ?? null)
    .input('isSystem', sql.Bit, isSystem ? 1 : 0)
    .input('isEntidad', sql.Bit, isEntidad ? 1 : 0)
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
  const row = r.recordset[0];
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    isSystem: row.isSystem === 1 || row.isSystem === true,
    isEntidad: row.isEntidad === 1 || row.isEntidad === true,
    createdAt: row.createdAt
  };
}

export async function listRoles() {
  const p = await getPool();
  const r = await p.request().query(`
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
  return r.recordset.map((row: any) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    isSystem: row.isSystem === 1 || row.isSystem === true,
    isEntidad: row.isEntidad === 1 || row.isEntidad === true,
    createdAt: row.createdAt
  }));
}

export async function findUserById(userId: string) {
  const p = await getPool();
  const r = await p.request()
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
  const row = r.recordset[0];
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

export async function assignUserRole(userId: string, roleId: string, tx?: sqlType.Transaction) {
  const req = tx ? new sqlType.Request(tx) : (await getPool()).request();
  // Evita duplicados: PK (userId, roleId)
  await req
    .input('uid', sql.UniqueIdentifier, userId)
    .input('rid', sql.UniqueIdentifier, roleId)
    .query(`
      IF NOT EXISTS (SELECT 1 FROM auth.userRole WHERE userId = @uid AND roleId = @rid)
      INSERT INTO auth.userRole (userId, roleId) VALUES (@uid, @rid)
    `);
}

export async function unassignUserRole(userId: string, roleId: string, tx?: sqlType.Transaction) {
  const req = tx ? new sqlType.Request(tx) : (await getPool()).request();
  await req
    .input('uid', sql.UniqueIdentifier, userId)
    .input('rid', sql.UniqueIdentifier, roleId)
    .query(`DELETE FROM auth.userRole WHERE userId = @uid AND roleId = @rid`);
}
