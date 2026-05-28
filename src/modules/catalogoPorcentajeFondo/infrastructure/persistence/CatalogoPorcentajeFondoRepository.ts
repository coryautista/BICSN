import { ConnectionPool } from 'mssql';
import sql from 'mssql';
import {
  CatalogoPorcentajeFondo,
  CreateCatalogoPorcentajeFondoData,
  ListCatalogoPorcentajeFondoFilters,
  TipoFondoCatalogo,
  UpdateCatalogoPorcentajeFondoData
} from '../../domain/entities/CatalogoPorcentajeFondo.js';
import { ICatalogoPorcentajeFondoRepository } from '../../domain/repositories/ICatalogoPorcentajeFondoRepository.js';
import { CatalogoPorcentajeFondoConflictError, CatalogoPorcentajeFondoNotFoundError } from '../../domain/errors.js';

export class CatalogoPorcentajeFondoRepository implements ICatalogoPorcentajeFondoRepository {
  constructor(private mssqlPool: ConnectionPool) {}

  private mapRow(row: any): CatalogoPorcentajeFondo {
    return {
      catalogoPorcentajeFondoId: Number(row.CatalogoPorcentajeFondoId),
      tipoFondo: row.TipoFondo,
      anioVigencia: Number(row.AnioVigencia),
      porcentajePatron: Number(row.PorcentajePatron),
      porcentajeAfiliado: row.PorcentajeAfiliado == null ? null : Number(row.PorcentajeAfiliado),
      vigente: row.Vigente === true || row.Vigente === 1,
      observaciones: row.Observaciones ?? null,
      createdAt: row.CreatedAt?.toISOString?.() ?? String(row.CreatedAt),
      updatedAt: row.UpdatedAt ? (row.UpdatedAt?.toISOString?.() ?? String(row.UpdatedAt)) : null,
      createdBy: row.CreatedBy ?? null,
      updatedBy: row.UpdatedBy ?? null
    };
  }

  async findAll(filters: ListCatalogoPorcentajeFondoFilters = {}): Promise<CatalogoPorcentajeFondo[]> {
    const request = this.mssqlPool.request();
    let query = `
      SELECT CatalogoPorcentajeFondoId, TipoFondo, AnioVigencia, PorcentajePatron,
        PorcentajeAfiliado, Vigente, Observaciones, CreatedAt, UpdatedAt, CreatedBy, UpdatedBy
      FROM aportaciones.CatalogoPorcentajeFondo
      WHERE 1=1
    `;

    if (filters.tipoFondo) {
      query += ' AND TipoFondo = @tipoFondo';
      request.input('tipoFondo', sql.VarChar(30), filters.tipoFondo);
    }
    if (filters.anioVigencia !== undefined) {
      query += ' AND AnioVigencia = @anioVigencia';
      request.input('anioVigencia', sql.SmallInt, filters.anioVigencia);
    }
    if (filters.vigente !== undefined) {
      query += ' AND Vigente = @vigente';
      request.input('vigente', sql.Bit, filters.vigente);
    }

    query += ' ORDER BY TipoFondo, AnioVigencia DESC, CatalogoPorcentajeFondoId DESC';
    const result = await request.query(query);
    return result.recordset.map((row) => this.mapRow(row));
  }

  async findById(id: number): Promise<CatalogoPorcentajeFondo | undefined> {
    const result = await this.mssqlPool.request()
      .input('id', sql.BigInt, id)
      .query(`
        SELECT CatalogoPorcentajeFondoId, TipoFondo, AnioVigencia, PorcentajePatron,
          PorcentajeAfiliado, Vigente, Observaciones, CreatedAt, UpdatedAt, CreatedBy, UpdatedBy
        FROM aportaciones.CatalogoPorcentajeFondo
        WHERE CatalogoPorcentajeFondoId = @id
      `);
    return result.recordset[0] ? this.mapRow(result.recordset[0]) : undefined;
  }

  async findUltimoVigente(tipoFondo: TipoFondoCatalogo): Promise<CatalogoPorcentajeFondo | undefined> {
    const result = await this.mssqlPool.request()
      .input('tipoFondo', sql.VarChar(30), tipoFondo)
      .query(`
        SELECT TOP 1 CatalogoPorcentajeFondoId, TipoFondo, AnioVigencia, PorcentajePatron,
          PorcentajeAfiliado, Vigente, Observaciones, CreatedAt, UpdatedAt, CreatedBy, UpdatedBy
        FROM aportaciones.CatalogoPorcentajeFondo
        WHERE TipoFondo = @tipoFondo AND Vigente = 1
        ORDER BY AnioVigencia DESC, CatalogoPorcentajeFondoId DESC
      `);
    return result.recordset[0] ? this.mapRow(result.recordset[0]) : undefined;
  }

  async create(data: CreateCatalogoPorcentajeFondoData): Promise<CatalogoPorcentajeFondo> {
    const transaction = new sql.Transaction(this.mssqlPool);
    await transaction.begin();
    try {
      await this.ensureUniqueYear(data.tipoFondo, data.anioVigencia, transaction);
      if (data.vigente ?? true) {
        await this.deactivateOthers(data.tipoFondo, transaction, data.usuario);
      }

      const result = await transaction.request()
        .input('tipoFondo', sql.VarChar(30), data.tipoFondo)
        .input('anioVigencia', sql.SmallInt, data.anioVigencia)
        .input('porcentajePatron', sql.Decimal(9, 6), data.porcentajePatron)
        .input('porcentajeAfiliado', sql.Decimal(9, 6), data.porcentajeAfiliado ?? null)
        .input('vigente', sql.Bit, data.vigente ?? true)
        .input('observaciones', sql.NVarChar(500), data.observaciones ?? null)
        .input('usuario', sql.NVarChar(100), data.usuario ?? null)
        .query(`
          INSERT INTO aportaciones.CatalogoPorcentajeFondo (
            TipoFondo, AnioVigencia, PorcentajePatron, PorcentajeAfiliado,
            Vigente, Observaciones, CreatedBy
          )
          OUTPUT INSERTED.*
          VALUES (
            @tipoFondo, @anioVigencia, @porcentajePatron, @porcentajeAfiliado,
            @vigente, @observaciones, @usuario
          )
        `);
      await transaction.commit();
      return this.mapRow(result.recordset[0]);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async update(data: UpdateCatalogoPorcentajeFondoData): Promise<CatalogoPorcentajeFondo> {
    const current = await this.findById(data.catalogoPorcentajeFondoId);
    if (!current) throw new CatalogoPorcentajeFondoNotFoundError();

    const transaction = new sql.Transaction(this.mssqlPool);
    await transaction.begin();
    try {
      const nextAnio = data.anioVigencia ?? current.anioVigencia;
      if (nextAnio !== current.anioVigencia) {
        await this.ensureUniqueYear(current.tipoFondo, nextAnio, transaction, data.catalogoPorcentajeFondoId);
      }
      if (data.vigente === true) {
        await this.deactivateOthers(current.tipoFondo, transaction, data.usuario, data.catalogoPorcentajeFondoId);
      }

      const result = await transaction.request()
        .input('id', sql.BigInt, data.catalogoPorcentajeFondoId)
        .input('anioVigencia', sql.SmallInt, nextAnio)
        .input('porcentajePatron', sql.Decimal(9, 6), data.porcentajePatron ?? current.porcentajePatron)
        .input('porcentajeAfiliado', sql.Decimal(9, 6), data.porcentajeAfiliado !== undefined ? data.porcentajeAfiliado : current.porcentajeAfiliado)
        .input('vigente', sql.Bit, data.vigente !== undefined ? data.vigente : current.vigente)
        .input('observaciones', sql.NVarChar(500), data.observaciones !== undefined ? data.observaciones : current.observaciones)
        .input('usuario', sql.NVarChar(100), data.usuario ?? null)
        .query(`
          UPDATE aportaciones.CatalogoPorcentajeFondo
          SET AnioVigencia = @anioVigencia,
              PorcentajePatron = @porcentajePatron,
              PorcentajeAfiliado = @porcentajeAfiliado,
              Vigente = @vigente,
              Observaciones = @observaciones,
              UpdatedAt = SYSUTCDATETIME(),
              UpdatedBy = @usuario
          OUTPUT INSERTED.*
          WHERE CatalogoPorcentajeFondoId = @id
        `);
      await transaction.commit();
      return this.mapRow(result.recordset[0]);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async deactivate(id: number, usuario?: string | null): Promise<CatalogoPorcentajeFondo> {
    const result = await this.mssqlPool.request()
      .input('id', sql.BigInt, id)
      .input('usuario', sql.NVarChar(100), usuario ?? null)
      .query(`
        UPDATE aportaciones.CatalogoPorcentajeFondo
        SET Vigente = 0, UpdatedAt = SYSUTCDATETIME(), UpdatedBy = @usuario
        OUTPUT INSERTED.*
        WHERE CatalogoPorcentajeFondoId = @id
      `);
    if (!result.recordset[0]) throw new CatalogoPorcentajeFondoNotFoundError();
    return this.mapRow(result.recordset[0]);
  }

  private async deactivateOthers(tipoFondo: TipoFondoCatalogo, transaction: sql.Transaction, usuario?: string | null, exceptId?: number): Promise<void> {
    const request = transaction.request()
      .input('tipoFondo', sql.VarChar(30), tipoFondo)
      .input('usuario', sql.NVarChar(100), usuario ?? null);
    let query = `
      UPDATE aportaciones.CatalogoPorcentajeFondo
      SET Vigente = 0, UpdatedAt = SYSUTCDATETIME(), UpdatedBy = @usuario
      WHERE TipoFondo = @tipoFondo AND Vigente = 1
    `;
    if (exceptId !== undefined) {
      query += ' AND CatalogoPorcentajeFondoId <> @exceptId';
      request.input('exceptId', sql.BigInt, exceptId);
    }
    await request.query(query);
  }

  private async ensureUniqueYear(tipoFondo: TipoFondoCatalogo, anioVigencia: number, transaction: sql.Transaction, exceptId?: number): Promise<void> {
    const request = transaction.request()
      .input('tipoFondo', sql.VarChar(30), tipoFondo)
      .input('anioVigencia', sql.SmallInt, anioVigencia);
    let query = `
      SELECT TOP 1 CatalogoPorcentajeFondoId
      FROM aportaciones.CatalogoPorcentajeFondo
      WHERE TipoFondo = @tipoFondo AND AnioVigencia = @anioVigencia
    `;
    if (exceptId !== undefined) {
      query += ' AND CatalogoPorcentajeFondoId <> @exceptId';
      request.input('exceptId', sql.BigInt, exceptId);
    }
    const result = await request.query(query);
    if (result.recordset.length > 0) throw new CatalogoPorcentajeFondoConflictError();
  }
}
