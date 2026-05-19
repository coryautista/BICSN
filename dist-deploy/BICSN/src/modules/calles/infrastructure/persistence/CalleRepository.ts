import { ConnectionPool } from 'mssql';
import { ICalleRepository } from '../../domain/repositories/ICalleRepository.js';
import { Calle, CalleDetailed, CreateCalleData, UpdateCalleData, SearchCallesFilters } from '../../domain/entities/Calle.js';
import sql from 'mssql';

export class CalleRepository implements ICalleRepository {
  constructor(private mssqlPool: ConnectionPool) {}

  private mapRowToCalle(row: any): Calle {
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

  private mapRowToCalleDetailed(row: any): CalleDetailed {
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

  async findById(calleId: number): Promise<CalleDetailed | undefined> {
    const result = await this.mssqlPool.request()
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

    if (result.recordset.length === 0) return undefined;
    return this.mapRowToCalleDetailed(result.recordset[0]);
  }

  async findByColonia(coloniaId: number): Promise<Calle[]> {
    const result = await this.mssqlPool.request()
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

    return result.recordset.map(this.mapRowToCalle);
  }

  async search(filters: SearchCallesFilters): Promise<Calle[]> {
    // BÚSQUEDA LIBRE: Sin JOINs, busca directamente en geo.Calles
    let query = `
      SELECT
        c.CalleID,
        c.ColoniaID,
        c.NombreCalle,
        c.EsValido,
        c.createdAt,
        c.updatedAt,
        c.createdBy,
        c.updatedBy
      FROM geo.Calles c
      WHERE 1=1
    `;

    const request = this.mssqlPool.request();

    // Solo filtros que existen en geo.Calles
    if (filters.coloniaId) {
      query += ` AND c.ColoniaID = @coloniaId`;
      request.input('coloniaId', sql.Int, filters.coloniaId);
    }

    if (filters.nombreCalle) {
      query += ` AND c.NombreCalle LIKE @nombreCalle`;
      request.input('nombreCalle', sql.VarChar(152), `%${filters.nombreCalle}%`);
    }

    if (filters.esValido !== undefined) {
      query += ` AND c.EsValido = @esValido`;
      request.input('esValido', sql.Bit, filters.esValido);
    }

    query += ` ORDER BY c.ColoniaID ASC, c.NombreCalle ASC`;

    if (filters.limit) {
      query += ` OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;
      request.input('offset', sql.Int, filters.offset || 0);
      request.input('limit', sql.Int, filters.limit);
    }

    const result = await request.query(query);
    return result.recordset.map(row => this.mapRowToCalle(row));
  }

  async create(data: CreateCalleData): Promise<Calle> {
    // Insert the record
    await this.mssqlPool.request()
      .input('coloniaId', sql.Int, data.coloniaId)
      .input('nombreCalle', sql.VarChar(150), data.nombreCalle)
      .input('esValido', sql.Bit, data.esValido)
      .input('createdBy', sql.VarChar(128), data.userId ?? null)
      .input('updatedBy', sql.VarChar(128), data.userId ?? null)
      .query(`
        INSERT INTO geo.Calles (ColoniaID, NombreCalle, EsValido, createdBy, updatedBy)
        VALUES (@coloniaId, @nombreCalle, @esValido, @createdBy, @updatedBy)
      `);

    // Retrieve the inserted record
    const result = await this.mssqlPool.request()
      .input('coloniaId', sql.Int, data.coloniaId)
      .input('nombreCalle', sql.VarChar(150), data.nombreCalle)
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

    if (result.recordset.length === 0) {
      throw new Error('Failed to retrieve inserted calle');
    }

    return this.mapRowToCalle(result.recordset[0]);
  }

  async update(data: UpdateCalleData): Promise<Calle> {
    const sets: string[] = [];
    const request = this.mssqlPool.request().input('calleId', sql.Int, data.calleId);

    if (data.nombreCalle !== undefined) {
      request.input('nombreCalle', sql.VarChar(150), data.nombreCalle);
      sets.push('NombreCalle = @nombreCalle');
    }

    if (data.esValido !== undefined) {
      request.input('esValido', sql.Bit, data.esValido);
      sets.push('EsValido = @esValido');
    }

    sets.push('updatedAt = SYSUTCDATETIME()');
    request.input('updatedBy', sql.VarChar(128), data.userId ?? null);
    sets.push('updatedBy = @updatedBy');

    if (sets.length === 2) { // Only updatedAt and updatedBy
      throw new Error('CALLE_NO_UPDATE_DATA');
    }

    await request.query(`
      UPDATE geo.Calles
      SET ${sets.join(', ')}
      WHERE CalleID = @calleId
    `);

    // Retrieve the updated record
    const result = await this.mssqlPool.request()
      .input('calleId', sql.Int, data.calleId)
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

    if (result.recordset.length === 0) {
      throw new Error('CALLE_NOT_FOUND');
    }

    return this.mapRowToCalle(result.recordset[0]);
  }

  async delete(calleId: number): Promise<number> {
    const result = await this.mssqlPool.request()
      .input('calleId', sql.Int, calleId)
      .query(`
        DELETE FROM geo.Calles
        OUTPUT DELETED.CalleID
        WHERE CalleID = @calleId
      `);

    if (result.recordset.length === 0) {
      throw new Error('CALLE_NOT_FOUND');
    }

    return result.recordset[0].CalleID;
  }
}
