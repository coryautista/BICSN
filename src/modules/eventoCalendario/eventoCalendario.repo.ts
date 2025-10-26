import { getPool, sql } from '../../db/mssql.js';
import { sql as sqlType } from '../../db/context.js';

export async function findEventoCalendarioById(id: number) {
  if (!id || id <= 0) {
    throw new Error('EVENTO_CALENDARIO_INVALID_ID');
  }

  const p = await getPool();
  const r = await p.request()
    .input('id', sql.Int, id)
    .query(`
      SELECT
        id,
        CONVERT(VARCHAR(10), fecha, 23) as fecha,  -- YYYY-MM-DD
        tipo,
        anio,
        createdAt
      FROM dbo.EventoCalendario
      WHERE id = @id
    `);
  const row = r.recordset[0];
  if (!row) return undefined;
  return {
    id: row.id,
    fecha: row.fecha,
    tipo: row.tipo,
    anio: row.anio,
    createdAt: row.createdAt.toISOString()
  };
}

export async function listEventoCalendarios() {
  const p = await getPool();
  const r = await p.request().query(`
    SELECT
      id,
      CONVERT(VARCHAR(10), fecha, 23) as fecha,
      tipo,
      anio,
      createdAt
    FROM dbo.EventoCalendario
    ORDER BY fecha DESC, createdAt DESC
  `);
  return r.recordset.map((row: any) => ({
    id: row.id,
    fecha: row.fecha,
    tipo: row.tipo,
    anio: row.anio,
    createdAt: row.createdAt.toISOString()
  }));
}

export async function findEventoCalendariosByAnio(anio: number) {
  if (!anio || anio < 1900 || anio > 2100) {
    throw new Error('EVENTO_CALENDARIO_INVALID_ANIO');
  }

  const p = await getPool();
  const r = await p.request()
    .input('anio', sql.Int, anio)
    .query(`
      SELECT
        id,
        CONVERT(VARCHAR(10), fecha, 23) as fecha,
        tipo,
        anio,
        createdAt
      FROM dbo.EventoCalendario
      WHERE anio = @anio
      ORDER BY fecha ASC
    `);
  return r.recordset.map((row: any) => ({
    id: row.id,
    fecha: row.fecha,
    tipo: row.tipo,
    anio: row.anio,
    createdAt: row.createdAt.toISOString()
  }));
}

export async function createEventoCalendario(fecha: string, tipo: string, anio: number, createdAt: string, tx?: sqlType.Transaction) {
  if (!fecha || !tipo || !anio || !createdAt) {
    throw new Error('EVENTO_CALENDARIO_MISSING_REQUIRED_FIELDS');
  }

  const validTipos = ['ARCHIVO_APLICACION', 'ASUETO', 'ALTA_BAJA_CAMBIO', 'PAGO', 'HIPOTECARIO'];
  if (!validTipos.includes(tipo)) {
    throw new Error('EVENTO_CALENDARIO_INVALID_TIPO');
  }

  if (anio < 1900 || anio > 2100) {
    throw new Error('EVENTO_CALENDARIO_INVALID_ANIO');
  }

  const fechaDate = new Date(fecha);
  if (isNaN(fechaDate.getTime())) {
    throw new Error('EVENTO_CALENDARIO_INVALID_FECHA');
  }

  const req = tx ? new sqlType.Request(tx) : (await getPool()).request();
  const r = await req
    .input('fecha', sql.Date, fecha)
    .input('tipo', sql.NVarChar(50), tipo)
    .input('anio', sql.Int, anio)
    .input('createdAt', sql.DateTime2, createdAt)
    .query(`
      INSERT INTO dbo.EventoCalendario (fecha, tipo, anio, createdAt)
      OUTPUT
        INSERTED.id,
        CONVERT(VARCHAR(10), INSERTED.fecha, 23) as fecha,
        INSERTED.tipo,
        INSERTED.anio,
        INSERTED.createdAt
      VALUES (@fecha, @tipo, @anio, @createdAt)
    `);
  const row = r.recordset[0];
  return {
    id: row.id,
    fecha: row.fecha,
    tipo: row.tipo,
    anio: row.anio,
    createdAt: row.createdAt.toISOString()
  };
}

export async function updateEventoCalendario(id: number, fecha?: string, tipo?: string, anio?: number, createdAt?: string, tx?: sqlType.Transaction) {
  if (!id || id <= 0) {
    throw new Error('EVENTO_CALENDARIO_INVALID_ID');
  }

  if (tipo) {
    const validTipos = ['ARCHIVO_APLICACION', 'ASUETO', 'ALTA_BAJA_CAMBIO', 'PAGO', 'HIPOTECARIO'];
    if (!validTipos.includes(tipo)) {
      throw new Error('EVENTO_CALENDARIO_INVALID_TIPO');
    }
  }

  if (anio && (anio < 1900 || anio > 2100)) {
    throw new Error('EVENTO_CALENDARIO_INVALID_ANIO');
  }

  if (fecha) {
    const fechaDate = new Date(fecha);
    if (isNaN(fechaDate.getTime())) {
      throw new Error('EVENTO_CALENDARIO_INVALID_FECHA');
    }
  }

  const req = tx ? new sqlType.Request(tx) : (await getPool()).request();
  const r = await req
    .input('id', sql.Int, id)
    .input('fecha', sql.Date, fecha ?? null)
    .input('tipo', sql.NVarChar(50), tipo ?? null)
    .input('anio', sql.Int, anio ?? null)
    .input('createdAt', sql.DateTime2, createdAt ?? null)
    .query(`
      UPDATE dbo.EventoCalendario
      SET fecha = @fecha,
          tipo = @tipo,
          anio = @anio,
          createdAt = @createdAt
      OUTPUT
        INSERTED.id,
        CONVERT(VARCHAR(10), INSERTED.fecha, 23) as fecha,
        INSERTED.tipo,
        INSERTED.anio,
        INSERTED.createdAt
      WHERE id = @id
    `);
  const row = r.recordset[0];
  if (!row) return undefined;
  return {
    id: row.id,
    fecha: row.fecha,
    tipo: row.tipo,
    anio: row.anio,
    createdAt: row.createdAt.toISOString()
  };
}

export async function deleteEventoCalendario(id: number, tx?: sqlType.Transaction) {
  if (!id || id <= 0) {
    throw new Error('EVENTO_CALENDARIO_INVALID_ID');
  }

  const req = tx ? new sqlType.Request(tx) : (await getPool()).request();
  const r = await req
    .input('id', sql.Int, id)
    .query(`
      DELETE FROM dbo.EventoCalendario
      OUTPUT DELETED.id
      WHERE id = @id
    `);
  return r.recordset[0]?.id;
}