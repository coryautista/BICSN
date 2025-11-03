import { getPool, sql } from '../../db/mssql.js';
import { sql as sqlType } from '../../db/context.js';

export async function findCalleById(calleId: number) {
  if (!calleId || typeof calleId !== 'number' || calleId <= 0) {
    throw new Error('Invalid calleId: must be a positive number');
  }
  const p = await getPool();
  const r = await p.request()
    .input('calleId', sql.Int, calleId)
    .query(`
      SELECT
        c.CalleID,
        c.ColoniaID,
        c.NombreCalle,
        c.EsValido,
        c.createdAt,
        c.updatedAt,
        c.createdBy,
        c.updatedBy,
        col.NombreColonia,
        col.TipoAsentamiento,
        m.MunicipioID,
        m.NombreMunicipio,
        cp.CodigoPostalID,
        cp.CodigoPostal,
        e.EstadoID,
        e.NombreEstado
      FROM geo.Calles c
      INNER JOIN geo.Colonias col ON c.ColoniaID = col.ColoniaID
      INNER JOIN geo.Municipios m ON col.MunicipioID = m.MunicipioID
      INNER JOIN geo.CodigosPostales cp ON col.CodigoPostalID = cp.CodigoPostalID
      INNER JOIN geo.Estados e ON m.EstadoID = e.EstadoID
      WHERE c.CalleID = @calleId
    `);
  const row = r.recordset[0];
  if (!row) return undefined;
  return {
    calleId: row.CalleID,
    coloniaId: row.ColoniaID,
    nombreCalle: row.NombreCalle,
    esValido: row.EsValido,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
    colonia: {
      coloniaId: row.ColoniaID,
      nombreColonia: row.NombreColonia,
      tipoAsentamiento: row.TipoAsentamiento
    },
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

export async function listCallesByColonia(coloniaId: number) {
  if (!coloniaId || typeof coloniaId !== 'number' || coloniaId <= 0) {
    throw new Error('Invalid coloniaId: must be a positive number');
  }
  const p = await getPool();
  const r = await p.request()
    .input('coloniaId', sql.Int, coloniaId)
    .query(`
      SELECT
        CalleID,
        ColoniaID,
        NombreCalle,
        EsValido,
        createdAt,
        updatedAt,
        createdBy,
        updatedBy
      FROM geo.Calles
      WHERE ColoniaID = @coloniaId
      ORDER BY NombreCalle ASC
    `);
  return r.recordset.map((row: any) => ({
    calleId: row.CalleID,
    coloniaId: row.ColoniaID,
    nombreCalle: row.NombreCalle,
    esValido: row.EsValido,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy
  }));
}

export async function searchCalles(filters: {
  estadoId?: string;
  municipioId?: number;
  coloniaId?: number;
  codigoPostal?: string;
  nombreCalle?: string;
  esValido?: boolean;
  limit?: number;
  offset?: number;
}) {
  const p = await getPool();
  let query = `
    SELECT
      c.CalleID,
      c.ColoniaID,
      c.NombreCalle,
      c.EsValido,
      c.createdAt,
      c.updatedAt,
      c.createdBy,
      c.updatedBy,
      col.NombreColonia,
      col.TipoAsentamiento,
      m.MunicipioID,
      m.NombreMunicipio,
      cp.CodigoPostalID,
      cp.CodigoPostal,
      e.EstadoID,
      e.NombreEstado
    FROM geo.Calles c
    INNER JOIN geo.Colonias col ON c.ColoniaID = col.ColoniaID
    INNER JOIN geo.Municipios m ON col.MunicipioID = m.MunicipioID
    INNER JOIN geo.CodigosPostales cp ON col.CodigoPostalID = cp.CodigoPostalID
    INNER JOIN geo.Estados e ON m.EstadoID = e.EstadoID
    WHERE 1=1
  `;

  const params: any[] = [];

  if (filters.estadoId) {
    query += ` AND e.EstadoID = @estadoId`;
    params.push({ name: 'estadoId', type: sql.Char(2), value: filters.estadoId });
  }

  if (filters.municipioId) {
    query += ` AND m.MunicipioID = @municipioId`;
    params.push({ name: 'municipioId', type: sql.Int, value: filters.municipioId });
  }

  if (filters.coloniaId) {
    query += ` AND c.ColoniaID = @coloniaId`;
    params.push({ name: 'coloniaId', type: sql.Int, value: filters.coloniaId });
  }

  if (filters.codigoPostal) {
    query += ` AND cp.CodigoPostal = @codigoPostal`;
    params.push({ name: 'codigoPostal', type: sql.Char(5), value: filters.codigoPostal });
  }

  if (filters.nombreCalle) {
    query += ` AND c.NombreCalle LIKE @nombreCalle`;
    params.push({ name: 'nombreCalle', type: sql.VarChar(152), value: `%${filters.nombreCalle}%` });
  }

  if (filters.esValido !== undefined) {
    query += ` AND c.EsValido = @esValido`;
    params.push({ name: 'esValido', type: sql.Bit, value: filters.esValido });
  }

  query += ` ORDER BY e.EstadoID ASC, m.NombreMunicipio ASC, col.NombreColonia ASC, c.NombreCalle ASC`;

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
    calleId: row.CalleID,
    coloniaId: row.ColoniaID,
    nombreCalle: row.NombreCalle,
    esValido: row.EsValido,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
    colonia: {
      coloniaId: row.ColoniaID,
      nombreColonia: row.NombreColonia,
      tipoAsentamiento: row.TipoAsentamiento
    },
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

export async function createCalle(coloniaId: number, nombreCalle: string, esValido: boolean, userId?: string, tx?: sqlType.Transaction) {
  if (!coloniaId || typeof coloniaId !== 'number' || coloniaId <= 0) {
    throw new Error('Invalid coloniaId: must be a positive number');
  }
  if (!nombreCalle || typeof nombreCalle !== 'string' || nombreCalle.trim().length === 0 || nombreCalle.length > 150) {
    throw new Error('Invalid nombreCalle: must be a non-empty string with max 150 characters');
  }
  if (typeof esValido !== 'boolean') {
    throw new Error('Invalid esValido: must be a boolean');
  }

  const req = tx ? new sqlType.Request(tx) : (await getPool()).request();
  
  // First, insert the record
  await req
    .input('coloniaId', sql.Int, coloniaId)
    .input('nombreCalle', sql.VarChar(150), nombreCalle)
    .input('esValido', sql.Bit, esValido)
    .input('createdBy', sql.VarChar(128), userId ?? null)
    .input('updatedBy', sql.VarChar(128), userId ?? null)
    .query(`
      INSERT INTO geo.Calles (ColoniaID, NombreCalle, EsValido, createdBy, updatedBy)
      VALUES (@coloniaId, @nombreCalle, @esValido, @createdBy, @updatedBy)
    `);

  // Retrieve the inserted record by matching the unique combination
  const selectReq = tx ? new sqlType.Request(tx) : (await getPool()).request();
  const r = await selectReq
    .input('coloniaId', sql.Int, coloniaId)
    .input('nombreCalle', sql.VarChar(150), nombreCalle)
    .query(`
      SELECT TOP 1
        CalleID,
        ColoniaID,
        NombreCalle,
        EsValido,
        createdAt,
        updatedAt,
        createdBy,
        updatedBy
      FROM geo.Calles
      WHERE ColoniaID = @coloniaId AND NombreCalle = @nombreCalle
      ORDER BY CalleID DESC
    `);
  const row = r.recordset?.[0];
  if (!row) {
    throw new Error('Failed to retrieve inserted calle');
  }
  return {
    calleId: row.CalleID,
    coloniaId: row.ColoniaID,
    nombreCalle: row.NombreCalle,
    esValido: row.EsValido,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy
  };
}

export async function updateCalle(calleId: number, nombreCalle?: string, esValido?: boolean, userId?: string, tx?: sqlType.Transaction) {
  if (!calleId || typeof calleId !== 'number' || calleId <= 0) {
    throw new Error('Invalid calleId: must be a positive number');
  }
  if (nombreCalle !== undefined && (!nombreCalle || typeof nombreCalle !== 'string' || nombreCalle.trim().length === 0 || nombreCalle.length > 150)) {
    throw new Error('Invalid nombreCalle: must be a non-empty string with max 150 characters');
  }
  if (esValido !== undefined && typeof esValido !== 'boolean') {
    throw new Error('Invalid esValido: must be a boolean');
  }

  const req = tx ? new sqlType.Request(tx) : (await getPool()).request();
  
  // First, update the record
  await req
    .input('calleId', sql.Int, calleId)
    .input('nombreCalle', sql.VarChar(150), nombreCalle ?? null)
    .input('esValido', sql.Bit, esValido ?? null)
    .input('updatedBy', sql.VarChar(128), userId ?? null)
    .query(`
      UPDATE geo.Calles
      SET NombreCalle = COALESCE(@nombreCalle, NombreCalle),
          EsValido = COALESCE(@esValido, EsValido),
          updatedAt = SYSUTCDATETIME(),
          updatedBy = @updatedBy
      WHERE CalleID = @calleId
    `);

  // Retrieve the updated record
  const selectReq = tx ? new sqlType.Request(tx) : (await getPool()).request();
  const r = await selectReq
    .input('calleId', sql.Int, calleId)
    .query(`
      SELECT
        CalleID,
        ColoniaID,
        NombreCalle,
        EsValido,
        createdAt,
        updatedAt,
        createdBy,
        updatedBy
      FROM geo.Calles
      WHERE CalleID = @calleId
    `);
  const row = r.recordset?.[0];
  if (!row) return undefined;
  return {
    calleId: row.CalleID,
    coloniaId: row.ColoniaID,
    nombreCalle: row.NombreCalle,
    esValido: row.EsValido,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy
  };
}

export async function deleteCalle(calleId: number, tx?: sqlType.Transaction) {
  if (!calleId || typeof calleId !== 'number' || calleId <= 0) {
    throw new Error('Invalid calleId: must be a positive number');
  }
  const req = tx ? new sqlType.Request(tx) : (await getPool()).request();
  const r = await req
    .input('calleId', sql.Int, calleId)
    .query(`
      DELETE FROM geo.Calles
      OUTPUT DELETED.CalleID
      WHERE CalleID = @calleId
    `);
  return r.recordset[0]?.CalleID;
}