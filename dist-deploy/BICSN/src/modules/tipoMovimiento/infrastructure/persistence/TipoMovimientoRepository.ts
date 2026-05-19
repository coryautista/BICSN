import { ConnectionPool } from 'mssql';
import sql from 'mssql';
import { ITipoMovimientoRepository } from '../../domain/repositories/ITipoMovimientoRepository.js';
import { TipoMovimiento } from '../../domain/entities/TipoMovimiento.js';

export class TipoMovimientoRepository implements ITipoMovimientoRepository {
  constructor(private mssqlPool: ConnectionPool) {}

  async findAll(): Promise<TipoMovimiento[]> {
    const result = await this.mssqlPool.request()
      .query(`
        SELECT
          id,
          abreviatura,
          nombre
        FROM afi.TipoMovimiento
        ORDER BY id
      `);
    
    return result.recordset.map((row: any) => ({
      id: row.id,
      abreviatura: row.abreviatura,
      nombre: row.nombre
    }));
  }

  async findById(id: number): Promise<TipoMovimiento | undefined> {
    const result = await this.mssqlPool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT
          id,
          abreviatura,
          nombre
        FROM afi.TipoMovimiento
        WHERE id = @id
      `);
    
    const row = result.recordset[0];
    if (!row) return undefined;
    
    return {
      id: row.id,
      abreviatura: row.abreviatura,
      nombre: row.nombre
    };
  }

  async create(data: { id: number; abreviatura: string | null; nombre: string }): Promise<TipoMovimiento> {
    // Validaciones
    if (!data.nombre || data.nombre.trim().length === 0) {
      throw new Error('Nombre is required');
    }
    if (data.nombre.length > 64) {
      throw new Error('Nombre must not exceed 64 characters');
    }
    if (data.abreviatura && data.abreviatura.length > 1) {
      throw new Error('Abreviatura must not exceed 1 character');
    }

    const result = await this.mssqlPool.request()
      .input('id', sql.Int, data.id)
      .input('abreviatura', sql.Char(1), data.abreviatura)
      .input('nombre', sql.NVarChar(64), data.nombre)
      .query(`
        INSERT INTO afi.TipoMovimiento (id, abreviatura, nombre)
        VALUES (@id, @abreviatura, @nombre)
        SELECT
          id,
          abreviatura,
          nombre
        FROM afi.TipoMovimiento
        WHERE id = @id
      `);
    
    const row = result.recordset[0];
    return {
      id: row.id,
      abreviatura: row.abreviatura,
      nombre: row.nombre
    };
  }

  async update(id: number, data: { abreviatura?: string | null; nombre?: string }): Promise<TipoMovimiento> {
    // Validaciones
    if (data.nombre !== undefined) {
      if (!data.nombre || data.nombre.trim().length === 0) {
        throw new Error('Nombre is required');
      }
      if (data.nombre.length > 64) {
        throw new Error('Nombre must not exceed 64 characters');
      }
    }
    if (data.abreviatura !== undefined && data.abreviatura && data.abreviatura.length > 1) {
      throw new Error('Abreviatura must not exceed 1 character');
    }

    const updates: string[] = [];
    const request = this.mssqlPool.request().input('id', sql.Int, id);

    if (data.abreviatura !== undefined) {
      updates.push('abreviatura = @abreviatura');
      request.input('abreviatura', sql.Char(1), data.abreviatura);
    }
    if (data.nombre !== undefined) {
      updates.push('nombre = @nombre');
      request.input('nombre', sql.NVarChar(64), data.nombre);
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    const updateQuery = `
      UPDATE afi.TipoMovimiento
      SET ${updates.join(', ')}
      WHERE id = @id
      SELECT
        id,
        abreviatura,
        nombre
      FROM afi.TipoMovimiento
      WHERE id = @id
    `;

    const result = await request.query(updateQuery);
    const row = result.recordset[0];
    if (!row) {
      throw new Error('TIPO_MOVIMIENTO_NOT_FOUND');
    }
    
    return {
      id: row.id,
      abreviatura: row.abreviatura,
      nombre: row.nombre
    };
  }

  async delete(id: number): Promise<void> {
    const result = await this.mssqlPool.request()
      .input('id', sql.Int, id)
      .query(`
        DELETE FROM afi.TipoMovimiento
        WHERE id = @id
        SELECT @@ROWCOUNT as deletedCount
      `);
    
    if (result.recordset[0].deletedCount === 0) {
      throw new Error('TIPO_MOVIMIENTO_NOT_FOUND');
    }
  }
}
