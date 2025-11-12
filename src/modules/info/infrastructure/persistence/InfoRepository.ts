import { sql } from '../../../../db/mssql.js';
import type { ConnectionPool } from 'mssql';
import { IInfoRepository } from '../../domain/repositories/IInfoRepository.js';
import { Info, CreateInfoData, UpdateInfoData } from '../../domain/entities/Info.js';

export class InfoRepository implements IInfoRepository {
  constructor(private mssqlPool: ConnectionPool) {}

  async findAll(): Promise<Info[]> {
    const result = await this.mssqlPool.request()
      .query(`
        SELECT
          id,
          nombre,
          icono,
          color,
          colorBotones,
          colorEncabezados,
          colorLetra,
          createdAt,
          updatedAt,
          createdBy,
          updatedBy
        FROM dbo.Info
        ORDER BY nombre ASC
      `);
    
    return result.recordset.map(row => this.mapRowToInfo(row));
  }

  async findById(id: number): Promise<Info | undefined> {
    if (!id || id <= 0) {
      throw new Error('Invalid info id: must be a positive number');
    }

    const result = await this.mssqlPool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT
          id,
          nombre,
          icono,
          color,
          colorBotones,
          colorEncabezados,
          colorLetra,
          createdAt,
          updatedAt,
          createdBy,
          updatedBy
        FROM dbo.Info
        WHERE id = @id
      `);
    
    const row = result.recordset[0];
    if (!row) return undefined;
    
    return this.mapRowToInfo(row);
  }

  async create(data: CreateInfoData): Promise<Info> {
    if (!data.nombre || data.nombre.trim().length === 0) {
      throw new Error('Invalid nombre: cannot be empty');
    }

    const createdAt = data.createdAt ?? new Date().toISOString();
    const updatedAt = data.updatedAt ?? new Date().toISOString();

    const result = await this.mssqlPool.request()
      .input('nombre', sql.NVarChar(255), data.nombre)
      .input('icono', sql.NVarChar(255), data.icono ?? null)
      .input('color', sql.NVarChar(50), data.color ?? null)
      .input('colorBotones', sql.NVarChar(50), data.colorBotones ?? null)
      .input('colorEncabezados', sql.NVarChar(50), data.colorEncabezados ?? null)
      .input('colorLetra', sql.NVarChar(50), data.colorLetra ?? null)
      .input('createdAt', sql.DateTime2, createdAt)
      .input('updatedAt', sql.DateTime2, updatedAt)
      .input('createdBy', sql.NVarChar(128), data.createdBy ?? null)
      .input('updatedBy', sql.NVarChar(128), data.updatedBy ?? null)
      .query(`
        INSERT INTO dbo.Info (nombre, icono, color, colorBotones, colorEncabezados, colorLetra, createdAt, updatedAt, createdBy, updatedBy)
        OUTPUT
          INSERTED.id,
          INSERTED.nombre,
          INSERTED.icono,
          INSERTED.color,
          INSERTED.colorBotones,
          INSERTED.colorEncabezados,
          INSERTED.colorLetra,
          INSERTED.createdAt,
          INSERTED.updatedAt,
          INSERTED.createdBy,
          INSERTED.updatedBy
        VALUES (@nombre, @icono, @color, @colorBotones, @colorEncabezados, @colorLetra, @createdAt, @updatedAt, @createdBy, @updatedBy)
      `);
    
    return this.mapRowToInfo(result.recordset[0]);
  }

  async update(id: number, data: UpdateInfoData): Promise<Info | undefined> {
    if (!id || id <= 0) {
      throw new Error('Invalid info id: must be a positive number');
    }
    if (data.nombre !== undefined && (!data.nombre || data.nombre.trim().length === 0)) {
      throw new Error('Invalid nombre: cannot be empty');
    }

    const updates: string[] = [];
    const request = this.mssqlPool.request().input('id', sql.Int, id);

    if (data.nombre !== undefined) {
      updates.push('nombre = @nombre');
      request.input('nombre', sql.NVarChar(255), data.nombre);
    }
    if (data.icono !== undefined) {
      updates.push('icono = @icono');
      request.input('icono', sql.NVarChar(255), data.icono);
    }
    if (data.color !== undefined) {
      updates.push('color = @color');
      request.input('color', sql.NVarChar(50), data.color);
    }
    if (data.colorBotones !== undefined) {
      updates.push('colorBotones = @colorBotones');
      request.input('colorBotones', sql.NVarChar(50), data.colorBotones);
    }
    if (data.colorEncabezados !== undefined) {
      updates.push('colorEncabezados = @colorEncabezados');
      request.input('colorEncabezados', sql.NVarChar(50), data.colorEncabezados);
    }
    if (data.colorLetra !== undefined) {
      updates.push('colorLetra = @colorLetra');
      request.input('colorLetra', sql.NVarChar(50), data.colorLetra);
    }
    if (data.updatedAt !== undefined) {
      updates.push('updatedAt = @updatedAt');
      request.input('updatedAt', sql.DateTime2, data.updatedAt);
    } else {
      updates.push('updatedAt = @updatedAt');
      request.input('updatedAt', sql.DateTime2, new Date().toISOString());
    }
    if (data.updatedBy !== undefined) {
      updates.push('updatedBy = @updatedBy');
      request.input('updatedBy', sql.NVarChar(128), data.updatedBy);
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    await request.query(`
      UPDATE dbo.Info
      SET ${updates.join(', ')}
      WHERE id = @id
    `);

    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    if (!id || id <= 0) {
      throw new Error('Invalid info id: must be a positive number');
    }

    const result = await this.mssqlPool.request()
      .input('id', sql.Int, id)
      .query(`
        DELETE FROM dbo.Info
        WHERE id = @id
      `);
    
    return result.rowsAffected[0] > 0;
  }

  private mapRowToInfo(row: any): Info {
    return {
      id: row.id,
      nombre: row.nombre,
      icono: row.icono,
      color: row.color,
      colorBotones: row.colorBotones,
      colorEncabezados: row.colorEncabezados,
      colorLetra: row.colorLetra,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      createdBy: row.createdBy,
      updatedBy: row.updatedBy
    };
  }
}
