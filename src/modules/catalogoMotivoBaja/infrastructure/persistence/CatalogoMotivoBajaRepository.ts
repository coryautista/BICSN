import { ConnectionPool } from 'mssql';
import sql from 'mssql';
import {
  CatalogoMotivoBaja,
  CreateCatalogoMotivoBajaData,
  ListCatalogoMotivoBajaFilters,
  UpdateCatalogoMotivoBajaData
} from '../../domain/entities/CatalogoMotivoBaja.js';
import { CatalogoMotivoBajaConflictError, CatalogoMotivoBajaNotFoundError } from '../../domain/errors.js';
import { ICatalogoMotivoBajaRepository } from '../../domain/repositories/ICatalogoMotivoBajaRepository.js';

export class CatalogoMotivoBajaRepository implements ICatalogoMotivoBajaRepository {
  constructor(private mssqlPool: ConnectionPool) {}

  private mapRow(row: any): CatalogoMotivoBaja {
    return {
      motivoBajaId: Number(row.MotivoBajaId),
      clave: String(row.Clave),
      nombre: String(row.Nombre),
      descripcion: row.Descripcion ?? null,
      aplicaBajaPermanente: row.AplicaBajaPermanente === true || row.AplicaBajaPermanente === 1,
      aplicaSuspension: row.AplicaSuspension === true || row.AplicaSuspension === 1,
      requiereObservaciones: row.RequiereObservaciones === true || row.RequiereObservaciones === 1,
      activo: row.Activo === true || row.Activo === 1,
      orden: Number(row.Orden ?? 0),
      createdAt: row.CreatedAt?.toISOString?.() ?? String(row.CreatedAt),
      updatedAt: row.UpdatedAt ? (row.UpdatedAt?.toISOString?.() ?? String(row.UpdatedAt)) : null,
      createdBy: row.CreatedBy ?? null,
      updatedBy: row.UpdatedBy ?? null
    };
  }

  async findAll(filters: ListCatalogoMotivoBajaFilters = {}): Promise<CatalogoMotivoBaja[]> {
    const request = this.mssqlPool.request();
    let query = `
      SELECT MotivoBajaId, Clave, Nombre, Descripcion, AplicaBajaPermanente,
        AplicaSuspension, RequiereObservaciones, Activo, Orden,
        CreatedAt, UpdatedAt, CreatedBy, UpdatedBy
      FROM afi.CatalogoMotivoBaja
      WHERE 1=1
    `;

    if (filters.activo !== undefined) {
      query += ' AND Activo = @activo';
      request.input('activo', sql.Bit, filters.activo);
    }
    if (filters.aplicaBajaPermanente !== undefined) {
      query += ' AND AplicaBajaPermanente = @aplicaBajaPermanente';
      request.input('aplicaBajaPermanente', sql.Bit, filters.aplicaBajaPermanente);
    }
    if (filters.aplicaSuspension !== undefined) {
      query += ' AND AplicaSuspension = @aplicaSuspension';
      request.input('aplicaSuspension', sql.Bit, filters.aplicaSuspension);
    }
    if (filters.requiereObservaciones !== undefined) {
      query += ' AND RequiereObservaciones = @requiereObservaciones';
      request.input('requiereObservaciones', sql.Bit, filters.requiereObservaciones);
    }
    if (filters.search) {
      query += ' AND (Clave LIKE @search OR Nombre LIKE @search OR Descripcion LIKE @search)';
      request.input('search', sql.NVarChar(110), `%${filters.search}%`);
    }

    query += ' ORDER BY Orden ASC, Nombre ASC, MotivoBajaId ASC';
    const result = await request.query(query);
    return result.recordset.map((row) => this.mapRow(row));
  }

  async findById(id: number): Promise<CatalogoMotivoBaja | undefined> {
    const result = await this.mssqlPool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT MotivoBajaId, Clave, Nombre, Descripcion, AplicaBajaPermanente,
          AplicaSuspension, RequiereObservaciones, Activo, Orden,
          CreatedAt, UpdatedAt, CreatedBy, UpdatedBy
        FROM afi.CatalogoMotivoBaja
        WHERE MotivoBajaId = @id
      `);
    return result.recordset[0] ? this.mapRow(result.recordset[0]) : undefined;
  }

  async create(data: CreateCatalogoMotivoBajaData): Promise<CatalogoMotivoBaja> {
    await this.ensureUniqueClave(data.clave);
    const result = await this.mssqlPool.request()
      .input('clave', sql.VarChar(30), data.clave.trim().toUpperCase())
      .input('nombre', sql.NVarChar(100), data.nombre.trim())
      .input('descripcion', sql.NVarChar(500), data.descripcion ?? null)
      .input('aplicaBajaPermanente', sql.Bit, data.aplicaBajaPermanente ?? true)
      .input('aplicaSuspension', sql.Bit, data.aplicaSuspension ?? false)
      .input('requiereObservaciones', sql.Bit, data.requiereObservaciones ?? false)
      .input('activo', sql.Bit, data.activo ?? true)
      .input('orden', sql.Int, data.orden ?? 0)
      .input('usuario', sql.NVarChar(100), data.usuario ?? null)
      .query(`
        INSERT INTO afi.CatalogoMotivoBaja (
          Clave, Nombre, Descripcion, AplicaBajaPermanente, AplicaSuspension,
          RequiereObservaciones, Activo, Orden, CreatedBy
        )
        OUTPUT INSERTED.*
        VALUES (
          @clave, @nombre, @descripcion, @aplicaBajaPermanente, @aplicaSuspension,
          @requiereObservaciones, @activo, @orden, @usuario
        )
      `);
    return this.mapRow(result.recordset[0]);
  }

  async update(data: UpdateCatalogoMotivoBajaData): Promise<CatalogoMotivoBaja> {
    const current = await this.findById(data.motivoBajaId);
    if (!current) throw new CatalogoMotivoBajaNotFoundError();

    const nextClave = data.clave ? data.clave.trim().toUpperCase() : current.clave;
    if (nextClave !== current.clave) {
      await this.ensureUniqueClave(nextClave, data.motivoBajaId);
    }

    const result = await this.mssqlPool.request()
      .input('id', sql.Int, data.motivoBajaId)
      .input('clave', sql.VarChar(30), nextClave)
      .input('nombre', sql.NVarChar(100), data.nombre !== undefined ? data.nombre.trim() : current.nombre)
      .input('descripcion', sql.NVarChar(500), data.descripcion !== undefined ? data.descripcion : current.descripcion)
      .input('aplicaBajaPermanente', sql.Bit, data.aplicaBajaPermanente !== undefined ? data.aplicaBajaPermanente : current.aplicaBajaPermanente)
      .input('aplicaSuspension', sql.Bit, data.aplicaSuspension !== undefined ? data.aplicaSuspension : current.aplicaSuspension)
      .input('requiereObservaciones', sql.Bit, data.requiereObservaciones !== undefined ? data.requiereObservaciones : current.requiereObservaciones)
      .input('activo', sql.Bit, data.activo !== undefined ? data.activo : current.activo)
      .input('orden', sql.Int, data.orden !== undefined ? data.orden : current.orden)
      .input('usuario', sql.NVarChar(100), data.usuario ?? null)
      .query(`
        UPDATE afi.CatalogoMotivoBaja
        SET Clave = @clave,
            Nombre = @nombre,
            Descripcion = @descripcion,
            AplicaBajaPermanente = @aplicaBajaPermanente,
            AplicaSuspension = @aplicaSuspension,
            RequiereObservaciones = @requiereObservaciones,
            Activo = @activo,
            Orden = @orden,
            UpdatedAt = SYSDATETIME(),
            UpdatedBy = @usuario
        OUTPUT INSERTED.*
        WHERE MotivoBajaId = @id
      `);
    return this.mapRow(result.recordset[0]);
  }

  async deactivate(id: number, usuario?: string | null): Promise<CatalogoMotivoBaja> {
    const result = await this.mssqlPool.request()
      .input('id', sql.Int, id)
      .input('usuario', sql.NVarChar(100), usuario ?? null)
      .query(`
        UPDATE afi.CatalogoMotivoBaja
        SET Activo = 0, UpdatedAt = SYSDATETIME(), UpdatedBy = @usuario
        OUTPUT INSERTED.*
        WHERE MotivoBajaId = @id
      `);
    if (!result.recordset[0]) throw new CatalogoMotivoBajaNotFoundError();
    return this.mapRow(result.recordset[0]);
  }

  private async ensureUniqueClave(clave: string, exceptId?: number): Promise<void> {
    const request = this.mssqlPool.request()
      .input('clave', sql.VarChar(30), clave.trim().toUpperCase());
    let query = `
      SELECT TOP 1 MotivoBajaId
      FROM afi.CatalogoMotivoBaja
      WHERE Clave = @clave
    `;
    if (exceptId !== undefined) {
      query += ' AND MotivoBajaId <> @exceptId';
      request.input('exceptId', sql.Int, exceptId);
    }
    const result = await request.query(query);
    if (result.recordset.length > 0) throw new CatalogoMotivoBajaConflictError();
  }
}
