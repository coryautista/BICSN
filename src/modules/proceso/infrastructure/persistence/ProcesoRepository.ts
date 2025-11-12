import { ConnectionPool } from 'mssql';
import sql from 'mssql';
import { IProcesoRepository } from '../../domain/repositories/IProcesoRepository.js';
import { Proceso, CreateProcesoData, UpdateProcesoData } from '../../domain/entities/Proceso.js';

export class ProcesoRepository implements IProcesoRepository {
  constructor(private mssqlPool: ConnectionPool) {}

  async findAll(): Promise<Proceso[]> {
    const result = await this.mssqlPool.request().query(`
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

    return result.recordset.map((row: any) => ({
      id: row.id,
      nombre: row.nombre,
      componente: row.componente,
      idModulo: row.idModulo,
      orden: row.orden,
      tipo: row.tipo
    }));
  }

  async findById(id: number): Promise<Proceso | undefined> {
    if (!id || id <= 0 || !Number.isInteger(id)) {
      throw new Error('Invalid id: must be a positive integer');
    }

    const result = await this.mssqlPool.request()
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

    const row = result.recordset[0];
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

  async create(data: CreateProcesoData, tx?: any): Promise<Proceso> {
    // Validations
    if (!data.nombre || typeof data.nombre !== 'string' || data.nombre.trim().length === 0 || data.nombre.length > 4000) {
      throw new Error('Invalid nombre: must be a non-empty string with max 4000 characters');
    }
    if (!data.componente || typeof data.componente !== 'string' || data.componente.length > 4000) {
      throw new Error('Invalid componente: must be a string with max 4000 characters');
    }
    if (!data.idModulo || data.idModulo <= 0 || !Number.isInteger(data.idModulo)) {
      throw new Error('Invalid idModulo: must be a positive integer');
    }
    if (data.orden === undefined || data.orden < 0 || !Number.isInteger(data.orden)) {
      throw new Error('Invalid orden: must be a non-negative integer');
    }
    if (!data.tipo || typeof data.tipo !== 'string' || data.tipo.trim().length === 0 || data.tipo.length > 50) {
      throw new Error('Invalid tipo: must be a non-empty string with max 50 characters');
    }

    const pool = tx || this.mssqlPool;
    const result = await pool.request()
      .input('nombre', sql.NVarChar(4000), data.nombre)
      .input('componente', sql.NVarChar(4000), data.componente)
      .input('idModulo', sql.Int, data.idModulo)
      .input('orden', sql.Int, data.orden)
      .input('tipo', sql.NVarChar(50), data.tipo)
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

    const row = result.recordset[0];
    return {
      id: row.id,
      nombre: row.nombre,
      componente: row.componente,
      idModulo: row.idModulo,
      orden: row.orden,
      tipo: row.tipo
    };
  }

  async update(id: number, data: UpdateProcesoData, tx?: any): Promise<Proceso | undefined> {
    if (!id || id <= 0 || !Number.isInteger(id)) {
      throw new Error('Invalid id: must be a positive integer');
    }

    // Validations
    if (data.nombre !== undefined && (!data.nombre || typeof data.nombre !== 'string' || data.nombre.trim().length === 0 || data.nombre.length > 4000)) {
      throw new Error('Invalid nombre: must be a non-empty string with max 4000 characters');
    }
    if (data.componente !== undefined && (!data.componente || typeof data.componente !== 'string' || data.componente.length > 4000)) {
      throw new Error('Invalid componente: must be a string with max 4000 characters');
    }
    if (data.idModulo !== undefined && (!data.idModulo || data.idModulo <= 0 || !Number.isInteger(data.idModulo))) {
      throw new Error('Invalid idModulo: must be a positive integer');
    }
    if (data.orden !== undefined && (data.orden < 0 || !Number.isInteger(data.orden))) {
      throw new Error('Invalid orden: must be a non-negative integer');
    }
    if (data.tipo !== undefined && (!data.tipo || typeof data.tipo !== 'string' || data.tipo.trim().length === 0 || data.tipo.length > 50)) {
      throw new Error('Invalid tipo: must be a non-empty string with max 50 characters');
    }

    const sets: string[] = [];
    const pool = tx || this.mssqlPool;
    const request = pool.request().input('id', sql.Int, id);

    if (data.nombre !== undefined) {
      request.input('nombre', sql.NVarChar(4000), data.nombre);
      sets.push('nombre = @nombre');
    }
    if (data.componente !== undefined) {
      request.input('componente', sql.NVarChar(4000), data.componente);
      sets.push('componente = @componente');
    }
    if (data.idModulo !== undefined) {
      request.input('idModulo', sql.Int, data.idModulo);
      sets.push('idModulo = @idModulo');
    }
    if (data.orden !== undefined) {
      request.input('orden', sql.Int, data.orden);
      sets.push('orden = @orden');
    }
    if (data.tipo !== undefined) {
      request.input('tipo', sql.NVarChar(50), data.tipo);
      sets.push('tipo = @tipo');
    }

    if (sets.length === 0) {
      throw new Error('No fields to update');
    }

    const result = await request.query(`
      UPDATE dbo.Proceso
      SET ${sets.join(', ')}
      OUTPUT
        INSERTED.id,
        INSERTED.nombre,
        INSERTED.componente,
        INSERTED.idModulo,
        INSERTED.orden,
        INSERTED.tipo
      WHERE id = @id
    `);

    const row = result.recordset[0];
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

  async delete(id: number, tx?: any): Promise<boolean> {
    if (!id || id <= 0 || !Number.isInteger(id)) {
      throw new Error('Invalid id: must be a positive integer');
    }

    const pool = tx || this.mssqlPool;
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        DELETE FROM dbo.Proceso
        OUTPUT DELETED.id
        WHERE id = @id
      `);

    return result.recordset.length > 0;
  }
}
