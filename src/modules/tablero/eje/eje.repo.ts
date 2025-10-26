import { getPool, sql } from '../../../db/mssql.js';
import { sql as sqlType } from '../../../db/context.js';

export async function findEjeById(ejeId: number) {
  if (!ejeId || typeof ejeId !== 'number' || ejeId <= 0) {
    throw new Error('Invalid ejeId: must be a positive number');
  }
  const p = await getPool();
  const r = await p.request()
    .input('ejeId', sql.Int, ejeId)
    .query(`
      SELECT
        id,
        nombre
      FROM tablero.Eje
      WHERE id = @ejeId
    `);
  const row = r.recordset[0];
  if (!row) return undefined;
  return {
    id: row.id,
    nombre: row.nombre
  };
}

export async function listEjes() {
  const p = await getPool();
  const r = await p.request().query(`
    SELECT
      id,
      nombre
    FROM tablero.Eje
    ORDER BY nombre ASC
  `);
  return r.recordset.map((row: any) => ({
    id: row.id,
    nombre: row.nombre
  }));
}

export async function createEje(nombre: string, userId?: string, tx?: sqlType.Transaction) {
  if (!nombre || typeof nombre !== 'string' || nombre.trim().length === 0 || nombre.length > 500) {
    throw new Error('Invalid nombre: must be a non-empty string with max 500 characters');
  }
  const req = tx ? new sqlType.Request(tx) : (await getPool()).request();
  const r = await req
    .input('nombre', sql.NVarChar(500), nombre)
    .query(`
      INSERT INTO tablero.Eje (nombre)
      OUTPUT
        INSERTED.id,
        INSERTED.nombre
      VALUES (@nombre)
    `);
  const row = r.recordset[0];
  return {
    id: row.id,
    nombre: row.nombre
  };
}

export async function updateEje(ejeId: number, nombre: string, userId?: string, tx?: sqlType.Transaction) {
  if (!ejeId || typeof ejeId !== 'number' || ejeId <= 0) {
    throw new Error('Invalid ejeId: must be a positive number');
  }
  if (!nombre || typeof nombre !== 'string' || nombre.trim().length === 0 || nombre.length > 500) {
    throw new Error('Invalid nombre: must be a non-empty string with max 500 characters');
  }
  const req = tx ? new sqlType.Request(tx) : (await getPool()).request();
  const r = await req
    .input('ejeId', sql.Int, ejeId)
    .input('nombre', sql.NVarChar(500), nombre)
    .query(`
      UPDATE tablero.Eje
      SET nombre = @nombre
      OUTPUT
        INSERTED.id,
        INSERTED.nombre
      WHERE id = @ejeId
    `);
  const row = r.recordset[0];
  if (!row) return undefined;
  return {
    id: row.id,
    nombre: row.nombre
  };
}

export async function deleteEje(ejeId: number, tx?: sqlType.Transaction) {
  if (!ejeId || typeof ejeId !== 'number' || ejeId <= 0) {
    throw new Error('Invalid ejeId: must be a positive number');
  }
  const req = tx ? new sqlType.Request(tx) : (await getPool()).request();
  const r = await req
    .input('ejeId', sql.Int, ejeId)
    .query(`
      DELETE FROM tablero.Eje
      OUTPUT DELETED.id
      WHERE id = @ejeId
    `);
  return r.recordset[0]?.id;
}

export async function getEjeWithLineasEstrategicas(ejeId: number) {
  if (!ejeId || typeof ejeId !== 'number' || ejeId <= 0) {
    throw new Error('Invalid ejeId: must be a positive number');
  }
  const p = await getPool();
  const r = await p.request()
    .input('ejeId', sql.Int, ejeId)
    .query(`
      SELECT
        e.id as ejeId,
        e.nombre as ejeNombre,
        le.id as lineaId,
        le.nombre as lineaNombre,
        le.descripcion as lineaDescripcion
      FROM tablero.Eje e
      LEFT JOIN tablero.LineaEstrategica le ON e.id = le.idEje
      WHERE e.id = @ejeId
      ORDER BY le.nombre ASC
    `);

  if (r.recordset.length === 0) return undefined;

  const eje = {
    id: r.recordset[0].ejeId,
    nombre: r.recordset[0].ejeNombre,
    lineasEstrategicas: r.recordset
      .filter((row: any) => row.lineaId)
      .map((row: any) => ({
        id: row.lineaId,
        nombre: row.lineaNombre,
        descripcion: row.lineaDescripcion
      }))
  };

  return eje;
}