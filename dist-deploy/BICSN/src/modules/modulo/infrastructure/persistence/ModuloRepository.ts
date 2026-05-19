import type { ConnectionPool } from 'mssql';
import { sql } from '../../../../db/mssql.js';
import { IModuloRepository } from '../../domain/repositories/IModuloRepository.js';
import { Modulo, CreateModuloData, UpdateModuloData } from '../../domain/entities/Modulo.js';

export class ModuloRepository implements IModuloRepository {
  constructor(private mssqlPool: ConnectionPool) {}

  async findById(id: number): Promise<Modulo | undefined> {
    const result = await this.mssqlPool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT
          id,
          nombre,
          tipo,
          icono,
          orden
        FROM dbo.Modulo
        WHERE id = @id
      `);
    
    const row = result.recordset[0];
    if (!row) return undefined;
    
    return this.mapRowToModulo(row);
  }

  async findAll(): Promise<Modulo[]> {
    const result = await this.mssqlPool.request()
      .query(`
        SELECT
          id,
          nombre,
          tipo,
          icono,
          orden
        FROM dbo.Modulo
        ORDER BY orden ASC, nombre ASC
      `);
    
    return result.recordset.map(row => this.mapRowToModulo(row));
  }

  async create(data: CreateModuloData): Promise<Modulo> {
    const result = await this.mssqlPool.request()
      .input('nombre', sql.NVarChar(255), data.nombre)
      .input('tipo', sql.VarChar(50), data.tipo)
      .input('icono', sql.NVarChar(100), data.icono || null)
      .input('orden', sql.Int, data.orden || 0)
      .query(`
        INSERT INTO dbo.Modulo (nombre, tipo, icono, orden)
        OUTPUT INSERTED.*
        VALUES (@nombre, @tipo, @icono, @orden)
      `);
    
    return this.mapRowToModulo(result.recordset[0]);
  }

  async update(id: number, data: UpdateModuloData): Promise<Modulo> {
    const updates: string[] = [];
    const request = this.mssqlPool.request().input('id', sql.Int, id);

    if (data.nombre !== undefined) {
      request.input('nombre', sql.NVarChar(255), data.nombre);
      updates.push('nombre = @nombre');
    }
    if (data.tipo !== undefined) {
      request.input('tipo', sql.VarChar(50), data.tipo);
      updates.push('tipo = @tipo');
    }
    if (data.icono !== undefined) {
      request.input('icono', sql.NVarChar(100), data.icono);
      updates.push('icono = @icono');
    }
    if (data.orden !== undefined) {
      request.input('orden', sql.Int, data.orden);
      updates.push('orden = @orden');
    }

    if (updates.length === 0) {
      // Si no hay cambios, devolver el módulo actual
      const current = await this.findById(id);
      if (!current) throw new Error('MODULO_NOT_FOUND');
      return current;
    }

    const result = await request.query(`
      UPDATE dbo.Modulo
      SET ${updates.join(', ')}
      OUTPUT INSERTED.*
      WHERE id = @id
    `);

    const row = result.recordset[0];
    if (!row) throw new Error('MODULO_NOT_FOUND');
    
    return this.mapRowToModulo(row);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.mssqlPool.request()
      .input('id', sql.Int, id)
      .query(`
        DELETE FROM dbo.Modulo
        WHERE id = @id
      `);

    return result.rowsAffected[0] > 0;
  }

  async findByName(nombre: string): Promise<Modulo | undefined> {
    const result = await this.mssqlPool.request()
      .input('nombre', sql.NVarChar(255), nombre)
      .query(`
        SELECT
          id,
          nombre,
          tipo,
          icono,
          orden
        FROM dbo.Modulo
        WHERE nombre = @nombre
      `);

    const row = result.recordset[0];
    if (!row) return undefined;

    return this.mapRowToModulo(row);
  }

  async isInUse(moduloId: number): Promise<boolean> {
    const result = await this.mssqlPool.request()
      .input('moduloId', sql.Int, moduloId)
      .query(`
        SELECT COUNT(*) as count
        FROM dbo.Modulo
        WHERE id = @moduloId
      `);

    return result.recordset[0].count > 0;
  }

  private mapRowToModulo(row: any): Modulo {
    return {
      id: row.id,
      nombre: row.nombre,
      tipo: row.tipo,
      icono: row.icono,
      orden: row.orden
    };
  }
}
