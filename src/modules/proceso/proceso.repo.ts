import { getPool, sql } from '../../db/mssql.js';
import { sql as sqlType } from '../../db/context.js';

export async function findProcesoById(id: number) {
  if (!id || id <= 0 || !Number.isInteger(id)) {
    throw new Error('Invalid id: must be a positive integer');
  }
  const p = await getPool();
  const r = await p.request()
    .input('id', sql.Int, id)
    .query(`
      SELECT
        id,
        nombre,
        componente,
        idModulo,
        orden,
        tipo
      FROM dbo.Proceso
      WHERE id = @id
    `);
  const row = r.recordset[0];
  if (!row) return undefined;
  return {
    id: row.id,
    nombre: row.nombre,
    componente: row.componente,
    idModulo: row.idModulo,
    orden: row.orden,
    tipo: row.tipo
  };
}

export async function listProcesos() {
  const p = await getPool();
  const r = await p.request().query(`
    SELECT
      id,
      nombre,
      componente,
      idModulo,
      orden,
      tipo
    FROM dbo.Proceso
    ORDER BY orden ASC, nombre ASC
  `);
  return r.recordset.map((row: any) => ({
    id: row.id,
    nombre: row.nombre,
    componente: row.componente,
    idModulo: row.idModulo,
    orden: row.orden,
    tipo: row.tipo
  }));
}

export async function createProceso(nombre: string, componente: string, idModulo: number, orden: number, tipo: string, tx?: sqlType.Transaction) {
  if (!nombre || typeof nombre !== 'string' || nombre.trim().length === 0 || nombre.length > 4000) {
    throw new Error('Invalid nombre: must be a non-empty string with max 4000 characters');
  }
  if (!componente || typeof componente !== 'string' || componente.length > 4000) {
    throw new Error('Invalid componente: must be a string with max 4000 characters');
  }
  if (!idModulo || idModulo <= 0 || !Number.isInteger(idModulo)) {
    throw new Error('Invalid idModulo: must be a positive integer');
  }
  if (orden === undefined || orden < 0 || !Number.isInteger(orden)) {
    throw new Error('Invalid orden: must be a non-negative integer');
  }
  if (!tipo || typeof tipo !== 'string' || tipo.trim().length === 0 || tipo.length > 50) {
    throw new Error('Invalid tipo: must be a non-empty string with max 50 characters');
  }
  const req = tx ? new sqlType.Request(tx) : (await getPool()).request();
  const r = await req
    .input('nombre', sql.NVarChar(4000), nombre)
    .input('componente', sql.NVarChar(4000), componente)
    .input('idModulo', sql.Int, idModulo)
    .input('orden', sql.Int, orden)
    .input('tipo', sql.NVarChar(50), tipo)
    .query(`
      INSERT INTO dbo.Proceso (nombre, componente, idModulo, orden, tipo)
      OUTPUT
        INSERTED.id,
        INSERTED.nombre,
        INSERTED.componente,
        INSERTED.idModulo,
        INSERTED.orden,
        INSERTED.tipo
      VALUES (@nombre, @componente, @idModulo, @orden, @tipo)
    `);
  const row = r.recordset[0];
  return {
    id: row.id,
    nombre: row.nombre,
    componente: row.componente,
    idModulo: row.idModulo,
    orden: row.orden,
    tipo: row.tipo
  };
}

export async function updateProceso(id: number, nombre?: string, componente?: string, idModulo?: number, orden?: number, tipo?: string, tx?: sqlType.Transaction) {
  if (!id || id <= 0 || !Number.isInteger(id)) {
    throw new Error('Invalid id: must be a positive integer');
  }
  if (nombre !== undefined && (!nombre || typeof nombre !== 'string' || nombre.trim().length === 0 || nombre.length > 4000)) {
    throw new Error('Invalid nombre: must be a non-empty string with max 4000 characters');
  }
  if (componente !== undefined && (!componente || typeof componente !== 'string' || componente.length > 4000)) {
    throw new Error('Invalid componente: must be a string with max 4000 characters');
  }
  if (idModulo !== undefined && (!idModulo || idModulo <= 0 || !Number.isInteger(idModulo))) {
    throw new Error('Invalid idModulo: must be a positive integer');
  }
  if (orden !== undefined && (orden < 0 || !Number.isInteger(orden))) {
    throw new Error('Invalid orden: must be a non-negative integer');
  }
  if (tipo !== undefined && (!tipo || typeof tipo !== 'string' || tipo.trim().length === 0 || tipo.length > 50)) {
    throw new Error('Invalid tipo: must be a non-empty string with max 50 characters');
  }
  const req = tx ? new sqlType.Request(tx) : (await getPool()).request();
  const r = await req
    .input('id', sql.Int, id)
    .input('nombre', sql.NVarChar(4000), nombre ?? null)
    .input('componente', sql.NVarChar(4000), componente ?? null)
    .input('idModulo', sql.Int, idModulo ?? null)
    .input('orden', sql.Int, orden ?? null)
    .input('tipo', sql.NVarChar(50), tipo ?? null)
    .query(`
      UPDATE dbo.Proceso
      SET nombre = @nombre,
          componente = @componente,
          idModulo = @idModulo,
          orden = @orden,
          tipo = @tipo
      OUTPUT
        INSERTED.id,
        INSERTED.nombre,
        INSERTED.componente,
        INSERTED.idModulo,
        INSERTED.orden,
        INSERTED.tipo
      WHERE id = @id
    `);
  const row = r.recordset[0];
  if (!row) return undefined;
  return {
    id: row.id,
    nombre: row.nombre,
    componente: row.componente,
    idModulo: row.idModulo,
    orden: row.orden,
    tipo: row.tipo
  };
}

export async function deleteProceso(id: number, tx?: sqlType.Transaction) {
  if (!id || id <= 0 || !Number.isInteger(id)) {
    throw new Error('Invalid id: must be a positive integer');
  }
  const req = tx ? new sqlType.Request(tx) : (await getPool()).request();
  const r = await req
    .input('id', sql.Int, id)
    .query(`
      DELETE FROM dbo.Proceso
      OUTPUT DELETED.id
      WHERE id = @id
    `);
  return r.recordset[0]?.id;
}