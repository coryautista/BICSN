import { getPool, sql } from '../../db/mssql.js';
import { sql as sqlType } from '../../db/context.js';

export async function findColoniaById(coloniaId: number) {
  if (!coloniaId || typeof coloniaId !== 'number' || coloniaId <= 0) {
    throw new Error('Invalid coloniaId: must be a positive number');
  }
  const p = await getPool();
  const r = await p.request()
    .input('coloniaId', sql.Int, coloniaId)
    .query(`
      SELECT
        c.ColoniaID,
        c.MunicipioID,
        c.CodigoPostalID,
        c.NombreColonia,
        c.TipoAsentamiento,
        c.EsValido,
        c.createdAt,
        c.updatedAt,
        c.createdBy,
        c.updatedBy,
        m.NombreMunicipio,
        cp.CodigoPostal,
        e.EstadoID,
        e.NombreEstado
      FROM geo.Colonias c
      INNER JOIN geo.Municipios m ON c.MunicipioID = m.MunicipioID
      INNER JOIN geo.CodigosPostales cp ON c.CodigoPostalID = cp.CodigoPostalID
      INNER JOIN geo.Estados e ON m.EstadoID = e.EstadoID
      WHERE c.ColoniaID = @coloniaId
    `);
  const row = r.recordset[0];
  if (!row) return undefined;
  return {
    coloniaId: row.ColoniaID,
    municipioId: row.MunicipioID,
    codigoPostalId: row.CodigoPostalID,
    nombreColonia: row.NombreColonia,
    tipoAsentamiento: row.TipoAsentamiento,
    esValido: row.EsValido,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
    municipio: {
      municipioId: row.MunicipioID,
      nombreMunicipio: row.NombreMunicipio
    },
    codigoPostal: {
      codigoPostalId: row.CodigoPostalID,
      codigoPostal: row.CodigoPostal
    },
    estado: {
      estadoId: row.EstadoID,
      nombreEstado: row.NombreEstado
    }
  };
}

export async function listColoniasByMunicipio(municipioId: number) {
  if (!municipioId || typeof municipioId !== 'number' || municipioId <= 0) {
    throw new Error('Invalid municipioId: must be a positive number');
  }
  const p = await getPool();
  const r = await p.request()
    .input('municipioId', sql.Int, municipioId)
    .query(`
      SELECT
        c.ColoniaID,
        c.MunicipioID,
        c.CodigoPostalID,
        c.NombreColonia,
        c.TipoAsentamiento,
        c.EsValido,
        c.createdAt,
        c.updatedAt,
        c.createdBy,
        c.updatedBy,
        cp.CodigoPostal
      FROM geo.Colonias c
      INNER JOIN geo.CodigosPostales cp ON c.CodigoPostalID = cp.CodigoPostalID
      WHERE c.MunicipioID = @municipioId
      ORDER BY c.NombreColonia ASC
    `);
  return r.recordset.map((row: any) => ({
    coloniaId: row.ColoniaID,
    municipioId: row.MunicipioID,
    codigoPostalId: row.CodigoPostalID,
    nombreColonia: row.NombreColonia,
    tipoAsentamiento: row.TipoAsentamiento,
    esValido: row.EsValido,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
    codigoPostal: {
      codigoPostalId: row.CodigoPostalID,
      codigoPostal: row.CodigoPostal
    }
  }));
}

export async function listColoniasByCodigoPostal(codigoPostalId: number) {
  if (!codigoPostalId || typeof codigoPostalId !== 'number' || codigoPostalId <= 0) {
    throw new Error('Invalid codigoPostalId: must be a positive number');
  }
  const p = await getPool();
  const r = await p.request()
    .input('codigoPostalId', sql.Int, codigoPostalId)
    .query(`
      SELECT
        c.ColoniaID,
        c.MunicipioID,
        c.CodigoPostalID,
        c.NombreColonia,
        c.TipoAsentamiento,
        c.EsValido,
        c.createdAt,
        c.updatedAt,
        c.createdBy,
        c.updatedBy,
        m.NombreMunicipio,
        e.EstadoID,
        e.NombreEstado
      FROM geo.Colonias c
      INNER JOIN geo.Municipios m ON c.MunicipioID = m.MunicipioID
      INNER JOIN geo.Estados e ON m.EstadoID = e.EstadoID
      WHERE c.CodigoPostalID = @codigoPostalId
      ORDER BY c.NombreColonia ASC
    `);
  return r.recordset.map((row: any) => ({
    coloniaId: row.ColoniaID,
    municipioId: row.MunicipioID,
    codigoPostalId: row.CodigoPostalID,
    nombreColonia: row.NombreColonia,
    tipoAsentamiento: row.TipoAsentamiento,
    esValido: row.EsValido,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
    municipio: {
      municipioId: row.MunicipioID,
      nombreMunicipio: row.NombreMunicipio
    },
    estado: {
      estadoId: row.EstadoID,
      nombreEstado: row.NombreEstado
    }
  }));
}

export async function searchColonias(filters: {
  estadoId?: string;
  municipioId?: number;
  codigoPostal?: string;
  nombreColonia?: string;
  tipoAsentamiento?: string;
  esValido?: boolean;
  limit?: number;
  offset?: number;
}) {
  const p = await getPool();
  let query = `
    SELECT
      c.ColoniaID,
      c.MunicipioID,
      c.CodigoPostalID,
      c.NombreColonia,
      c.TipoAsentamiento,
      c.EsValido,
      c.createdAt,
      c.updatedAt,
      c.createdBy,
      c.updatedBy,
      m.NombreMunicipio,
      cp.CodigoPostal,
      e.EstadoID,
      e.NombreEstado
    FROM geo.Colonias c
    INNER JOIN geo.Municipios m ON c.MunicipioID = m.MunicipioID
    INNER JOIN geo.CodigosPostales cp ON c.CodigoPostalID = cp.CodigoPostalID
    INNER JOIN geo.Estados e ON m.EstadoID = e.EstadoID
    WHERE 1=1
  `;

  const params: any[] = [];

  if (filters.estadoId) {
    query += ` AND e.EstadoID = @estadoId`;
    params.push({ name: 'estadoId', type: sql.Char(2), value: filters.estadoId });
  }

  if (filters.municipioId) {
    query += ` AND c.MunicipioID = @municipioId`;
    params.push({ name: 'municipioId', type: sql.Int, value: filters.municipioId });
  }

  if (filters.codigoPostal) {
    query += ` AND cp.CodigoPostal = @codigoPostal`;
    params.push({ name: 'codigoPostal', type: sql.Char(5), value: filters.codigoPostal });
  }

  if (filters.nombreColonia) {
    query += ` AND c.NombreColonia LIKE @nombreColonia`;
    params.push({ name: 'nombreColonia', type: sql.VarChar(102), value: `%${filters.nombreColonia}%` });
  }

  if (filters.tipoAsentamiento) {
    query += ` AND c.TipoAsentamiento LIKE @tipoAsentamiento`;
    params.push({ name: 'tipoAsentamiento', type: sql.VarChar(52), value: `%${filters.tipoAsentamiento}%` });
  }

  if (filters.esValido !== undefined) {
    query += ` AND c.EsValido = @esValido`;
    params.push({ name: 'esValido', type: sql.Bit, value: filters.esValido });
  }

  query += ` ORDER BY e.EstadoID ASC, m.NombreMunicipio ASC, c.NombreColonia ASC`;

  if (filters.limit) {
    query += ` OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;
    params.push({ name: 'offset', type: sql.Int, value: filters.offset || 0 });
    params.push({ name: 'limit', type: sql.Int, value: filters.limit });
  }

  const req = p.request();
  params.forEach(param => {
    req.input(param.name, param.type, param.value);
  });

  const r = await req.query(query);
  return r.recordset.map((row: any) => ({
    coloniaId: row.ColoniaID,
    municipioId: row.MunicipioID,
    codigoPostalId: row.CodigoPostalID,
    nombreColonia: row.NombreColonia,
    tipoAsentamiento: row.TipoAsentamiento,
    esValido: row.EsValido,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
    municipio: {
      municipioId: row.MunicipioID,
      nombreMunicipio: row.NombreMunicipio
    },
    codigoPostal: {
      codigoPostalId: row.CodigoPostalID,
      codigoPostal: row.CodigoPostal
    },
    estado: {
      estadoId: row.EstadoID,
      nombreEstado: row.NombreEstado
    }
  }));
}

export async function createColonia(municipioId: number, codigoPostalId: number, nombreColonia: string, tipoAsentamiento?: string, esValido?: boolean, userId?: string, tx?: sqlType.Transaction) {
  if (!municipioId || typeof municipioId !== 'number' || municipioId <= 0) {
    throw new Error('Invalid municipioId: must be a positive number');
  }
  if (!codigoPostalId || typeof codigoPostalId !== 'number' || codigoPostalId <= 0) {
    throw new Error('Invalid codigoPostalId: must be a positive number');
  }
  if (!nombreColonia || typeof nombreColonia !== 'string' || nombreColonia.trim().length === 0 || nombreColonia.length > 100) {
    throw new Error('Invalid nombreColonia: must be a non-empty string with max 100 characters');
  }
  if (tipoAsentamiento && (typeof tipoAsentamiento !== 'string' || tipoAsentamiento.length > 50)) {
    throw new Error('Invalid tipoAsentamiento: must be a string with max 50 characters');
  }
  if (esValido !== undefined && typeof esValido !== 'boolean') {
    throw new Error('Invalid esValido: must be a boolean');
  }

  const req = tx ? new sqlType.Request(tx) : (await getPool()).request();
  
  // First, insert the record
  await req
    .input('municipioId', sql.Int, municipioId)
    .input('codigoPostalId', sql.Int, codigoPostalId)
    .input('nombreColonia', sql.VarChar(100), nombreColonia)
    .input('tipoAsentamiento', sql.VarChar(50), tipoAsentamiento ?? null)
    .input('esValido', sql.Bit, esValido ?? false)
    .input('createdBy', sql.VarChar(128), userId ?? null)
    .input('updatedBy', sql.VarChar(128), userId ?? null)
    .query(`
      INSERT INTO geo.Colonias (MunicipioID, CodigoPostalID, NombreColonia, TipoAsentamiento, EsValido, createdBy, updatedBy)
      VALUES (@municipioId, @codigoPostalId, @nombreColonia, @tipoAsentamiento, @esValido, @createdBy, @updatedBy)
    `);

  // Retrieve the inserted record by matching the unique combination
  const selectReq = tx ? new sqlType.Request(tx) : (await getPool()).request();
  const r = await selectReq
    .input('municipioId', sql.Int, municipioId)
    .input('codigoPostalId', sql.Int, codigoPostalId)
    .input('nombreColonia', sql.VarChar(100), nombreColonia)
    .query(`
      SELECT TOP 1
        ColoniaID,
        MunicipioID,
        CodigoPostalID,
        NombreColonia,
        TipoAsentamiento,
        EsValido,
        createdAt,
        updatedAt,
        createdBy,
        updatedBy
      FROM geo.Colonias
      WHERE MunicipioID = @municipioId 
        AND CodigoPostalID = @codigoPostalId 
        AND NombreColonia = @nombreColonia
      ORDER BY ColoniaID DESC
    `);
  const row = r.recordset?.[0];
  if (!row) {
    throw new Error('Failed to retrieve inserted colonia');
  }
  return {
    coloniaId: row.ColoniaID,
    municipioId: row.MunicipioID,
    codigoPostalId: row.CodigoPostalID,
    nombreColonia: row.NombreColonia,
    tipoAsentamiento: row.TipoAsentamiento,
    esValido: row.EsValido,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy
  };
}

export async function updateColonia(coloniaId: number, nombreColonia?: string, tipoAsentamiento?: string, esValido?: boolean, userId?: string, tx?: sqlType.Transaction) {
  if (!coloniaId || typeof coloniaId !== 'number' || coloniaId <= 0) {
    throw new Error('Invalid coloniaId: must be a positive number');
  }
  if (nombreColonia !== undefined && (!nombreColonia || typeof nombreColonia !== 'string' || nombreColonia.trim().length === 0 || nombreColonia.length > 100)) {
    throw new Error('Invalid nombreColonia: must be a non-empty string with max 100 characters');
  }
  if (tipoAsentamiento !== undefined && tipoAsentamiento !== null && (typeof tipoAsentamiento !== 'string' || tipoAsentamiento.length > 50)) {
    throw new Error('Invalid tipoAsentamiento: must be a string with max 50 characters or null');
  }
  if (esValido !== undefined && typeof esValido !== 'boolean') {
    throw new Error('Invalid esValido: must be a boolean');
  }

  const req = tx ? new sqlType.Request(tx) : (await getPool()).request();
  const updateResult = await req
    .input('coloniaId', sql.Int, coloniaId)
    .input('nombreColonia', sql.VarChar(100), nombreColonia ?? null)
    .input('tipoAsentamiento', sql.VarChar(50), tipoAsentamiento ?? null)
    .input('esValido', sql.Bit, esValido ?? null)
    .input('updatedBy', sql.VarChar(128), userId ?? null)
    .query(`
      UPDATE geo.Colonias
      SET NombreColonia = @nombreColonia,
          TipoAsentamiento = @tipoAsentamiento,
          EsValido = @esValido,
          updatedAt = SYSUTCDATETIME(),
          updatedBy = @updatedBy
      WHERE ColoniaID = @coloniaId
    `);

  // Check if update affected any rows
  if (updateResult.rowsAffected && updateResult.rowsAffected[0] === 0) {
    return undefined;
  }

  // Retrieve the updated record
  const selectReq = tx ? new sqlType.Request(tx) : (await getPool()).request();
  const r = await selectReq
    .input('coloniaId', sql.Int, coloniaId)
    .query(`
      SELECT
        ColoniaID,
        MunicipioID,
        CodigoPostalID,
        NombreColonia,
        TipoAsentamiento,
        EsValido,
        createdAt,
        updatedAt,
        createdBy,
        updatedBy
      FROM geo.Colonias
      WHERE ColoniaID = @coloniaId
    `);
  const row = r.recordset[0];
  if (!row) return undefined;
  return {
    coloniaId: row.ColoniaID,
    municipioId: row.MunicipioID,
    codigoPostalId: row.CodigoPostalID,
    nombreColonia: row.NombreColonia,
    tipoAsentamiento: row.TipoAsentamiento,
    esValido: row.EsValido,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy
  };
}

export async function deleteColonia(coloniaId: number, tx?: sqlType.Transaction) {
  if (!coloniaId || typeof coloniaId !== 'number' || coloniaId <= 0) {
    throw new Error('Invalid coloniaId: must be a positive number');
  }
  const req = tx ? new sqlType.Request(tx) : (await getPool()).request();
  const r = await req
    .input('coloniaId', sql.Int, coloniaId)
    .query(`
      DELETE FROM geo.Colonias
      OUTPUT DELETED.ColoniaID
      WHERE ColoniaID = @coloniaId
    `);
  return r.recordset[0]?.ColoniaID;
}