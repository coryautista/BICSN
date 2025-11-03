import { getPool, sql } from '../../db/mssql.js';
import { sql as sqlType } from '../../db/context.js';

export async function findCodigoPostalById(codigoPostalId: number) {
  if (!codigoPostalId || typeof codigoPostalId !== 'number' || codigoPostalId <= 0) {
    throw new Error('Invalid codigoPostalId: must be a positive number');
  }
  const p = await getPool();
  const r = await p.request()
    .input('codigoPostalId', sql.Int, codigoPostalId)
    .query(`
      SELECT
        CodigoPostalID,
        CodigoPostal,
        EsValido,
        createdAt,
        updatedAt,
        createdBy,
        updatedBy
      FROM geo.CodigosPostales
      WHERE CodigoPostalID = @codigoPostalId
    `);
  const row = r.recordset[0];
  if (!row) return undefined;
  return {
    codigoPostalId: row.CodigoPostalID,
    codigoPostal: row.CodigoPostal,
    esValido: row.EsValido,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy
  };
}

export async function findCodigoPostalByCode(codigoPostal: string) {
  if (!codigoPostal || typeof codigoPostal !== 'string' || codigoPostal.length !== 5) {
    throw new Error('Invalid codigoPostal: must be a 5-character string');
  }
  const p = await getPool();
  const r = await p.request()
    .input('codigoPostal', sql.Char(5), codigoPostal)
    .query(`
      SELECT
        CodigoPostalID,
        CodigoPostal,
        EsValido,
        createdAt,
        updatedAt,
        createdBy,
        updatedBy
      FROM geo.CodigosPostales
      WHERE CodigoPostal = @codigoPostal
    `);
  const row = r.recordset[0];
  if (!row) return undefined;
  return {
    codigoPostalId: row.CodigoPostalID,
    codigoPostal: row.CodigoPostal,
    esValido: row.EsValido,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy
  };
}

export async function listCodigosPostales() {
  const p = await getPool();
  const r = await p.request().query(`
    SELECT
      CodigoPostalID,
      CodigoPostal,
      EsValido,
      createdAt,
      updatedAt,
      createdBy,
      updatedBy
    FROM geo.CodigosPostales
    ORDER BY CodigoPostal ASC
  `);
  return r.recordset.map((row: any) => ({
    codigoPostalId: row.CodigoPostalID,
    codigoPostal: row.CodigoPostal,
    esValido: row.EsValido,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy
  }));
}

export async function createCodigoPostal(codigoPostal: string, esValido: boolean, userId?: string, tx?: sqlType.Transaction) {
  if (!codigoPostal || typeof codigoPostal !== 'string' || codigoPostal.length !== 5) {
    throw new Error('Invalid codigoPostal: must be a 5-character string');
  }
  if (typeof esValido !== 'boolean') {
    throw new Error('Invalid esValido: must be a boolean');
  }
  const req = tx ? new sqlType.Request(tx) : (await getPool()).request();
  
  // First, insert the record
  await req
    .input('codigoPostal', sql.Char(5), codigoPostal)
    .input('esValido', sql.Bit, esValido)
    .input('createdBy', sql.VarChar(128), userId ?? null)
    .input('updatedBy', sql.VarChar(128), userId ?? null)
    .query(`
      INSERT INTO geo.CodigosPostales (CodigoPostal, EsValido, createdBy, updatedBy)
      VALUES (@codigoPostal, @esValido, @createdBy, @updatedBy)
    `);

  // Retrieve the inserted record by the unique CodigoPostal value
  const selectReq = tx ? new sqlType.Request(tx) : (await getPool()).request();
  const r = await selectReq
    .input('codigoPostal', sql.Char(5), codigoPostal)
    .query(`
      SELECT
        CodigoPostalID,
        CodigoPostal,
        EsValido,
        createdAt,
        updatedAt,
        createdBy,
        updatedBy
      FROM geo.CodigosPostales
      WHERE CodigoPostal = @codigoPostal
    `);
  const row = r.recordset?.[0];
  if (!row) {
    throw new Error('Failed to retrieve inserted codigo postal');
  }
  return {
    codigoPostalId: row.CodigoPostalID,
    codigoPostal: row.CodigoPostal,
    esValido: row.EsValido,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy
  };
}

export async function updateCodigoPostal(codigoPostalId: number, esValido?: boolean, userId?: string, tx?: sqlType.Transaction) {
  if (!codigoPostalId || typeof codigoPostalId !== 'number' || codigoPostalId <= 0) {
    throw new Error('Invalid codigoPostalId: must be a positive number');
  }
  if (esValido !== undefined && typeof esValido !== 'boolean') {
    throw new Error('Invalid esValido: must be a boolean');
  }
  const req = tx ? new sqlType.Request(tx) : (await getPool()).request();
  const updateResult = await req
    .input('codigoPostalId', sql.Int, codigoPostalId)
    .input('esValido', sql.Bit, esValido ?? null)
    .input('updatedBy', sql.VarChar(128), userId ?? null)
    .query(`
      UPDATE geo.CodigosPostales
      SET EsValido = @esValido,
          updatedAt = SYSUTCDATETIME(),
          updatedBy = @updatedBy
      WHERE CodigoPostalID = @codigoPostalId
    `);

  // Check if update affected any rows
  if (updateResult.rowsAffected && updateResult.rowsAffected[0] === 0) {
    return undefined;
  }

  // Retrieve the updated record
  const selectReq = tx ? new sqlType.Request(tx) : (await getPool()).request();
  const r = await selectReq
    .input('codigoPostalId', sql.Int, codigoPostalId)
    .query(`
      SELECT
        CodigoPostalID,
        CodigoPostal,
        EsValido,
        createdAt,
        updatedAt,
        createdBy,
        updatedBy
      FROM geo.CodigosPostales
      WHERE CodigoPostalID = @codigoPostalId
    `);
  const row = r.recordset[0];
  if (!row) return undefined;
  return {
    codigoPostalId: row.CodigoPostalID,
    codigoPostal: row.CodigoPostal,
    esValido: row.EsValido,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy
  };
}

export async function deleteCodigoPostal(codigoPostalId: number, tx?: sqlType.Transaction) {
  if (!codigoPostalId || typeof codigoPostalId !== 'number' || codigoPostalId <= 0) {
    throw new Error('Invalid codigoPostalId: must be a positive number');
  }
  const req = tx ? new sqlType.Request(tx) : (await getPool()).request();
  const r = await req
    .input('codigoPostalId', sql.Int, codigoPostalId)
    .query(`
      DELETE FROM geo.CodigosPostales
      OUTPUT DELETED.CodigoPostalID
      WHERE CodigoPostalID = @codigoPostalId
    `);
  return r.recordset[0]?.CodigoPostalID;
}