import { getPool, sql } from '../../db/mssql.js';
import { sql as sqlType } from '../../db/context.js';

export async function findCategoriaPuestoOrgById(categoriaPuestoOrgId: number) {
  if (!categoriaPuestoOrgId || typeof categoriaPuestoOrgId !== 'number' || categoriaPuestoOrgId <= 0) {
    throw new Error('Invalid categoriaPuestoOrgId: must be a positive number');
  }
  const p = await getPool();
  const r = await p.request()
    .input('categoriaPuestoOrgId', sql.BigInt, categoriaPuestoOrgId)
    .query(`
      SELECT
        CategoriaPuestoOrgId,
        Nivel,
        Org0,
        Org1,
        Org2,
        Org3,
        Categoria,
        NombreCategoria,
        IngresoBrutoMensual,
        VigenciaInicio,
        VigenciaFin,
        createdAt,
        updatedAt,
        createdBy,
        updatedBy
      FROM afi.CategoriaPuestoOrg
      WHERE CategoriaPuestoOrgId = @categoriaPuestoOrgId
    `);
  const row = r.recordset[0];
  if (!row) return undefined;
  return {
    categoriaPuestoOrgId: row.CategoriaPuestoOrgId,
    nivel: row.Nivel,
    org0: row.Org0,
    org1: row.Org1,
    org2: row.Org2,
    org3: row.Org3,
    categoria: row.Categoria,
    nombreCategoria: row.NombreCategoria,
    ingresoBrutoMensual: row.IngresoBrutoMensual,
    vigenciaInicio: row.VigenciaInicio,
    vigenciaFin: row.VigenciaFin,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy
  };
}

export async function listCategoriaPuestoOrg(filters: {
  nivel?: number;
  org0?: string;
  org1?: string;
  org2?: string;
  org3?: string;
  vigenciaInicio?: string;
  categoria?: string;
} = {}) {
  const p = await getPool();
  let query = `
    SELECT
      CategoriaPuestoOrgId,
      Nivel,
      Org0,
      Org1,
      Org2,
      Org3,
      Categoria,
      NombreCategoria,
      IngresoBrutoMensual,
      VigenciaInicio,
      VigenciaFin,
      createdAt,
      updatedAt,
      createdBy,
      updatedBy
    FROM afi.CategoriaPuestoOrg
    WHERE 1=1
  `;
  const request = p.request();

  if (filters.nivel !== undefined) {
    query += ' AND Nivel = @nivel';
    request.input('nivel', sql.TinyInt, filters.nivel);
  }
  if (filters.org0) {
    query += ' AND Org0 = @org0';
    request.input('org0', sql.Char(2), filters.org0);
  }
  if (filters.org1) {
    query += ' AND Org1 = @org1';
    request.input('org1', sql.Char(2), filters.org1);
  }
  if (filters.org2) {
    query += ' AND Org2 = @org2';
    request.input('org2', sql.Char(2), filters.org2);
  }
  if (filters.org3) {
    query += ' AND Org3 = @org3';
    request.input('org3', sql.Char(2), filters.org3);
  }
  if (filters.vigenciaInicio) {
    query += ' AND VigenciaInicio = @vigenciaInicio';
    request.input('vigenciaInicio', sql.DateTime2, filters.vigenciaInicio);
  }
  if (filters.categoria) {
    query += ' AND Categoria = @categoria';
    request.input('categoria', sql.VarChar(10), filters.categoria);
  }

  query += ' ORDER BY Nivel, Org0, Org1, Org2, Org3, VigenciaInicio DESC, Categoria';

  const r = await request.query(query);
  return r.recordset.map((row: any) => ({
    categoriaPuestoOrgId: row.CategoriaPuestoOrgId,
    nivel: row.Nivel,
    org0: row.Org0,
    org1: row.Org1,
    org2: row.Org2,
    org3: row.Org3,
    categoria: row.Categoria,
    nombreCategoria: row.NombreCategoria,
    ingresoBrutoMensual: row.IngresoBrutoMensual,
    vigenciaInicio: row.VigenciaInicio,
    vigenciaFin: row.VigenciaFin,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy
  }));
}

export async function createCategoriaPuestoOrg(
  nivel: number,
  org0: string,
  org1: string,
  categoria: string,
  nombreCategoria: string,
  ingresoBrutoMensual: number,
  vigenciaInicio: string,
  org2?: string,
  org3?: string,
  vigenciaFin?: string,
  userId?: string,
  tx?: sqlType.Transaction
) {
  // Validations
  if (typeof nivel !== 'number' || nivel < 0 || nivel > 3) {
    throw new Error('Invalid nivel: must be between 0 and 3');
  }
  if (!org0 || typeof org0 !== 'string' || org0.length !== 2) {
    throw new Error('Invalid org0: must be a 2-character string');
  }
  if (!org1 || typeof org1 !== 'string' || org1.length !== 2) {
    throw new Error('Invalid org1: must be a 2-character string');
  }
  if (nivel >= 2 && (!org2 || typeof org2 !== 'string' || org2.length !== 2)) {
    throw new Error('Invalid org2: must be a 2-character string for nivel >= 2');
  }
  if (nivel >= 3 && (!org3 || typeof org3 !== 'string' || org3.length !== 2)) {
    throw new Error('Invalid org3: must be a 2-character string for nivel >= 3');
  }
  if (!categoria || typeof categoria !== 'string' || categoria.length > 10) {
    throw new Error('Invalid categoria: must be a string with max 10 characters');
  }
  if (!nombreCategoria || typeof nombreCategoria !== 'string' || nombreCategoria.length > 80) {
    throw new Error('Invalid nombreCategoria: must be a string with max 80 characters');
  }
  if (typeof ingresoBrutoMensual !== 'number' || ingresoBrutoMensual <= 0) {
    throw new Error('Invalid ingresoBrutoMensual: must be a positive number');
  }
  if (!vigenciaInicio) {
    throw new Error('Invalid vigenciaInicio: required');
  }

  const req = tx ? new sqlType.Request(tx) : (await getPool()).request();
  const r = await req
    .input('nivel', sql.TinyInt, nivel)
    .input('org0', sql.Char(2), org0)
    .input('org1', sql.Char(2), org1)
    .input('org2', sql.Char(2), org2 ?? null)
    .input('org3', sql.Char(2), org3 ?? null)
    .input('categoria', sql.VarChar(10), categoria)
    .input('nombreCategoria', sql.NVarChar(80), nombreCategoria)
    .input('ingresoBrutoMensual', sql.Decimal(12, 2), ingresoBrutoMensual)
    .input('vigenciaInicio', sql.DateTime2, vigenciaInicio)
    .input('vigenciaFin', sql.DateTime2, vigenciaFin ?? null)
    .input('createdBy', sql.VarChar(128), userId ?? null)
    .input('updatedBy', sql.VarChar(128), userId ?? null)
    .query(`
      INSERT INTO afi.CategoriaPuestoOrg (
        Nivel, Org0, Org1, Org2, Org3, Categoria, NombreCategoria,
        IngresoBrutoMensual, VigenciaInicio, VigenciaFin, createdBy, updatedBy
      )
      OUTPUT
        INSERTED.CategoriaPuestoOrgId,
        INSERTED.Nivel,
        INSERTED.Org0,
        INSERTED.Org1,
        INSERTED.Org2,
        INSERTED.Org3,
        INSERTED.Categoria,
        INSERTED.NombreCategoria,
        INSERTED.IngresoBrutoMensual,
        INSERTED.VigenciaInicio,
        INSERTED.VigenciaFin,
        INSERTED.createdAt,
        INSERTED.updatedAt,
        INSERTED.createdBy,
        INSERTED.updatedBy
      VALUES (
        @nivel, @org0, @org1, @org2, @org3, @categoria, @nombreCategoria,
        @ingresoBrutoMensual, @vigenciaInicio, @vigenciaFin, @createdBy, @updatedBy
      )
    `);
  const row = r.recordset[0];
  return {
    categoriaPuestoOrgId: row.CategoriaPuestoOrgId,
    nivel: row.Nivel,
    org0: row.Org0,
    org1: row.Org1,
    org2: row.Org2,
    org3: row.Org3,
    categoria: row.Categoria,
    nombreCategoria: row.NombreCategoria,
    ingresoBrutoMensual: row.IngresoBrutoMensual,
    vigenciaInicio: row.VigenciaInicio,
    vigenciaFin: row.VigenciaFin,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy
  };
}

export async function updateCategoriaPuestoOrg(
  categoriaPuestoOrgId: number,
  nombreCategoria?: string,
  ingresoBrutoMensual?: number,
  vigenciaFin?: string,
  userId?: string,
  tx?: sqlType.Transaction
) {
  if (!categoriaPuestoOrgId || typeof categoriaPuestoOrgId !== 'number' || categoriaPuestoOrgId <= 0) {
    throw new Error('Invalid categoriaPuestoOrgId: must be a positive number');
  }
  if (nombreCategoria !== undefined && (!nombreCategoria || typeof nombreCategoria !== 'string' || nombreCategoria.length > 80)) {
    throw new Error('Invalid nombreCategoria: must be a string with max 80 characters');
  }
  if (ingresoBrutoMensual !== undefined && (typeof ingresoBrutoMensual !== 'number' || ingresoBrutoMensual <= 0)) {
    throw new Error('Invalid ingresoBrutoMensual: must be a positive number');
  }

  const req = tx ? new sqlType.Request(tx) : (await getPool()).request();
  const r = await req
    .input('categoriaPuestoOrgId', sql.BigInt, categoriaPuestoOrgId)
    .input('nombreCategoria', sql.NVarChar(80), nombreCategoria ?? null)
    .input('ingresoBrutoMensual', sql.Decimal(12, 2), ingresoBrutoMensual ?? null)
    .input('vigenciaFin', sql.DateTime2, vigenciaFin ?? null)
    .input('updatedBy', sql.VarChar(128), userId ?? null)
    .query(`
      UPDATE afi.CategoriaPuestoOrg
      SET NombreCategoria = @nombreCategoria,
          IngresoBrutoMensual = @ingresoBrutoMensual,
          VigenciaFin = @vigenciaFin,
          updatedAt = SYSUTCDATETIME(),
          updatedBy = @updatedBy
      OUTPUT
        INSERTED.CategoriaPuestoOrgId,
        INSERTED.Nivel,
        INSERTED.Org0,
        INSERTED.Org1,
        INSERTED.Org2,
        INSERTED.Org3,
        INSERTED.Categoria,
        INSERTED.NombreCategoria,
        INSERTED.IngresoBrutoMensual,
        INSERTED.VigenciaInicio,
        INSERTED.VigenciaFin,
        INSERTED.createdAt,
        INSERTED.updatedAt,
        INSERTED.createdBy,
        INSERTED.updatedBy
      WHERE CategoriaPuestoOrgId = @categoriaPuestoOrgId
    `);
  const row = r.recordset[0];
  if (!row) return undefined;
  return {
    categoriaPuestoOrgId: row.CategoriaPuestoOrgId,
    nivel: row.Nivel,
    org0: row.Org0,
    org1: row.Org1,
    org2: row.Org2,
    org3: row.Org3,
    categoria: row.Categoria,
    nombreCategoria: row.NombreCategoria,
    ingresoBrutoMensual: row.IngresoBrutoMensual,
    vigenciaInicio: row.VigenciaInicio,
    vigenciaFin: row.VigenciaFin,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy
  };
}

export async function deleteCategoriaPuestoOrg(categoriaPuestoOrgId: number, tx?: sqlType.Transaction) {
  if (!categoriaPuestoOrgId || typeof categoriaPuestoOrgId !== 'number' || categoriaPuestoOrgId <= 0) {
    throw new Error('Invalid categoriaPuestoOrgId: must be a positive number');
  }
  const req = tx ? new sqlType.Request(tx) : (await getPool()).request();
  const r = await req
    .input('categoriaPuestoOrgId', sql.BigInt, categoriaPuestoOrgId)
    .query(`
      DELETE FROM afi.CategoriaPuestoOrg
      OUTPUT DELETED.CategoriaPuestoOrgId
      WHERE CategoriaPuestoOrgId = @categoriaPuestoOrgId
    `);
  return r.recordset[0]?.CategoriaPuestoOrgId;
}