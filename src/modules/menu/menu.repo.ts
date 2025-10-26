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
  const r = await req
    .input('nombre', sql.NVarChar(255), nombre)
    .input('componente', sql.NVarChar(255), componente ?? null)
    .input('parentId', sql.Int, parentId ?? null)
    .input('icono', sql.NVarChar(255), icono ?? null)
    .input('orden', sql.Int, orden)
    .query(`
      INSERT INTO dbo.Menu (nombre, componente, parentId, icono, orden)
      OUTPUT
        INSERTED.id,
        INSERTED.nombre,
        INSERTED.componente,
        INSERTED.parentId,
        INSERTED.icono,
        INSERTED.orden
      VALUES (@nombre, @componente, @parentId, @icono, @orden)
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
  const r = await req
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
          orden = @orden
      OUTPUT
        INSERTED.id,
        INSERTED.nombre,
        INSERTED.componente,
        INSERTED.parentId,
        INSERTED.icono,
        INSERTED.orden
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
  const r = await req
    .input('id', sql.Int, id)
    .query(`
      DELETE FROM dbo.Menu
      OUTPUT DELETED.id
      WHERE id = @id
    `);
  return r.recordset[0]?.id;
}