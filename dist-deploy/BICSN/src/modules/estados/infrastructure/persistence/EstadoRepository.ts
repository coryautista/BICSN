import { ConnectionPool } from 'mssql';
import sql from 'mssql';
import { IEstadoRepository } from '../../domain/repositories/IEstadoRepository.js';
import { Estado } from '../../domain/entities/Estado.js';

export class EstadoRepository implements IEstadoRepository {
  constructor(private mssqlPool: ConnectionPool) {}

  async findAll(): Promise<Estado[]> {
    const r = await this.mssqlPool.request().query(`
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

  async findById(estadoId: string): Promise<Estado | undefined> {
    if (!estadoId || typeof estadoId !== 'string' || estadoId.length !== 2) {
      throw new Error('Invalid estadoId: must be a 2-character string');
    }
    const r = await this.mssqlPool.request()
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

  async create(estadoId: string, nombreEstado: string, esValido: boolean, userId?: string): Promise<Estado> {
    if (!estadoId || typeof estadoId !== 'string' || estadoId.length !== 2) {
      throw new Error('Invalid estadoId: must be a 2-character string');
    }
    if (!nombreEstado || typeof nombreEstado !== 'string' || nombreEstado.trim().length === 0 || nombreEstado.length > 50) {
      throw new Error('Invalid nombreEstado: must be a non-empty string with max 50 characters');
    }
    if (typeof esValido !== 'boolean') {
      throw new Error('Invalid esValido: must be a boolean');
    }

    const transaction = this.mssqlPool.transaction();
    await transaction.begin();

    try {
      const req = transaction.request();
      req.input('estadoId', sql.Char(2), estadoId);
      req.input('nombreEstado', sql.VarChar(50), nombreEstado);
      req.input('esValido', sql.Bit, esValido);
      if (userId) {
        req.input('userId', sql.UniqueIdentifier, userId);
      }

      await req.query(`
        INSERT INTO geo.Estados (EstadoID, NombreEstado, EsValido${userId ? ', createdBy' : ''})
        VALUES (@estadoId, @nombreEstado, @esValido${userId ? ', @userId' : ''})
      `);

      await transaction.commit();

      const estado = await this.findById(estadoId);
      if (!estado) {
        throw new Error('Failed to retrieve created estado');
      }
      return estado;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async update(estadoId: string, nombreEstado?: string, esValido?: boolean, userId?: string): Promise<Estado | undefined> {
    if (!estadoId || typeof estadoId !== 'string' || estadoId.length !== 2) {
      throw new Error('Invalid estadoId: must be a 2-character string');
    }
    if (nombreEstado === undefined && esValido === undefined) {
      throw new Error('At least one field must be provided for update');
    }

    const transaction = this.mssqlPool.transaction();
    await transaction.begin();

    try {
      const req = transaction.request();
      req.input('estadoId', sql.Char(2), estadoId);

      const updates: string[] = [];
      if (nombreEstado !== undefined) {
        req.input('nombreEstado', sql.VarChar(50), nombreEstado);
        updates.push('NombreEstado = @nombreEstado');
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
        UPDATE geo.Estados
        SET ${updates.join(', ')}
        OUTPUT INSERTED.EstadoID
        WHERE EstadoID = @estadoId
      `);

      await transaction.commit();

      if (result.recordset.length === 0) {
        return undefined;
      }

      return await this.findById(estadoId);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async delete(estadoId: string): Promise<string | undefined> {
    if (!estadoId || typeof estadoId !== 'string' || estadoId.length !== 2) {
      throw new Error('Invalid estadoId: must be a 2-character string');
    }

    const transaction = this.mssqlPool.transaction();
    await transaction.begin();

    try {
      const req = transaction.request();
      req.input('estadoId', sql.Char(2), estadoId);

      const result = await req.query(`
        DELETE FROM geo.Estados
        OUTPUT DELETED.EstadoID
        WHERE EstadoID = @estadoId
      `);

      await transaction.commit();

      const row = result.recordset[0];
      if (!row) return undefined;
      return row.EstadoID;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
