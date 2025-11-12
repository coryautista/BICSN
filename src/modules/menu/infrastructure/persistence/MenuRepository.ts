import { sql } from '../../../../db/mssql.js';
import type { ConnectionPool } from 'mssql';
import { IMenuRepository } from '../../domain/repositories/IMenuRepository.js';
import { Menu, CreateMenuData, UpdateMenuData } from '../../domain/entities/Menu.js';

export class MenuRepository implements IMenuRepository {
  constructor(private mssqlPool: ConnectionPool) {}

  async findById(id: number): Promise<Menu | undefined> {
    if (!id || id <= 0) {
      throw new Error('Invalid menu id: must be a positive number');
    }

    const result = await this.mssqlPool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT
          id,
          nombre,
          componente,
          parentId,
          icono,
          orden
        FROM dbo.Menu
        WHERE id = @id
      `);

    const row = result.recordset[0];
    if (!row) return undefined;

    return this.mapRowToMenu(row);
  }

  async findAll(): Promise<Menu[]> {
    const result = await this.mssqlPool.request().query(`
      SELECT
        id,
        nombre,
        componente,
        parentId,
        icono,
        orden
      FROM dbo.Menu
      ORDER BY orden ASC, nombre ASC
    `);

    return result.recordset.map((row: any) => this.mapRowToMenu(row));
  }

  async findByName(nombre: string): Promise<Menu | undefined> {
    if (!nombre || nombre.trim().length === 0) {
      throw new Error('Invalid nombre: cannot be empty');
    }

    const result = await this.mssqlPool.request()
      .input('nombre', sql.NVarChar(255), nombre.trim())
      .query(`
        SELECT
          id,
          nombre,
          componente,
          parentId,
          icono,
          orden
        FROM dbo.Menu
        WHERE nombre = @nombre
      `);

    const row = result.recordset[0];
    if (!row) return undefined;

    return this.mapRowToMenu(row);
  }

  async create(data: CreateMenuData): Promise<Menu> {
    if (!data.nombre || data.nombre.trim().length === 0) {
      throw new Error('Invalid nombre: cannot be empty');
    }
    if (data.orden === undefined || data.orden < 0) {
      throw new Error('Invalid orden: must be a non-negative number');
    }
    if (data.parentId !== undefined && data.parentId !== null && data.parentId <= 0) {
      throw new Error('Invalid parentId: must be a positive number or undefined');
    }

    // Get the next ID from the sequence or max+1
    const maxIdResult = await this.mssqlPool.request()
      .query(`SELECT ISNULL(MAX(id), 0) + 1 as nextId FROM dbo.Menu`);
    const nextId = maxIdResult.recordset[0].nextId;

    // Insert with explicit ID (table doesn't have IDENTITY)
    await this.mssqlPool.request()
      .input('id', sql.Int, nextId)
      .input('nombre', sql.NVarChar(255), data.nombre)
      .input('componente', sql.NVarChar(255), data.componente ?? null)
      .input('parentId', sql.Int, data.parentId ?? null)
      .input('icono', sql.NVarChar(255), data.icono ?? null)
      .input('orden', sql.Int, data.orden)
      .query(`
        INSERT INTO dbo.Menu (id, nombre, componente, parentId, icono, orden)
        VALUES (@id, @nombre, @componente, @parentId, @icono, @orden)
      `);

    // Retrieve the inserted record
    const result = await this.mssqlPool.request()
      .input('id', sql.Int, nextId)
      .query(`
        SELECT
          id,
          nombre,
          componente,
          parentId,
          icono,
          orden
        FROM dbo.Menu
        WHERE id = @id
      `);

    return this.mapRowToMenu(result.recordset[0]);
  }

  async update(id: number, data: UpdateMenuData): Promise<Menu | undefined> {
    if (!id || id <= 0) {
      throw new Error('Invalid menu id: must be a positive number');
    }
    if (data.nombre !== undefined && (!data.nombre || data.nombre.trim().length === 0)) {
      throw new Error('Invalid nombre: cannot be empty');
    }
    if (data.orden !== undefined && data.orden < 0) {
      throw new Error('Invalid orden: must be a non-negative number');
    }
    if (data.parentId !== undefined && data.parentId !== null && data.parentId <= 0) {
      throw new Error('Invalid parentId: must be a positive number or undefined');
    }

    const updates: string[] = [];
    const request = this.mssqlPool.request().input('id', sql.Int, id);

    if (data.nombre !== undefined) {
      updates.push('nombre = @nombre');
      request.input('nombre', sql.NVarChar(255), data.nombre);
    }
    if (data.componente !== undefined) {
      updates.push('componente = @componente');
      request.input('componente', sql.NVarChar(255), data.componente);
    }
    if (data.parentId !== undefined) {
      updates.push('parentId = @parentId');
      request.input('parentId', sql.Int, data.parentId);
    }
    if (data.icono !== undefined) {
      updates.push('icono = @icono');
      request.input('icono', sql.NVarChar(255), data.icono);
    }
    if (data.orden !== undefined) {
      updates.push('orden = @orden');
      request.input('orden', sql.Int, data.orden);
    }

    if (updates.length === 0) {
      // No updates to perform, just return the current record
      return this.findById(id);
    }

    await request.query(`
      UPDATE dbo.Menu
      SET ${updates.join(', ')}
      WHERE id = @id
    `);

    // Retrieve the updated record
    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    if (!id || id <= 0) {
      throw new Error('Invalid menu id: must be a positive number');
    }

    const result = await this.mssqlPool.request()
      .input('id', sql.Int, id)
      .query(`
        DELETE FROM dbo.Menu
        WHERE id = @id
      `);

    return result.rowsAffected[0] > 0;
  }

  async hasChildren(parentId: number): Promise<boolean> {
    const result = await this.mssqlPool.request()
      .input('parentId', sql.Int, parentId)
      .query(`
        SELECT COUNT(*) as count
        FROM dbo.Menu
        WHERE parentId = @parentId
      `);

    return result.recordset[0].count > 0;
  }

  private mapRowToMenu(row: any): Menu {
    return {
      id: row.id,
      nombre: row.nombre,
      componente: row.componente,
      parentId: row.parentId,
      icono: row.icono,
      orden: row.orden
    };
  }
}
