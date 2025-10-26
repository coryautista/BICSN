import { getPool, sql } from '../../../db/mssql.js';
import { sql as sqlType } from '../../../db/context.js';

export async function findUnidadMedidaById(unidadMedidaId: number) {
  if (!unidadMedidaId || typeof unidadMedidaId !== 'number' || unidadMedidaId <= 0) {
    throw new Error('Invalid unidadMedidaId: must be a positive number');
  }
  const p = await getPool();
  const r = await p.request()
    .input('unidadMedidaId', sql.Int, unidadMedidaId)
    .query(`
      SELECT
        id,
        nombre,
        simbolo,
        descripcion,
        categoria,
        esActiva
      FROM tablero.UnidadMedida
      WHERE id = @unidadMedidaId
    `);
  const row = r.recordset[0];
  if (!row) return undefined;
  return {
    id: row.id,
    nombre: row.nombre,
    simbolo: row.simbolo,
    descripcion: row.descripcion,
    categoria: row.categoria,
    esActiva: row.esActiva
  };
}

export async function listUnidadesMedida() {
  const p = await getPool();
  const r = await p.request().query(`
    SELECT
      id,
      nombre,
      simbolo,
      descripcion,
      categoria,
      esActiva
    FROM tablero.UnidadMedida
    ORDER BY categoria ASC, nombre ASC
  `);
  return r.recordset.map((row: any) => ({
    id: row.id,
    nombre: row.nombre,
    simbolo: row.simbolo,
    descripcion: row.descripcion,
    categoria: row.categoria,
    esActiva: row.esActiva
  }));
}

export async function listUnidadesMedidaByCategoria(categoria: string) {
  if (!categoria || !['CANTIDAD', 'PORCENTAJE', 'MONETARIA', 'TIEMPO', 'PESO', 'VOLUMEN', 'AREA', 'DISTANCIA', 'VELOCIDAD', 'TEMPERATURA'].includes(categoria)) {
    throw new Error('Invalid categoria: must be CANTIDAD, PORCENTAJE, MONETARIA, TIEMPO, PESO, VOLUMEN, AREA, DISTANCIA, VELOCIDAD, or TEMPERATURA');
  }
  const p = await getPool();
  const r = await p.request()
    .input('categoria', sql.VarChar(20), categoria)
    .query(`
      SELECT
        id,
        nombre,
        simbolo,
        descripcion,
        categoria,
        esActiva
      FROM tablero.UnidadMedida
      WHERE categoria = @categoria
      ORDER BY nombre ASC
    `);
  return r.recordset.map((row: any) => ({
    id: row.id,
    nombre: row.nombre,
    simbolo: row.simbolo,
    descripcion: row.descripcion,
    categoria: row.categoria,
    esActiva: row.esActiva
  }));
}

export async function createUnidadMedida(
  nombre: string,
  simbolo: string,
  descripcion: string,
  categoria: string,
  esActiva?: boolean,
  userId?: string,
  tx?: sqlType.Transaction
) {
  if (!nombre || typeof nombre !== 'string' || nombre.trim().length === 0 || nombre.length > 100) {
    throw new Error('Invalid nombre: must be a non-empty string with max 100 characters');
  }
  if (!simbolo || typeof simbolo !== 'string' || simbolo.trim().length === 0 || simbolo.length > 20) {
    throw new Error('Invalid simbolo: must be a non-empty string with max 20 characters');
  }
  if (!descripcion || typeof descripcion !== 'string' || descripcion.trim().length === 0 || descripcion.length > 500) {
    throw new Error('Invalid descripcion: must be a non-empty string with max 500 characters');
  }
  if (!categoria || !['CANTIDAD', 'PORCENTAJE', 'MONETARIA', 'TIEMPO', 'PESO', 'VOLUMEN', 'AREA', 'DISTANCIA', 'VELOCIDAD', 'TEMPERATURA'].includes(categoria)) {
    throw new Error('Invalid categoria: must be CANTIDAD, PORCENTAJE, MONETARIA, TIEMPO, PESO, VOLUMEN, AREA, DISTANCIA, VELOCIDAD, or TEMPERATURA');
  }

  const req = tx ? new sqlType.Request(tx) : (await getPool()).request();
  const r = await req
    .input('nombre', sql.NVarChar(100), nombre)
    .input('simbolo', sql.NVarChar(20), simbolo)
    .input('descripcion', sql.NVarChar(500), descripcion)
    .input('categoria', sql.VarChar(20), categoria)
    .input('esActiva', sql.Bit, esActiva ?? true)
    .query(`
      INSERT INTO tablero.UnidadMedida (nombre, simbolo, descripcion, categoria, esActiva)
      OUTPUT
        INSERTED.id,
        INSERTED.nombre,
        INSERTED.simbolo,
        INSERTED.descripcion,
        INSERTED.categoria,
        INSERTED.esActiva
      VALUES (@nombre, @simbolo, @descripcion, @categoria, @esActiva)
    `);
  const row = r.recordset[0];
  return {
    id: row.id,
    nombre: row.nombre,
    simbolo: row.simbolo,
    descripcion: row.descripcion,
    categoria: row.categoria,
    esActiva: row.esActiva
  };
}

export async function updateUnidadMedida(
  unidadMedidaId: number,
  nombre?: string,
  simbolo?: string,
  descripcion?: string,
  categoria?: string,
  esActiva?: boolean,
  userId?: string,
  tx?: sqlType.Transaction
) {
  if (!unidadMedidaId || typeof unidadMedidaId !== 'number' || unidadMedidaId <= 0) {
    throw new Error('Invalid unidadMedidaId: must be a positive number');
  }
  if (nombre !== undefined && (!nombre || typeof nombre !== 'string' || nombre.trim().length === 0 || nombre.length > 100)) {
    throw new Error('Invalid nombre: must be a non-empty string with max 100 characters');
  }
  if (simbolo !== undefined && (!simbolo || typeof simbolo !== 'string' || simbolo.trim().length === 0 || simbolo.length > 20)) {
    throw new Error('Invalid simbolo: must be a non-empty string with max 20 characters');
  }
  if (descripcion !== undefined && (!descripcion || typeof descripcion !== 'string' || descripcion.trim().length === 0 || descripcion.length > 500)) {
    throw new Error('Invalid descripcion: must be a non-empty string with max 500 characters');
  }
  if (categoria !== undefined && !['CANTIDAD', 'PORCENTAJE', 'MONETARIA', 'TIEMPO', 'PESO', 'VOLUMEN', 'AREA', 'DISTANCIA', 'VELOCIDAD', 'TEMPERATURA'].includes(categoria)) {
    throw new Error('Invalid categoria: must be CANTIDAD, PORCENTAJE, MONETARIA, TIEMPO, PESO, VOLUMEN, AREA, DISTANCIA, VELOCIDAD, or TEMPERATURA');
  }

  const req = tx ? new sqlType.Request(tx) : (await getPool()).request();
  const r = await req
    .input('unidadMedidaId', sql.Int, unidadMedidaId)
    .input('nombre', sql.NVarChar(100), nombre ?? null)
    .input('simbolo', sql.NVarChar(20), simbolo ?? null)
    .input('descripcion', sql.NVarChar(500), descripcion ?? null)
    .input('categoria', sql.VarChar(20), categoria ?? null)
    .input('esActiva', sql.Bit, esActiva ?? null)
    .query(`
      UPDATE tablero.UnidadMedida
      SET nombre = @nombre,
          simbolo = @simbolo,
          descripcion = @descripcion,
          categoria = @categoria,
          esActiva = @esActiva
      OUTPUT
        INSERTED.id,
        INSERTED.nombre,
        INSERTED.simbolo,
        INSERTED.descripcion,
        INSERTED.categoria,
        INSERTED.esActiva
      WHERE id = @unidadMedidaId
    `);
  const row = r.recordset[0];
  if (!row) return undefined;
  return {
    id: row.id,
    nombre: row.nombre,
    simbolo: row.simbolo,
    descripcion: row.descripcion,
    categoria: row.categoria,
    esActiva: row.esActiva
  };
}

export async function deleteUnidadMedida(unidadMedidaId: number, tx?: sqlType.Transaction) {
  if (!unidadMedidaId || typeof unidadMedidaId !== 'number' || unidadMedidaId <= 0) {
    throw new Error('Invalid unidadMedidaId: must be a positive number');
  }
  const req = tx ? new sqlType.Request(tx) : (await getPool()).request();
  const r = await req
    .input('unidadMedidaId', sql.Int, unidadMedidaId)
    .query(`
      DELETE FROM tablero.UnidadMedida
      OUTPUT DELETED.id
      WHERE id = @unidadMedidaId
    `);
  return r.recordset[0]?.id;
}