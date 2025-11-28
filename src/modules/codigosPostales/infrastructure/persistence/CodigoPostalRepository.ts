import { ConnectionPool } from 'mssql';
import { ICodigoPostalRepository } from '../../domain/repositories/ICodigoPostalRepository.js';
import { CodigoPostal } from '../../domain/entities/CodigoPostal.js';
import { sql } from '../../../../db/mssql.js';

export class CodigoPostalRepository implements ICodigoPostalRepository {
  constructor(private mssqlPool: ConnectionPool) {}

  async findAll(): Promise<CodigoPostal[]> {
    const r = await this.mssqlPool.request().query(`
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

  async findById(codigoPostalId: number): Promise<CodigoPostal | undefined> {
    if (!codigoPostalId || typeof codigoPostalId !== 'number' || codigoPostalId <= 0) {
      throw new Error('Invalid codigoPostalId: must be a positive number');
    }
    const r = await this.mssqlPool.request()
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

  async findByCode(codigoPostal: string): Promise<CodigoPostal | undefined> {
    if (!codigoPostal || typeof codigoPostal !== 'string' || codigoPostal.length !== 5) {
      throw new Error('Invalid codigoPostal: must be a 5-character string');
    }
    const r = await this.mssqlPool.request()
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

  async create(codigoPostal: string, esValido: boolean, userId?: string): Promise<CodigoPostal> {
    if (!codigoPostal || typeof codigoPostal !== 'string' || codigoPostal.length !== 5) {
      throw new Error('Invalid codigoPostal: must be a 5-character string');
    }
    if (typeof esValido !== 'boolean') {
      throw new Error('Invalid esValido: must be a boolean');
    }

    const transaction = this.mssqlPool.transaction();
    await transaction.begin();

    try {
      const req = transaction.request();
      req.input('codigoPostal', sql.Char(5), codigoPostal);
      req.input('esValido', sql.Bit, esValido);
      if (userId) {
        req.input('userId', sql.UniqueIdentifier, userId);
      }

      const result = await req.query(`
        INSERT INTO geo.CodigosPostales (CodigoPostal, EsValido${userId ? ', createdBy' : ''})
        OUTPUT INSERTED.CodigoPostalID, INSERTED.CodigoPostal, INSERTED.EsValido, INSERTED.createdAt, INSERTED.updatedAt, INSERTED.createdBy, INSERTED.updatedBy
        VALUES (@codigoPostal, @esValido${userId ? ', @userId' : ''})
      `);

      await transaction.commit();

      const row = result.recordset[0];
      return {
        codigoPostalId: row.CodigoPostalID,
        codigoPostal: row.CodigoPostal,
        esValido: row.EsValido,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        createdBy: row.createdBy,
        updatedBy: row.updatedBy
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async update(codigoPostalId: number, esValido?: boolean, userId?: string): Promise<CodigoPostal | undefined> {
    if (!codigoPostalId || typeof codigoPostalId !== 'number' || codigoPostalId <= 0) {
      throw new Error('Invalid codigoPostalId: must be a positive number');
    }
    if (esValido === undefined) {
      throw new Error('At least one field must be provided for update');
    }

    const transaction = this.mssqlPool.transaction();
    await transaction.begin();

    try {
      const req = transaction.request();
      req.input('codigoPostalId', sql.Int, codigoPostalId);
      req.input('esValido', sql.Bit, esValido);
      if (userId) {
        req.input('userId', sql.UniqueIdentifier, userId);
      }

      const result = await req.query(`
        UPDATE geo.CodigosPostales
        SET EsValido = @esValido,
            updatedAt = GETDATE()
            ${userId ? ', updatedBy = @userId' : ''}
        OUTPUT INSERTED.CodigoPostalID, INSERTED.CodigoPostal, INSERTED.EsValido, INSERTED.createdAt, INSERTED.updatedAt, INSERTED.createdBy, INSERTED.updatedBy
        WHERE CodigoPostalID = @codigoPostalId
      `);

      await transaction.commit();

      const row = result.recordset[0];
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
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async delete(codigoPostalId: number): Promise<number | undefined> {
    if (!codigoPostalId || typeof codigoPostalId !== 'number' || codigoPostalId <= 0) {
      throw new Error('Invalid codigoPostalId: must be a positive number');
    }

    const transaction = this.mssqlPool.transaction();
    await transaction.begin();

    try {
      const req = transaction.request();
      req.input('codigoPostalId', sql.Int, codigoPostalId);

      const result = await req.query(`
        DELETE FROM geo.CodigosPostales
        OUTPUT DELETED.CodigoPostalID
        WHERE CodigoPostalID = @codigoPostalId
      `);

      await transaction.commit();

      const row = result.recordset[0];
      if (!row) return undefined;
      return row.CodigoPostalID;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
