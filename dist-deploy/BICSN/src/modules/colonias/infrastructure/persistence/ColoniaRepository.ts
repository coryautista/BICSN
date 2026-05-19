import { ConnectionPool } from 'mssql';
import { IColoniaRepository } from '../../domain/repositories/IColoniaRepository.js';
import { Colonia, ColoniaDetailed, SearchColoniasFilters } from '../../domain/entities/Colonia.js';
import { sql } from '../../../../db/mssql.js';

export class ColoniaRepository implements IColoniaRepository {
  constructor(private mssqlPool: ConnectionPool) {}

  private mapRowToColoniaDetailed(row: any): ColoniaDetailed {
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

  private mapRowToColonia(row: any): Colonia {
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
      codigoPostal: row.CodigoPostal ? {
        codigoPostalId: row.CodigoPostalID,
        codigoPostal: row.CodigoPostal
      } : undefined
    };
  }

  async findById(coloniaId: number): Promise<ColoniaDetailed | undefined> {
    if (!coloniaId || typeof coloniaId !== 'number' || coloniaId <= 0) {
      throw new Error('Invalid coloniaId: must be a positive number');
    }
    const r = await this.mssqlPool.request()
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
    return this.mapRowToColoniaDetailed(row);
  }

  async findByMunicipio(municipioId: number): Promise<Colonia[]> {
    if (!municipioId || typeof municipioId !== 'number' || municipioId <= 0) {
      throw new Error('Invalid municipioId: must be a positive number');
    }
    const r = await this.mssqlPool.request()
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
    return r.recordset.map((row: any) => this.mapRowToColonia(row));
  }

  async findByCodigoPostal(codigoPostalId: number): Promise<Colonia[]> {
    if (!codigoPostalId || typeof codigoPostalId !== 'number' || codigoPostalId <= 0) {
      throw new Error('Invalid codigoPostalId: must be a positive number');
    }
    const r = await this.mssqlPool.request()
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
      updatedBy: row.updatedBy
    }));
  }

  async search(filters: SearchColoniasFilters): Promise<Colonia[]> {
    // BÚSQUEDA LIBRE: Sin JOINs, busca directamente en geo.Colonias
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
        c.updatedBy
      FROM geo.Colonias c
      WHERE c.NombreColonia LIKE @nombreColonia
      ORDER BY c.NombreColonia ASC
    `;

    const req = this.mssqlPool.request();
    req.input('nombreColonia', sql.VarChar(102), `%${filters.nombreColonia}%`);

    const r = await req.query(query);
    return r.recordset.map((row: any) => this.mapRowToColonia(row));
  }

  async create(municipioId: number, codigoPostalId: number, nombreColonia: string, tipoAsentamiento?: string, esValido?: boolean, userId?: string): Promise<ColoniaDetailed> {
    const transaction = this.mssqlPool.transaction();
    await transaction.begin();

    try {
      const req = transaction.request();
      req.input('municipioId', sql.Int, municipioId);
      req.input('codigoPostalId', sql.Int, codigoPostalId);
      req.input('nombreColonia', sql.VarChar(100), nombreColonia);
      if (tipoAsentamiento) {
        req.input('tipoAsentamiento', sql.VarChar(50), tipoAsentamiento);
      }
      req.input('esValido', sql.Bit, esValido ?? false);
      if (userId) {
        req.input('userId', sql.UniqueIdentifier, userId);
      }

      const result = await req.query(`
        INSERT INTO geo.Colonias (MunicipioID, CodigoPostalID, NombreColonia${tipoAsentamiento ? ', TipoAsentamiento' : ''}, EsValido${userId ? ', createdBy' : ''})
        OUTPUT INSERTED.ColoniaID
        VALUES (@municipioId, @codigoPostalId, @nombreColonia${tipoAsentamiento ? ', @tipoAsentamiento' : ''}, @esValido${userId ? ', @userId' : ''})
      `);

      await transaction.commit();

      const coloniaId = result.recordset[0].ColoniaID;
      const colonia = await this.findById(coloniaId);
      if (!colonia) {
        throw new Error('Failed to retrieve created colonia');
      }
      return colonia;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async update(coloniaId: number, nombreColonia?: string, tipoAsentamiento?: string, esValido?: boolean, userId?: string): Promise<ColoniaDetailed | undefined> {
    const transaction = this.mssqlPool.transaction();
    await transaction.begin();

    try {
      const req = transaction.request();
      req.input('coloniaId', sql.Int, coloniaId);

      const updates: string[] = [];
      if (nombreColonia !== undefined) {
        req.input('nombreColonia', sql.VarChar(100), nombreColonia);
        updates.push('NombreColonia = @nombreColonia');
      }
      if (tipoAsentamiento !== undefined) {
        req.input('tipoAsentamiento', sql.VarChar(50), tipoAsentamiento);
        updates.push('TipoAsentamiento = @tipoAsentamiento');
      }
      if (esValido !== undefined) {
        req.input('esValido', sql.Bit, esValido);
        updates.push('EsValido = @esValido');
      }
      if (userId) {
        req.input('userId', sql.UniqueIdentifier, userId);
        updates.push('updatedBy = @userId');
      }

      updates.push('updatedAt = GETDATE()');

      const result = await req.query(`
        UPDATE geo.Colonias
        SET ${updates.join(', ')}
        OUTPUT INSERTED.ColoniaID
        WHERE ColoniaID = @coloniaId
      `);

      await transaction.commit();

      if (result.recordset.length === 0) {
        return undefined;
      }

      return await this.findById(coloniaId);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async delete(coloniaId: number): Promise<number | undefined> {
    const transaction = this.mssqlPool.transaction();
    await transaction.begin();

    try {
      const req = transaction.request();
      req.input('coloniaId', sql.Int, coloniaId);

      const result = await req.query(`
        DELETE FROM geo.Colonias
        OUTPUT DELETED.ColoniaID
        WHERE ColoniaID = @coloniaId
      `);

      await transaction.commit();

      const row = result.recordset[0];
      if (!row) return undefined;
      return row.ColoniaID;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
