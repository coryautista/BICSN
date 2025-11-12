import { sql } from '../../../../db/mssql.js';
import type { ConnectionPool } from 'mssql';
import { IMunicipioRepository } from '../../domain/repositories/IMunicipioRepository.js';
import { Municipio, CreateMunicipioData, UpdateMunicipioData } from '../../domain/entities/Municipio.js';

export class MunicipioRepository implements IMunicipioRepository {
  constructor(private mssqlPool: ConnectionPool) {}

  async findAll(): Promise<Municipio[]> {
    const result = await this.mssqlPool.request()
      .query(`
        SELECT
          MunicipioID,
          EstadoID,
          ClaveMunicipio,
          NombreMunicipio,
          EsValido
        FROM geo.Municipios
        ORDER BY EstadoID ASC, NombreMunicipio ASC
      `);
    
    return result.recordset.map(row => this.mapRowToMunicipio(row));
  }

  async findByEstado(estadoId: string): Promise<Municipio[]> {
    if (!estadoId || typeof estadoId !== 'string' || estadoId.length !== 2) {
      throw new Error('Invalid estadoId: must be a 2-character string');
    }

    const result = await this.mssqlPool.request()
      .input('estadoId', sql.Char(2), estadoId)
      .query(`
        SELECT
          MunicipioID,
          EstadoID,
          ClaveMunicipio,
          NombreMunicipio,
          EsValido
        FROM geo.Municipios
        WHERE EstadoID = @estadoId
        ORDER BY NombreMunicipio ASC
      `);
    
    return result.recordset.map(row => this.mapRowToMunicipio(row));
  }

  async findById(municipioId: number): Promise<Municipio | undefined> {
    if (!municipioId || municipioId <= 0) {
      throw new Error('Invalid municipioId: must be a positive number');
    }

    const result = await this.mssqlPool.request()
      .input('municipioId', sql.Int, municipioId)
      .query(`
        SELECT
          MunicipioID,
          EstadoID,
          ClaveMunicipio,
          NombreMunicipio,
          EsValido
        FROM geo.Municipios
        WHERE MunicipioID = @municipioId
      `);
    
    const row = result.recordset[0];
    if (!row) return undefined;
    
    return this.mapRowToMunicipio(row);
  }

  async findByClave(claveMunicipio: string): Promise<Municipio | undefined> {
    if (!claveMunicipio || typeof claveMunicipio !== 'string' || claveMunicipio.trim().length === 0) {
      throw new Error('Invalid claveMunicipio: must be a non-empty string');
    }

    const result = await this.mssqlPool.request()
      .input('claveMunicipio', sql.VarChar(3), claveMunicipio.trim())
      .query(`
        SELECT
          MunicipioID,
          EstadoID,
          ClaveMunicipio,
          NombreMunicipio,
          EsValido
        FROM geo.Municipios
        WHERE ClaveMunicipio = @claveMunicipio
      `);

    const row = result.recordset[0];
    if (!row) return undefined;

    return this.mapRowToMunicipio(row);
  }

  async create(data: CreateMunicipioData, tx?: any): Promise<Municipio> {
    if (!data.estadoId || data.estadoId.length !== 2) {
      throw new Error('Invalid estadoId: must be a 2-character string');
    }
    if (!data.claveMunicipio || data.claveMunicipio.trim().length === 0) {
      throw new Error('Invalid claveMunicipio: cannot be empty');
    }
    if (!data.nombreMunicipio || data.nombreMunicipio.trim().length === 0) {
      throw new Error('Invalid nombreMunicipio: cannot be empty');
    }

    const pool = tx || this.mssqlPool;
    
    try {
      const result = await pool.request()
        .input('estadoId', sql.Char(2), data.estadoId)
        .input('claveMunicipio', sql.VarChar(3), data.claveMunicipio)
        .input('nombreMunicipio', sql.NVarChar(100), data.nombreMunicipio)
        .input('esValido', sql.Bit, data.esValido ? 1 : 0)
        .input('userId', sql.NVarChar(128), data.userId || null)
        .query(`
          INSERT INTO geo.Municipios (EstadoID, ClaveMunicipio, NombreMunicipio, EsValido, createdBy, updatedBy)
          OUTPUT
            INSERTED.MunicipioID,
            INSERTED.EstadoID,
            INSERTED.ClaveMunicipio,
            INSERTED.NombreMunicipio,
            INSERTED.EsValido
          VALUES (@estadoId, @claveMunicipio, @nombreMunicipio, @esValido, @userId, @userId)
        `);
      
      return this.mapRowToMunicipio(result.recordset[0]);
    } catch (error: any) {
      if (error.message.includes('Violation of PRIMARY KEY constraint')) {
        throw new Error('MUNICIPIO_EXISTS');
      }
      if (error.message.includes('FOREIGN KEY constraint')) {
        throw new Error('ESTADO_NOT_FOUND');
      }
      throw error;
    }
  }

  async update(municipioId: number, data: UpdateMunicipioData, tx?: any): Promise<Municipio | undefined> {
    if (!municipioId || municipioId <= 0) {
      throw new Error('Invalid municipioId: must be a positive number');
    }
    if (data.nombreMunicipio !== undefined && (!data.nombreMunicipio || data.nombreMunicipio.trim().length === 0)) {
      throw new Error('Invalid nombreMunicipio: cannot be empty');
    }

    const updates: string[] = [];
    const pool = tx || this.mssqlPool;
    const request = pool.request().input('municipioId', sql.Int, municipioId);

    if (data.nombreMunicipio !== undefined) {
      updates.push('NombreMunicipio = @nombreMunicipio');
      request.input('nombreMunicipio', sql.NVarChar(100), data.nombreMunicipio);
    }
    if (data.esValido !== undefined) {
      updates.push('EsValido = @esValido');
      request.input('esValido', sql.Bit, data.esValido ? 1 : 0);
    }
    if (data.userId !== undefined) {
      updates.push('updatedBy = @userId');
      request.input('userId', sql.NVarChar(128), data.userId);
    }

    if (updates.length === 0) {
      return this.findById(municipioId);
    }

    await request.query(`
      UPDATE geo.Municipios
      SET ${updates.join(', ')}
      WHERE MunicipioID = @municipioId
    `);

    return this.findById(municipioId);
  }

  async delete(municipioId: number, tx?: any): Promise<boolean> {
    if (!municipioId || municipioId <= 0) {
      throw new Error('Invalid municipioId: must be a positive number');
    }

    const pool = tx || this.mssqlPool;
    const result = await pool.request()
      .input('municipioId', sql.Int, municipioId)
      .query(`
        DELETE FROM geo.Municipios
        WHERE MunicipioID = @municipioId
      `);
    
    return result.rowsAffected[0] > 0;
  }

  private mapRowToMunicipio(row: any): Municipio {
    return {
      municipioId: row.MunicipioID,
      estadoId: row.EstadoID,
      claveMunicipio: row.ClaveMunicipio,
      nombreMunicipio: row.NombreMunicipio,
      esValido: row.EsValido === 1 || row.EsValido === true
    };
  }
}
