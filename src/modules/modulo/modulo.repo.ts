import { getPool, sql } from '../../db/mssql.js';
import { sql as sqlType } from '../../db/context.js';

export async function findModuloById(id: number) {
  const p = await getPool();
  const r = await p.request()
    .input('id', sql.Int, id)
    .query(`
      SELECT
        id,
        nombre,
        tipo,
        icono,
        orden
      FROM dbo.Modulo
      WHERE id = @id
    `);
  const row = r.recordset[0];
  if (!row) return undefined;
  return {
    id: row.id,
    nombre: row.nombre,
    tipo: row.tipo,
    icono: row.icono,
    orden: row.orden
  };
}

export async function listModulos() {
  const p = await getPool();
  const r = await p.request().query(`
    SELECT
      id,
      nombre,
      tipo,
      icono,
      orden
    FROM dbo.Modulo
    ORDER BY orden ASC, nombre ASC
  `);
  return r.recordset.map((row: any) => ({
    id: row.id,
    nombre: row.nombre,
    tipo: row.tipo,
    icono: row.icono,
    orden: row.orden
  }));
}

export async function createModulo(nombre: string, tipo: string, icono?: string, orden?: number, tx?: sqlType.Transaction) {
  const req = tx ? new sqlType.Request(tx) : (await getPool()).request();
  const r = await req
    .input('nombre', sql.NVarChar(255), nombre)
    .input('tipo', sql.NVarChar(10), tipo)
    .input('icono', sql.NVarChar(255), icono ?? null)
    .input('orden', sql.Int, orden ?? 0)
    .query(`
      INSERT INTO dbo.Modulo (nombre, tipo, icono, orden)
      OUTPUT
        INSERTED.id,
        INSERTED.nombre,
        INSERTED.tipo,
        INSERTED.icono,
        INSERTED.orden
      VALUES (@nombre, @tipo, @icono, @orden)
    `);
  const row = r.recordset[0];
  return {
    id: row.id,
    nombre: row.nombre,
    tipo: row.tipo,
    icono: row.icono,
    orden: row.orden
  };
}

export async function updateModulo(id: number, nombre: string, tipo: string, icono?: string, orden?: number, tx?: sqlType.Transaction) {
  const req = tx ? new sqlType.Request(tx) : (await getPool()).request();
  const r = await req
    .input('id', sql.Int, id)
    .input('nombre', sql.NVarChar(255), nombre)
    .input('tipo', sql.NVarChar(10), tipo)
    .input('icono', sql.NVarChar(255), icono ?? null)
    .input('orden', sql.Int, orden ?? 0)
    .query(`
      UPDATE dbo.Modulo
      SET nombre = @nombre,
          tipo = @tipo,
          icono = @icono,
          orden = @orden
      OUTPUT
        INSERTED.id,
        INSERTED.nombre,
        INSERTED.tipo,
        INSERTED.icono,
        INSERTED.orden
      WHERE id = @id
    `);
  const row = r.recordset[0];
  if (!row) return undefined;
  return {
    id: row.id,
    nombre: row.nombre,
    tipo: row.tipo,
    icono: row.icono,
    orden: row.orden
  };
}

export async function deleteModulo(id: number, tx?: sqlType.Transaction) {
  const req = tx ? new sqlType.Request(tx) : (await getPool()).request();
  const r = await req
    .input('id', sql.Int, id)
    .query(`
      DELETE FROM dbo.Modulo
      OUTPUT DELETED.id as id
      WHERE id = @id
    `);
  return r.recordset[0]?.id;
}