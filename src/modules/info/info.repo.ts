import { getPool, sql } from '../../db/mssql.js';

export async function findInfoById(id: number) {
  const p = await getPool();
  const r = await p.request()
    .input('id', sql.Int, id)
    .query(`
      SELECT
        id,
        nombre,
        icono,
        color,
        colorBotones,
        colorEncabezados,
        colorLetra,
        createdAt,
        updatedAt,
        createdBy,
        updatedBy
      FROM dbo.Info
      WHERE id = @id
    `);
  const row = r.recordset[0];
  if (!row) return undefined;
  return {
    id: row.id,
    nombre: row.nombre,
    icono: row.icono,
    color: row.color,
    colorBotones: row.colorBotones,
    colorEncabezados: row.colorEncabezados,
    colorLetra: row.colorLetra,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    createdBy: row.createdBy,
    updatedBy: row.updatedBy
  };
}

export async function listInfos() {
  const p = await getPool();
  const r = await p.request().query(`
    SELECT
      id,
      nombre,
      icono,
      color,
      colorBotones,
      colorEncabezados,
      colorLetra,
      createdAt,
      updatedAt,
      createdBy,
      updatedBy
    FROM dbo.Info
    ORDER BY nombre ASC
  `);
  return r.recordset.map((row: any) => ({
    id: row.id,
    nombre: row.nombre,
    icono: row.icono,
    color: row.color,
    colorBotones: row.colorBotones,
    colorEncabezados: row.colorEncabezados,
    colorLetra: row.colorLetra,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    createdBy: row.createdBy,
    updatedBy: row.updatedBy
  }));
}

export async function createInfo(nombre: string, createdAt: string, updatedAt: string, icono?: string, color?: string, colorBotones?: string, colorEncabezados?: string, colorLetra?: string, createdBy?: string, updatedBy?: string) {
  const p = await getPool();
  const r = await p.request()
    .input('nombre', sql.NVarChar(255), nombre)
    .input('icono', sql.NVarChar(255), icono ?? null)
    .input('color', sql.NVarChar(50), color ?? null)
    .input('colorBotones', sql.NVarChar(50), colorBotones ?? null)
    .input('colorEncabezados', sql.NVarChar(50), colorEncabezados ?? null)
    .input('colorLetra', sql.NVarChar(50), colorLetra ?? null)
    .input('createdAt', sql.DateTime2, createdAt)
    .input('updatedAt', sql.DateTime2, updatedAt)
    .input('createdBy', sql.NVarChar(128), createdBy ?? null)
    .input('updatedBy', sql.NVarChar(128), updatedBy ?? null)
    .query(`
      INSERT INTO dbo.Info (nombre, icono, color, colorBotones, colorEncabezados, colorLetra, createdAt, updatedAt, createdBy, updatedBy)
      OUTPUT
        INSERTED.id,
        INSERTED.nombre,
        INSERTED.icono,
        INSERTED.color,
        INSERTED.colorBotones,
        INSERTED.colorEncabezados,
        INSERTED.colorLetra,
        INSERTED.createdAt,
        INSERTED.updatedAt,
        INSERTED.createdBy,
        INSERTED.updatedBy
      VALUES (@nombre, @icono, @color, @colorBotones, @colorEncabezados, @colorLetra, @createdAt, @updatedAt, @createdBy, @updatedBy)
    `);
  const row = r.recordset[0];
  return {
    id: row.id,
    nombre: row.nombre,
    icono: row.icono,
    color: row.color,
    colorBotones: row.colorBotones,
    colorEncabezados: row.colorEncabezados,
    colorLetra: row.colorLetra,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    createdBy: row.createdBy,
    updatedBy: row.updatedBy
  };
}

export async function updateInfo(id: number, updatedAt: string, nombre?: string, icono?: string, color?: string, colorBotones?: string, colorEncabezados?: string, colorLetra?: string, updatedBy?: string) {
  const p = await getPool();
  const r = await p.request()
    .input('id', sql.Int, id)
    .input('nombre', sql.NVarChar(255), nombre ?? null)
    .input('icono', sql.NVarChar(255), icono ?? null)
    .input('color', sql.NVarChar(50), color ?? null)
    .input('colorBotones', sql.NVarChar(50), colorBotones ?? null)
    .input('colorEncabezados', sql.NVarChar(50), colorEncabezados ?? null)
    .input('colorLetra', sql.NVarChar(50), colorLetra ?? null)
    .input('updatedAt', sql.DateTime2, updatedAt)
    .input('updatedBy', sql.NVarChar(128), updatedBy ?? null)
    .query(`
      UPDATE dbo.Info
      SET nombre = @nombre,
          icono = @icono,
          color = @color,
          colorBotones = @colorBotones,
          colorEncabezados = @colorEncabezados,
          colorLetra = @colorLetra,
          updatedAt = @updatedAt,
          updatedBy = @updatedBy
      OUTPUT
        INSERTED.id,
        INSERTED.nombre,
        INSERTED.icono,
        INSERTED.color,
        INSERTED.colorBotones,
        INSERTED.colorEncabezados,
        INSERTED.colorLetra,
        INSERTED.createdAt,
        INSERTED.updatedAt,
        INSERTED.createdBy,
        INSERTED.updatedBy
      WHERE id = @id
    `);
  const row = r.recordset[0];
  if (!row) return undefined;
  return {
    id: row.id,
    nombre: row.nombre,
    icono: row.icono,
    color: row.color,
    colorBotones: row.colorBotones,
    colorEncabezados: row.colorEncabezados,
    colorLetra: row.colorLetra,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    createdBy: row.createdBy,
    updatedBy: row.updatedBy
  };
}

export async function deleteInfo(id: number) {
  const p = await getPool();
  const r = await p.request()
    .input('id', sql.Int, id)
    .query(`
      DELETE FROM dbo.Info
      OUTPUT DELETED.id
      WHERE id = @id
    `);
  return r.recordset[0]?.id;
}