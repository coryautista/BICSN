import { getPool, sql } from '../../db/mssql.js';
import { sql as sqlType } from '../../db/context.js';

export async function findMenuById(id: number) {
  if (!id || id <= 0) {
    throw new Error('Invalid menu id: must be a positive number');
  }
  const p = await getPool();
  const r = await p.request()
    .input('id', sql.Int, id)
    .query(`
      SELECT
        id,
        nombre,
        componente,
        parentId,
        icono,
        orden
      FROM dbo.Menu
      WHERE id = @id
    `);
  const row = r.recordset[0];
  if (!row) return undefined;
  return {
    id: row.id,
    nombre: row.nombre,
    componente: row.componente,
    parentId: row.parentId,
    icono: row.icono,
    orden: row.orden
  };
}

export async function listMenus() {
  const p = await getPool();
  const r = await p.request().query(`
    SELECT
      id,
      nombre,
      componente,
      parentId,
      icono,
      orden
    FROM dbo.Menu
    ORDER BY orden ASC, nombre ASC
  `);
  return r.recordset.map((row: any) => ({
    id: row.id,
    nombre: row.nombre,
    componente: row.componente,
    parentId: row.parentId,
    icono: row.icono,
    orden: row.orden
  }));
}

export async function createMenu(nombre: string, orden: number, componente?: string, parentId?: number, icono?: string, tx?: sqlType.Transaction) {
  if (!nombre || nombre.trim().length === 0) {
    throw new Error('Invalid nombre: cannot be empty');
  }
  if (orden === undefined || orden < 0) {
    throw new Error('Invalid orden: must be a non-negative number');
  }
  if (parentId !== undefined && (parentId <= 0)) {
    throw new Error('Invalid parentId: must be a positive number or undefined');
  }
  const req = tx ? new sqlType.Request(tx) : (await getPool()).request();
  
  // Get the next ID from the sequence or max+1
  const maxIdReq = tx ? new sqlType.Request(tx) : (await getPool()).request();
  const maxIdResult = await maxIdReq.query(`SELECT ISNULL(MAX(id), 0) + 1 as nextId FROM dbo.Menu`);
  const nextId = maxIdResult.recordset[0].nextId;
  
  // Insert with explicit ID (table doesn't have IDENTITY)
  await req
    .input('id', sql.Int, nextId)
    .input('nombre', sql.NVarChar(255), nombre)
    .input('componente', sql.NVarChar(255), componente ?? null)
    .input('parentId', sql.Int, parentId ?? null)
    .input('icono', sql.NVarChar(255), icono ?? null)
    .input('orden', sql.Int, orden)
    .query(`
      INSERT INTO dbo.Menu (id, nombre, componente, parentId, icono, orden)
      VALUES (@id, @nombre, @componente, @parentId, @icono, @orden)
    `);
  
  // Retrieve the inserted record
  const selectReq = tx ? new sqlType.Request(tx) : (await getPool()).request();
  const r = await selectReq
    .input('id', sql.Int, nextId)
    .query(`
      SELECT
        id,
        nombre,
        componente,
        parentId,
        icono,
        orden
      FROM dbo.Menu
      WHERE id = @id
    `);
  
  const row = r.recordset[0];
  return {
    id: row.id,
    nombre: row.nombre,
    componente: row.componente,
    parentId: row.parentId,
    icono: row.icono,
    orden: row.orden
  };
}

export async function updateMenu(id: number, nombre: string, componente?: string, parentId?: number, icono?: string, orden?: number, tx?: sqlType.Transaction) {
  if (!id || id <= 0) {
    throw new Error('Invalid menu id: must be a positive number');
  }
  if (!nombre || nombre.trim().length === 0) {
    throw new Error('Invalid nombre: cannot be empty');
  }
  if (orden !== undefined && orden < 0) {
    throw new Error('Invalid orden: must be a non-negative number');
  }
  if (parentId !== undefined && parentId <= 0) {
    throw new Error('Invalid parentId: must be a positive number or undefined');
  }
  const req = tx ? new sqlType.Request(tx) : (await getPool()).request();
  
  // Update without OUTPUT because table has triggers
  await req
    .input('id', sql.Int, id)
    .input('nombre', sql.NVarChar(255), nombre)
    .input('componente', sql.NVarChar(255), componente ?? null)
    .input('parentId', sql.Int, parentId ?? null)
    .input('icono', sql.NVarChar(255), icono ?? null)
    .input('orden', sql.Int, orden ?? null)
    .query(`
      UPDATE dbo.Menu
      SET nombre = @nombre,
          componente = @componente,
          parentId = @parentId,
          icono = @icono,
          orden = COALESCE(@orden, orden)
      WHERE id = @id
    `);
  
  // Retrieve the updated record
  const selectReq = tx ? new sqlType.Request(tx) : (await getPool()).request();
  const r = await selectReq
    .input('id', sql.Int, id)
    .query(`
      SELECT
        id,
        nombre,
        componente,
        parentId,
        icono,
        orden
      FROM dbo.Menu
      WHERE id = @id
    `);
  
  const row = r.recordset[0];
  if (!row) return undefined;
  return {
    id: row.id,
    nombre: row.nombre,
    componente: row.componente,
    parentId: row.parentId,
    icono: row.icono,
    orden: row.orden
  };
}

export async function deleteMenu(id: number, tx?: sqlType.Transaction) {
  if (!id || id <= 0) {
    throw new Error('Invalid menu id: must be a positive number');
  }
  const req = tx ? new sqlType.Request(tx) : (await getPool()).request();
  
  // Delete without OUTPUT because table has triggers
  await req
    .input('id', sql.Int, id)
    .query(`
      DELETE FROM dbo.Menu
      WHERE id = @id
    `);
  
  return id;
}