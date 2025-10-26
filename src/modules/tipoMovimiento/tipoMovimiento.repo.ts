import { getPool, sql } from '../../db/mssql.js';

export type TipoMovimiento = {
  id: number;
  abreviatura: string | null;
  nombre: string;
};

export async function getAllTipoMovimiento(): Promise<TipoMovimiento[]> {
  const p = await getPool();
  const r = await p.request()
    .query(`
      SELECT
        id,
        abreviatura,
        nombre
      FROM afi.TipoMovimiento
      ORDER BY id
    `);
  return r.recordset.map((row: any) => ({
    id: row.id,
    abreviatura: row.abreviatura,
    nombre: row.nombre
  }));
}

export async function getTipoMovimientoById(id: number): Promise<TipoMovimiento | undefined> {
  const p = await getPool();
  const r = await p.request()
    .input('id', sql.Int, id)
    .query(`
      SELECT
        id,
        abreviatura,
        nombre
      FROM afi.TipoMovimiento
      WHERE id = @id
    `);
  const row = r.recordset[0];
  if (!row) return undefined;
  return {
    id: row.id,
    abreviatura: row.abreviatura,
    nombre: row.nombre
  };
}

export async function createTipoMovimiento(data: Omit<TipoMovimiento, 'id'> & { id: number }): Promise<TipoMovimiento> {
  const p = await getPool();
  const r = await p.request()
    .input('id', sql.Int, data.id)
    .input('abreviatura', sql.Char(1), data.abreviatura)
    .input('nombre', sql.NVarChar(64), data.nombre)
    .query(`
      INSERT INTO afi.TipoMovimiento (id, abreviatura, nombre)
      VALUES (@id, @abreviatura, @nombre)
      SELECT
        id,
        abreviatura,
        nombre
      FROM afi.TipoMovimiento
      WHERE id = @id
    `);
  const row = r.recordset[0];
  return {
    id: row.id,
    abreviatura: row.abreviatura,
    nombre: row.nombre
  };
}

export async function updateTipoMovimiento(id: number, data: Partial<Omit<TipoMovimiento, 'id'>>): Promise<TipoMovimiento> {
  const p = await getPool();
  const updates: string[] = [];
  const request = p.request().input('id', sql.Int, id);

  if (data.abreviatura !== undefined) {
    updates.push('abreviatura = @abreviatura');
    request.input('abreviatura', sql.Char(1), data.abreviatura);
  }
  if (data.nombre !== undefined) {
    updates.push('nombre = @nombre');
    request.input('nombre', sql.NVarChar(64), data.nombre);
  }

  const updateQuery = `
    UPDATE afi.TipoMovimiento
    SET ${updates.join(', ')}
    WHERE id = @id
    SELECT
      id,
      abreviatura,
      nombre
    FROM afi.TipoMovimiento
    WHERE id = @id
  `;

  const r = await request.query(updateQuery);
  const row = r.recordset[0];
  if (!row) throw new Error('TIPO_MOVIMIENTO_NOT_FOUND');
  return {
    id: row.id,
    abreviatura: row.abreviatura,
    nombre: row.nombre
  };
}

export async function deleteTipoMovimiento(id: number): Promise<void> {
  const p = await getPool();
  const r = await p.request()
    .input('id', sql.Int, id)
    .query(`
      DELETE FROM afi.TipoMovimiento
      WHERE id = @id
      SELECT @@ROWCOUNT as deletedCount
    `);
  if (r.recordset[0].deletedCount === 0) {
    throw new Error('TIPO_MOVIMIENTO_NOT_FOUND');
  }
}