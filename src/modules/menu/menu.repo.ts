/**
 * @deprecated This file is deprecated. Use MenuRepository from ./infrastructure/persistence instead.
 * This minimal version is kept only for backwards compatibility with roleMenu module.
 */

import { getPool } from '../../db/mssql.js';

export async function findMenuById(id: number) {
  const pool = await getPool();
  const result = await pool.request()
    .input('id', id)
    .query('SELECT * FROM menu WHERE id = @id');
  return result.recordset[0] || null;
}

export async function listMenus() {
  const pool = await getPool();
  const result = await pool.query('SELECT * FROM menu ORDER BY orden ASC');
  return result.recordset;
}

export async function createMenu(
  nombre: string,
  componente: string,
  parentId: number | null,
  icono: string | null,
  orden: number
) {
  const pool = await getPool();
  const result = await pool.request()
    .input('nombre', nombre)
    .input('componente', componente)
    .input('parentId', parentId)
    .input('icono', icono)
    .input('orden', orden)
    .query(`
      INSERT INTO menu (nombre, componente, parentId, icono, orden)
      OUTPUT INSERTED.*
      VALUES (@nombre, @componente, @parentId, @icono, @orden)
    `);
  return result.recordset[0];
}

export async function updateMenu(
  id: number,
  nombre: string,
  componente: string,
  parentId: number | null,
  icono: string | null,
  orden: number
) {
  const pool = await getPool();
  const result = await pool.request()
    .input('id', id)
    .input('nombre', nombre)
    .input('componente', componente)
    .input('parentId', parentId)
    .input('icono', icono)
    .input('orden', orden)
    .query(`
      UPDATE menu
      SET nombre = @nombre, componente = @componente, parentId = @parentId, icono = @icono, orden = @orden
      OUTPUT INSERTED.*
      WHERE id = @id
    `);
  return result.recordset[0] || null;
}

export async function deleteMenu(id: number) {
  const pool = await getPool();
  await pool.request()
    .input('id', id)
    .query('DELETE FROM menu WHERE id = @id');
  return id;
}
