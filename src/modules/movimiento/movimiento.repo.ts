import { getPool, sql } from '../../db/mssql.js';

export type Movimiento = {
  id: number;
  quincenaId: string | null;
  tipoMovimientoId: number;
  afiliadoId: number;
  fecha: string | null;
  observaciones: string | null;
  folio: string | null;
  estatus: string | null;
  creadoPor: number | null;
  createdAt: string;
};

export async function getAllMovimientos(): Promise<Movimiento[]> {
  const p = await getPool();
  const r = await p.request()
    .query(`
      SELECT
        id, quincenaId, tipoMovimientoId, afiliadoId, fecha,
        observaciones, folio, estatus, creadoPor, createdAt
      FROM afi.Movimiento
      ORDER BY id
    `);
  return r.recordset.map((row: any) => ({
    id: row.id,
    quincenaId: row.quincenaId,
    tipoMovimientoId: row.tipoMovimientoId,
    afiliadoId: row.afiliadoId,
    fecha: row.fecha?.toISOString().split('T')[0] || null,
    observaciones: row.observaciones,
    folio: row.folio,
    estatus: row.estatus,
    creadoPor: row.creadoPor,
    createdAt: row.createdAt?.toISOString() || new Date().toISOString()
  }));
}

export async function getMovimientoById(id: number): Promise<Movimiento | undefined> {
  const p = await getPool();
  const r = await p.request()
    .input('id', sql.Int, id)
    .query(`
      SELECT
        id, quincenaId, tipoMovimientoId, afiliadoId, fecha,
        observaciones, folio, estatus, creadoPor, createdAt
      FROM afi.Movimiento
      WHERE id = @id
    `);
  const row = r.recordset[0];
  if (!row) return undefined;
  return {
    id: row.id,
    quincenaId: row.quincenaId,
    tipoMovimientoId: row.tipoMovimientoId,
    afiliadoId: row.afiliadoId,
    fecha: row.fecha?.toISOString().split('T')[0] || null,
    observaciones: row.observaciones,
    folio: row.folio,
    estatus: row.estatus,
    creadoPor: row.creadoPor,
    createdAt: row.createdAt?.toISOString() || new Date().toISOString()
  };
}

export async function getMovimientosByAfiliadoId(afiliadoId: number): Promise<Movimiento[]> {
  const p = await getPool();
  const r = await p.request()
    .input('afiliadoId', sql.Int, afiliadoId)
    .query(`
      SELECT
        id, quincenaId, tipoMovimientoId, afiliadoId, fecha,
        observaciones, folio, estatus, creadoPor, createdAt
      FROM afi.Movimiento
      WHERE afiliadoId = @afiliadoId
      ORDER BY id
    `);
  return r.recordset.map((row: any) => ({
    id: row.id,
    quincenaId: row.quincenaId,
    tipoMovimientoId: row.tipoMovimientoId,
    afiliadoId: row.afiliadoId,
    fecha: row.fecha?.toISOString().split('T')[0] || null,
    observaciones: row.observaciones,
    folio: row.folio,
    estatus: row.estatus,
    creadoPor: row.creadoPor,
    createdAt: row.createdAt?.toISOString() || new Date().toISOString()
  }));
}

export async function getMovimientosByTipoMovimientoId(tipoMovimientoId: number): Promise<Movimiento[]> {
  const p = await getPool();
  const r = await p.request()
    .input('tipoMovimientoId', sql.Int, tipoMovimientoId)
    .query(`
      SELECT
        id, quincenaId, tipoMovimientoId, afiliadoId, fecha,
        observaciones, folio, estatus, creadoPor, createdAt
      FROM afi.Movimiento
      WHERE tipoMovimientoId = @tipoMovimientoId
      ORDER BY id
    `);
  return r.recordset.map((row: any) => ({
    id: row.id,
    quincenaId: row.quincenaId,
    tipoMovimientoId: row.tipoMovimientoId,
    afiliadoId: row.afiliadoId,
    fecha: row.fecha?.toISOString().split('T')[0] || null,
    observaciones: row.observaciones,
    folio: row.folio,
    estatus: row.estatus,
    creadoPor: row.creadoPor,
    createdAt: row.createdAt?.toISOString() || new Date().toISOString()
  }));
}

export async function createMovimiento(data: Omit<Movimiento, 'id' | 'createdAt'>): Promise<Movimiento> {
  const p = await getPool();
  const r = await p.request()
    .input('quincenaId', sql.VarChar(30), data.quincenaId)
    .input('tipoMovimientoId', sql.Int, data.tipoMovimientoId)
    .input('afiliadoId', sql.Int, data.afiliadoId)
    .input('fecha', sql.Date, data.fecha ? new Date(data.fecha) : null)
    .input('observaciones', sql.NVarChar(1024), data.observaciones)
    .input('folio', sql.VarChar(100), data.folio)
    .input('estatus', sql.VarChar(30), data.estatus)
    .input('creadoPor', sql.Int, data.creadoPor)
    .query(`
      INSERT INTO afi.Movimiento (
        quincenaId, tipoMovimientoId, afiliadoId, fecha,
        observaciones, folio, estatus, creadoPor
      )
      OUTPUT INSERTED.*
      VALUES (
        @quincenaId, @tipoMovimientoId, @afiliadoId, @fecha,
        @observaciones, @folio, @estatus, @creadoPor
      )
    `);
  const row = r.recordset[0];
  return {
    id: row.id,
    quincenaId: row.quincenaId,
    tipoMovimientoId: row.tipoMovimientoId,
    afiliadoId: row.afiliadoId,
    fecha: row.fecha?.toISOString().split('T')[0] || null,
    observaciones: row.observaciones,
    folio: row.folio,
    estatus: row.estatus,
    creadoPor: row.creadoPor,
    createdAt: row.createdAt?.toISOString() || new Date().toISOString()
  };
}

export async function updateMovimiento(id: number, data: Partial<Omit<Movimiento, 'id' | 'createdAt'>>): Promise<Movimiento> {
  const p = await getPool();
  const updates: string[] = [];
  const request = p.request().input('id', sql.Int, id);

  if (data.quincenaId !== undefined) {
    updates.push('quincenaId = @quincenaId');
    request.input('quincenaId', sql.VarChar(30), data.quincenaId);
  }
  if (data.tipoMovimientoId !== undefined) {
    updates.push('tipoMovimientoId = @tipoMovimientoId');
    request.input('tipoMovimientoId', sql.Int, data.tipoMovimientoId);
  }
  if (data.afiliadoId !== undefined) {
    updates.push('afiliadoId = @afiliadoId');
    request.input('afiliadoId', sql.Int, data.afiliadoId);
  }
  if (data.fecha !== undefined) {
    updates.push('fecha = @fecha');
    request.input('fecha', sql.Date, data.fecha ? new Date(data.fecha) : null);
  }
  if (data.observaciones !== undefined) {
    updates.push('observaciones = @observaciones');
    request.input('observaciones', sql.NVarChar(1024), data.observaciones);
  }
  if (data.folio !== undefined) {
    updates.push('folio = @folio');
    request.input('folio', sql.VarChar(100), data.folio);
  }
  if (data.estatus !== undefined) {
    updates.push('estatus = @estatus');
    request.input('estatus', sql.VarChar(30), data.estatus);
  }
  if (data.creadoPor !== undefined) {
    updates.push('creadoPor = @creadoPor');
    request.input('creadoPor', sql.Int, data.creadoPor);
  }

  const updateQuery = `
    UPDATE afi.Movimiento
    SET ${updates.join(', ')}
    OUTPUT INSERTED.*
    WHERE id = @id
  `;

  const r = await request.query(updateQuery);
  const row = r.recordset[0];
  if (!row) throw new Error('MOVIMIENTO_NOT_FOUND');
  return {
    id: row.id,
    quincenaId: row.quincenaId,
    tipoMovimientoId: row.tipoMovimientoId,
    afiliadoId: row.afiliadoId,
    fecha: row.fecha?.toISOString().split('T')[0] || null,
    observaciones: row.observaciones,
    folio: row.folio,
    estatus: row.estatus,
    creadoPor: row.creadoPor,
    createdAt: row.createdAt?.toISOString() || new Date().toISOString()
  };
}

export async function deleteMovimiento(id: number): Promise<void> {
  const p = await getPool();
  const r = await p.request()
    .input('id', sql.Int, id)
    .query(`
      DELETE FROM afi.Movimiento
      WHERE id = @id
      SELECT @@ROWCOUNT as deletedCount
    `);
  if (r.recordset[0].deletedCount === 0) {
    throw new Error('MOVIMIENTO_NOT_FOUND');
  }
}