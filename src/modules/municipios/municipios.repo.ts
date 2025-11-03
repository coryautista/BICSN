import { getPool, sql } from '../../db/mssql.js';
import { sql as sqlType } from '../../db/context.js';

export async function findMunicipioById(municipioId: number) {
  if (!municipioId || typeof municipioId !== 'number' || municipioId <= 0) {
    throw new Error('Invalid municipioId: must be a positive number');
  }
  const p = await getPool();
  const r = await p.request()
    .input('municipioId', sql.Int, municipioId)
    .query(`
      SELECT
        MunicipioID,
        EstadoID,
        ClaveMunicipio,
        NombreMunicipio,
        EsValido,
        createdAt,
        updatedAt,
        createdBy,
        updatedBy
      FROM geo.Municipios
      WHERE MunicipioID = @municipioId
    `);
  const row = r.recordset[0];
  if (!row) return undefined;
  return {
    municipioId: row.MunicipioID,
    estadoId: row.EstadoID,
    claveMunicipio: row.ClaveMunicipio,
    nombreMunicipio: row.NombreMunicipio,
    esValido: row.EsValido,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy
  };
}

export async function listMunicipiosByEstado(estadoId: string) {
  if (!estadoId || typeof estadoId !== 'string' || estadoId.length !== 2) {
    throw new Error('Invalid estadoId: must be a 2-character string');
  }
  const p = await getPool();
  const r = await p.request()
    .input('estadoId', sql.Char(2), estadoId)
    .query(`
      SELECT
        MunicipioID,
        EstadoID,
        ClaveMunicipio,
        NombreMunicipio,
        EsValido,
        createdAt,
        updatedAt,
        createdBy,
        updatedBy
      FROM geo.Municipios
      WHERE EstadoID = @estadoId
      ORDER BY NombreMunicipio ASC
    `);
  return r.recordset.map((row: any) => ({
    municipioId: row.MunicipioID,
    estadoId: row.EstadoID,
    claveMunicipio: row.ClaveMunicipio,
    nombreMunicipio: row.NombreMunicipio,
    esValido: row.EsValido,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy
  }));
}

export async function listAllMunicipios() {
  const p = await getPool();
  const r = await p.request().query(`
    SELECT
      MunicipioID,
      EstadoID,
      ClaveMunicipio,
      NombreMunicipio,
      EsValido,
      createdAt,
      updatedAt,
      createdBy,
      updatedBy
    FROM geo.Municipios
    ORDER BY EstadoID ASC, NombreMunicipio ASC
  `);
  return r.recordset.map((row: any) => ({
    municipioId: row.MunicipioID,
    estadoId: row.EstadoID,
    claveMunicipio: row.ClaveMunicipio,
    nombreMunicipio: row.NombreMunicipio,
    esValido: row.EsValido,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy
  }));
}

export async function createMunicipio(estadoId: string, claveMunicipio: string, nombreMunicipio: string, esValido: boolean, userId?: string, tx?: sqlType.Transaction) {
  if (!estadoId || typeof estadoId !== 'string' || estadoId.length !== 2) {
    throw new Error('Invalid estadoId: must be a 2-character string');
  }
  if (!claveMunicipio || typeof claveMunicipio !== 'string' || claveMunicipio.length !== 3) {
    throw new Error('Invalid claveMunicipio: must be a 3-character string');
  }
  if (!nombreMunicipio || typeof nombreMunicipio !== 'string' || nombreMunicipio.trim().length === 0 || nombreMunicipio.length > 100) {
    throw new Error('Invalid nombreMunicipio: must be a non-empty string with max 100 characters');
  }
  if (typeof esValido !== 'boolean') {
    throw new Error('Invalid esValido: must be a boolean');
  }
  const req = tx ? new sqlType.Request(tx) : (await getPool()).request();
  
  // First, insert the record
  await req
    .input('estadoId', sql.Char(2), estadoId)
    .input('claveMunicipio', sql.Char(3), claveMunicipio)
    .input('nombreMunicipio', sql.VarChar(100), nombreMunicipio)
    .input('esValido', sql.Bit, esValido)
    .input('createdBy', sql.VarChar(128), userId ?? null)
    .input('updatedBy', sql.VarChar(128), userId ?? null)
    .query(`
      INSERT INTO geo.Municipios (EstadoID, ClaveMunicipio, NombreMunicipio, EsValido, createdBy, updatedBy)
      VALUES (@estadoId, @claveMunicipio, @nombreMunicipio, @esValido, @createdBy, @updatedBy)
    `);

  // Retrieve the inserted record by the unique combination (EstadoID, ClaveMunicipio)
  const selectReq = tx ? new sqlType.Request(tx) : (await getPool()).request();
  const r = await selectReq
    .input('estadoId', sql.Char(2), estadoId)
    .input('claveMunicipio', sql.Char(3), claveMunicipio)
    .query(`
      SELECT
        MunicipioID,
        EstadoID,
        ClaveMunicipio,
        NombreMunicipio,
        EsValido,
        createdAt,
        updatedAt,
        createdBy,
        updatedBy
      FROM geo.Municipios
      WHERE EstadoID = @estadoId AND ClaveMunicipio = @claveMunicipio
    `);
  const row = r.recordset?.[0];
  if (!row) {
    throw new Error('Failed to retrieve inserted municipio');
  }
  return {
    municipioId: row.MunicipioID,
    estadoId: row.EstadoID,
    claveMunicipio: row.ClaveMunicipio,
    nombreMunicipio: row.NombreMunicipio,
    esValido: row.EsValido,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy
  };
}

export async function updateMunicipio(municipioId: number, nombreMunicipio?: string, esValido?: boolean, userId?: string, tx?: sqlType.Transaction) {
  if (!municipioId || typeof municipioId !== 'number' || municipioId <= 0) {
    throw new Error('Invalid municipioId: must be a positive number');
  }
  if (nombreMunicipio !== undefined && (!nombreMunicipio || typeof nombreMunicipio !== 'string' || nombreMunicipio.trim().length === 0 || nombreMunicipio.length > 100)) {
    throw new Error('Invalid nombreMunicipio: must be a non-empty string with max 100 characters');
  }
  if (esValido !== undefined && typeof esValido !== 'boolean') {
    throw new Error('Invalid esValido: must be a boolean');
  }
  const req = tx ? new sqlType.Request(tx) : (await getPool()).request();
  const updateResult = await req
    .input('municipioId', sql.Int, municipioId)
    .input('nombreMunicipio', sql.VarChar(100), nombreMunicipio ?? null)
    .input('esValido', sql.Bit, esValido ?? null)
    .input('updatedBy', sql.VarChar(128), userId ?? null)
    .query(`
      UPDATE geo.Municipios
      SET NombreMunicipio = @nombreMunicipio,
            EsValido = @esValido,
            updatedAt = SYSUTCDATETIME(),
            updatedBy = @updatedBy
      WHERE MunicipioID = @municipioId
    `);

  // Check if update affected any rows
  if (updateResult.rowsAffected && updateResult.rowsAffected[0] === 0) {
    return undefined;
  }

  // Retrieve the updated record
  const selectReq = tx ? new sqlType.Request(tx) : (await getPool()).request();
  const r = await selectReq
    .input('municipioId', sql.Int, municipioId)
    .query(`
      SELECT
        MunicipioID,
        EstadoID,
        ClaveMunicipio,
        NombreMunicipio,
        EsValido,
        createdAt,
        updatedAt,
        createdBy,
        updatedBy
      FROM geo.Municipios
      WHERE MunicipioID = @municipioId
    `);
  const row = r.recordset[0];
  if (!row) return undefined;
  return {
    municipioId: row.MunicipioID,
    estadoId: row.EstadoID,
    claveMunicipio: row.ClaveMunicipio,
    nombreMunicipio: row.NombreMunicipio,
    esValido: row.EsValido,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy
  };
}

export async function deleteMunicipio(municipioId: number, tx?: sqlType.Transaction) {
  if (!municipioId || typeof municipioId !== 'number' || municipioId <= 0) {
    throw new Error('Invalid municipioId: must be a positive number');
  }
  const req = tx ? new sqlType.Request(tx) : (await getPool()).request();
  const r = await req
    .input('municipioId', sql.Int, municipioId)
    .query(`
      DELETE FROM geo.Municipios
      OUTPUT DELETED.MunicipioID
      WHERE MunicipioID = @municipioId
    `);
  return r.recordset[0]?.MunicipioID;
}