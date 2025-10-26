import { getPool, sql } from '../../../db/mssql.js';
import { sql as sqlType } from '../../../db/context.js';

export async function findDimensionById(dimensionId: number) {
  if (!dimensionId || typeof dimensionId !== 'number' || dimensionId <= 0) {
    throw new Error('Invalid dimensionId: must be a positive number');
  }
  const p = await getPool();
  const r = await p.request()
    .input('dimensionId', sql.Int, dimensionId)
    .query(`
      SELECT
        id,
        nombre,
        descripcion,
        tipoDimension,
        esActiva
      FROM tablero.Dimension
      WHERE id = @dimensionId
    `);
  const row = r.recordset[0];
  if (!row) return undefined;
  return {
    id: row.id,
    nombre: row.nombre,
    descripcion: row.descripcion,
    tipoDimension: row.tipoDimension,
    esActiva: row.esActiva
  };
}

export async function listDimensiones() {
  const p = await getPool();
  const r = await p.request().query(`
    SELECT
      id,
      nombre,
      descripcion,
      tipoDimension,
      esActiva
    FROM tablero.Dimension
    ORDER BY tipoDimension ASC, nombre ASC
  `);
  return r.recordset.map((row: any) => ({
    id: row.id,
    nombre: row.nombre,
    descripcion: row.descripcion,
    tipoDimension: row.tipoDimension,
    esActiva: row.esActiva
  }));
}

export async function listDimensionesByTipo(tipoDimension: string) {
  if (!tipoDimension || !['GEOGRAFICA', 'TEMPORAL', 'DEMOGRAFICA', 'ECONOMICA', 'SOCIAL', 'AMBIENTAL', 'INSTITUCIONAL'].includes(tipoDimension)) {
    throw new Error('Invalid tipoDimension: must be GEOGRAFICA, TEMPORAL, DEMOGRAFICA, ECONOMICA, SOCIAL, AMBIENTAL, or INSTITUCIONAL');
  }
  const p = await getPool();
  const r = await p.request()
    .input('tipoDimension', sql.VarChar(20), tipoDimension)
    .query(`
      SELECT
        id,
        nombre,
        descripcion,
        tipoDimension,
        esActiva
      FROM tablero.Dimension
      WHERE tipoDimension = @tipoDimension
      ORDER BY nombre ASC
    `);
  return r.recordset.map((row: any) => ({
    id: row.id,
    nombre: row.nombre,
    descripcion: row.descripcion,
    tipoDimension: row.tipoDimension,
    esActiva: row.esActiva
  }));
}

export async function createDimension(
  nombre: string,
  descripcion: string,
  tipoDimension: string,
  esActiva?: boolean,
  userId?: string,
  tx?: sqlType.Transaction
) {
  if (!nombre || typeof nombre !== 'string' || nombre.trim().length === 0 || nombre.length > 200) {
    throw new Error('Invalid nombre: must be a non-empty string with max 200 characters');
  }
  if (!descripcion || typeof descripcion !== 'string' || descripcion.trim().length === 0 || descripcion.length > 1000) {
    throw new Error('Invalid descripcion: must be a non-empty string with max 1000 characters');
  }
  if (!tipoDimension || !['GEOGRAFICA', 'TEMPORAL', 'DEMOGRAFICA', 'ECONOMICA', 'SOCIAL', 'AMBIENTAL', 'INSTITUCIONAL'].includes(tipoDimension)) {
    throw new Error('Invalid tipoDimension: must be GEOGRAFICA, TEMPORAL, DEMOGRAFICA, ECONOMICA, SOCIAL, AMBIENTAL, or INSTITUCIONAL');
  }

  const req = tx ? new sqlType.Request(tx) : (await getPool()).request();
  const r = await req
    .input('nombre', sql.NVarChar(200), nombre)
    .input('descripcion', sql.NVarChar(1000), descripcion)
    .input('tipoDimension', sql.VarChar(20), tipoDimension)
    .input('esActiva', sql.Bit, esActiva ?? true)
    .query(`
      INSERT INTO tablero.Dimension (nombre, descripcion, tipoDimension, esActiva)
      OUTPUT
        INSERTED.id,
        INSERTED.nombre,
        INSERTED.descripcion,
        INSERTED.tipoDimension,
        INSERTED.esActiva
      VALUES (@nombre, @descripcion, @tipoDimension, @esActiva)
    `);
  const row = r.recordset[0];
  return {
    id: row.id,
    nombre: row.nombre,
    descripcion: row.descripcion,
    tipoDimension: row.tipoDimension,
    esActiva: row.esActiva
  };
}

export async function updateDimension(
  dimensionId: number,
  nombre?: string,
  descripcion?: string,
  tipoDimension?: string,
  esActiva?: boolean,
  userId?: string,
  tx?: sqlType.Transaction
) {
  if (!dimensionId || typeof dimensionId !== 'number' || dimensionId <= 0) {
    throw new Error('Invalid dimensionId: must be a positive number');
  }
  if (nombre !== undefined && (!nombre || typeof nombre !== 'string' || nombre.trim().length === 0 || nombre.length > 200)) {
    throw new Error('Invalid nombre: must be a non-empty string with max 200 characters');
  }
  if (descripcion !== undefined && (!descripcion || typeof descripcion !== 'string' || descripcion.trim().length === 0 || descripcion.length > 1000)) {
    throw new Error('Invalid descripcion: must be a non-empty string with max 1000 characters');
  }
  if (tipoDimension !== undefined && !['GEOGRAFICA', 'TEMPORAL', 'DEMOGRAFICA', 'ECONOMICA', 'SOCIAL', 'AMBIENTAL', 'INSTITUCIONAL'].includes(tipoDimension)) {
    throw new Error('Invalid tipoDimension: must be GEOGRAFICA, TEMPORAL, DEMOGRAFICA, ECONOMICA, SOCIAL, AMBIENTAL, or INSTITUCIONAL');
  }

  const req = tx ? new sqlType.Request(tx) : (await getPool()).request();
  const r = await req
    .input('dimensionId', sql.Int, dimensionId)
    .input('nombre', sql.NVarChar(200), nombre ?? null)
    .input('descripcion', sql.NVarChar(1000), descripcion ?? null)
    .input('tipoDimension', sql.VarChar(20), tipoDimension ?? null)
    .input('esActiva', sql.Bit, esActiva ?? null)
    .query(`
      UPDATE tablero.Dimension
      SET nombre = @nombre,
          descripcion = @descripcion,
          tipoDimension = @tipoDimension,
          esActiva = @esActiva
      OUTPUT
        INSERTED.id,
        INSERTED.nombre,
        INSERTED.descripcion,
        INSERTED.tipoDimension,
        INSERTED.esActiva
      WHERE id = @dimensionId
    `);
  const row = r.recordset[0];
  if (!row) return undefined;
  return {
    id: row.id,
    nombre: row.nombre,
    descripcion: row.descripcion,
    tipoDimension: row.tipoDimension,
    esActiva: row.esActiva
  };
}

export async function deleteDimension(dimensionId: number, tx?: sqlType.Transaction) {
  if (!dimensionId || typeof dimensionId !== 'number' || dimensionId <= 0) {
    throw new Error('Invalid dimensionId: must be a positive number');
  }
  const req = tx ? new sqlType.Request(tx) : (await getPool()).request();
  const r = await req
    .input('dimensionId', sql.Int, dimensionId)
    .query(`
      DELETE FROM tablero.Dimension
      OUTPUT DELETED.id
      WHERE id = @dimensionId
    `);
  return r.recordset[0]?.id;
}