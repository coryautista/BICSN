import { getPool, sql } from '../../db/mssql.js';
import { sql as sqlType } from '../../db/context.js';

export async function findEstadoById(estadoId: string) {
  if (!estadoId || typeof estadoId !== 'string' || estadoId.length !== 2) {
    throw new Error('Invalid estadoId: must be a 2-character string');
  }
  const p = await getPool();
  const r = await p.request()
    .input('estadoId', sql.Char(2), estadoId)
    .query(`
      SELECT
        EstadoID,
        NombreEstado,
        EsValido,
        createdAt,
        updatedAt,
        createdBy,
        updatedBy
      FROM geo.Estados
      WHERE EstadoID = @estadoId
    `);
  const row = r.recordset[0];
  if (!row) return undefined;
  return {
    estadoId: row.EstadoID,
    nombreEstado: row.NombreEstado,
    esValido: row.EsValido,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy
  };
}

export async function listEstados() {
  const p = await getPool();
  const r = await p.request().query(`
    SELECT
      EstadoID,
      NombreEstado,
      EsValido,
      createdAt,
      updatedAt,
      createdBy,
      updatedBy
    FROM geo.Estados
    ORDER BY NombreEstado ASC
  `);
  return r.recordset.map((row: any) => ({
    estadoId: row.EstadoID,
    nombreEstado: row.NombreEstado,
    esValido: row.EsValido,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy
  }));
}

export async function createEstado(estadoId: string, nombreEstado: string, esValido: boolean, userId?: string, tx?: sqlType.Transaction) {
  if (!estadoId || typeof estadoId !== 'string' || estadoId.length !== 2) {
    throw new Error('Invalid estadoId: must be a 2-character string');
  }
  if (!nombreEstado || typeof nombreEstado !== 'string' || nombreEstado.trim().length === 0 || nombreEstado.length > 50) {
    throw new Error('Invalid nombreEstado: must be a non-empty string with max 50 characters');
  }
  if (typeof esValido !== 'boolean') {
    throw new Error('Invalid esValido: must be a boolean');
  }
  const req = tx ? new sqlType.Request(tx) : (await getPool()).request();
  const r = await req
    .input('estadoId', sql.Char(2), estadoId)
    .input('nombreEstado', sql.VarChar(50), nombreEstado)
    .input('esValido', sql.Bit, esValido)
    .input('createdBy', sql.VarChar(128), userId ?? null)
    .input('updatedBy', sql.VarChar(128), userId ?? null)
    .query(`
      INSERT INTO geo.Estados (EstadoID, NombreEstado, EsValido, createdBy, updatedBy)
      OUTPUT
        INSERTED.EstadoID,
        INSERTED.NombreEstado,
        INSERTED.EsValido,
        INSERTED.createdAt,
        INSERTED.updatedAt,
        INSERTED.createdBy,
        INSERTED.updatedBy
      VALUES (@estadoId, @nombreEstado, @esValido, @createdBy, @updatedBy)
    `);
  const row = r.recordset[0];
  return {
    estadoId: row.EstadoID,
    nombreEstado: row.NombreEstado,
    esValido: row.EsValido,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy
  };
}

export async function updateEstado(estadoId: string, nombreEstado?: string, esValido?: boolean, userId?: string, tx?: sqlType.Transaction) {
  if (!estadoId || typeof estadoId !== 'string' || estadoId.length !== 2) {
    throw new Error('Invalid estadoId: must be a 2-character string');
  }
  if (nombreEstado !== undefined && (!nombreEstado || typeof nombreEstado !== 'string' || nombreEstado.trim().length === 0 || nombreEstado.length > 50)) {
    throw new Error('Invalid nombreEstado: must be a non-empty string with max 50 characters');
  }
  if (esValido !== undefined && typeof esValido !== 'boolean') {
    throw new Error('Invalid esValido: must be a boolean');
  }
  const req = tx ? new sqlType.Request(tx) : (await getPool()).request();
  const r = await req
    .input('estadoId', sql.Char(2), estadoId)
    .input('nombreEstado', sql.VarChar(50), nombreEstado ?? null)
    .input('esValido', sql.Bit, esValido ?? null)
    .input('updatedBy', sql.VarChar(128), userId ?? null)
    .query(`
      UPDATE geo.Estados
      SET NombreEstado = @nombreEstado,
           EsValido = @esValido,
           updatedAt = SYSUTCDATETIME(),
           updatedBy = @updatedBy
      OUTPUT
        INSERTED.EstadoID,
        INSERTED.NombreEstado,
        INSERTED.EsValido,
        INSERTED.createdAt,
        INSERTED.updatedAt,
        INSERTED.createdBy,
        INSERTED.updatedBy
      WHERE EstadoID = @estadoId
    `);
  const row = r.recordset[0];
  if (!row) return undefined;
  return {
    estadoId: row.EstadoID,
    nombreEstado: row.NombreEstado,
    esValido: row.EsValido,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy
  };
}

export async function deleteEstado(estadoId: string, tx?: sqlType.Transaction) {
  if (!estadoId || typeof estadoId !== 'string' || estadoId.length !== 2) {
    throw new Error('Invalid estadoId: must be a 2-character string');
  }
  const req = tx ? new sqlType.Request(tx) : (await getPool()).request();
  const r = await req
    .input('estadoId', sql.Char(2), estadoId)
    .query(`
      DELETE FROM geo.Estados
      OUTPUT DELETED.EstadoID
      WHERE EstadoID = @estadoId
    `);
  return r.recordset[0]?.EstadoID;
}