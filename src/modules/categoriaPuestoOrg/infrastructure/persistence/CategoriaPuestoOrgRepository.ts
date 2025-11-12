import { ConnectionPool } from 'mssql';
import { ICategoriaPuestoOrgRepository } from '../../domain/repositories/ICategoriaPuestoOrgRepository.js';
import { CategoriaPuestoOrg, CreateCategoriaPuestoOrgData, UpdateCategoriaPuestoOrgData, ListCategoriaPuestoOrgFilters } from '../../domain/entities/CategoriaPuestoOrg.js';
import sql from 'mssql';

export class CategoriaPuestoOrgRepository implements ICategoriaPuestoOrgRepository {
  constructor(private mssqlPool: ConnectionPool) {}

  private mapRowToCategoriaPuestoOrg(row: any): CategoriaPuestoOrg {
    return {
      categoriaPuestoOrgId: row.CategoriaPuestoOrgId,
      nivel: row.Nivel,
      org0: row.Org0,
      org1: row.Org1,
      org2: row.Org2,
      org3: row.Org3,
      categoria: row.Categoria,
      nombreCategoria: row.NombreCategoria,
      ingresoBrutoMensual: row.IngresoBrutoMensual,
      vigenciaInicio: row.VigenciaInicio,
      vigenciaFin: row.VigenciaFin,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      createdBy: row.createdBy,
      updatedBy: row.updatedBy
    };
  }

  async findById(categoriaPuestoOrgId: number): Promise<CategoriaPuestoOrg | undefined> {
    const result = await this.mssqlPool.request()
      .input('categoriaPuestoOrgId', sql.BigInt, categoriaPuestoOrgId)
      .query(`
        SELECT
          CategoriaPuestoOrgId,
          Nivel,
          Org0,
          Org1,
          Org2,
          Org3,
          Categoria,
          NombreCategoria,
          IngresoBrutoMensual,
          VigenciaInicio,
          VigenciaFin,
          createdAt,
          updatedAt,
          createdBy,
          updatedBy
        FROM afi.CategoriaPuestoOrg
        WHERE CategoriaPuestoOrgId = @categoriaPuestoOrgId
      `);

    if (result.recordset.length === 0) return undefined;
    return this.mapRowToCategoriaPuestoOrg(result.recordset[0]);
  }

  async findAll(filters: ListCategoriaPuestoOrgFilters = {}): Promise<CategoriaPuestoOrg[]> {
    let query = `
      SELECT
        CategoriaPuestoOrgId,
        Nivel,
        Org0,
        Org1,
        Org2,
        Org3,
        Categoria,
        NombreCategoria,
        IngresoBrutoMensual,
        VigenciaInicio,
        VigenciaFin,
        createdAt,
        updatedAt,
        createdBy,
        updatedBy
      FROM afi.CategoriaPuestoOrg
      WHERE 1=1
    `;
    const request = this.mssqlPool.request();

    if (filters.nivel !== undefined) {
      query += ' AND Nivel = @nivel';
      request.input('nivel', sql.TinyInt, filters.nivel);
    }
    if (filters.org0) {
      query += ' AND Org0 = @org0';
      request.input('org0', sql.Char(2), filters.org0);
    }
    if (filters.org1) {
      query += ' AND Org1 = @org1';
      request.input('org1', sql.Char(2), filters.org1);
    }
    if (filters.org2) {
      query += ' AND Org2 = @org2';
      request.input('org2', sql.Char(2), filters.org2);
    }
    if (filters.org3) {
      query += ' AND Org3 = @org3';
      request.input('org3', sql.Char(2), filters.org3);
    }
    if (filters.vigenciaInicio) {
      query += ' AND VigenciaInicio = @vigenciaInicio';
      request.input('vigenciaInicio', sql.DateTime2, filters.vigenciaInicio);
    }
    if (filters.categoria) {
      query += ' AND Categoria = @categoria';
      request.input('categoria', sql.VarChar(10), filters.categoria);
    }

    query += ' ORDER BY Nivel, Org0, Org1, Org2, Org3, VigenciaInicio DESC, Categoria';

    const result = await request.query(query);
    return result.recordset.map(this.mapRowToCategoriaPuestoOrg);
  }

  async create(data: CreateCategoriaPuestoOrgData): Promise<CategoriaPuestoOrg> {
    const result = await this.mssqlPool.request()
      .input('nivel', sql.TinyInt, data.nivel)
      .input('org0', sql.Char(2), data.org0)
      .input('org1', sql.Char(2), data.org1)
      .input('org2', sql.Char(2), data.org2 ?? null)
      .input('org3', sql.Char(2), data.org3 ?? null)
      .input('categoria', sql.VarChar(10), data.categoria)
      .input('nombreCategoria', sql.NVarChar(80), data.nombreCategoria)
      .input('ingresoBrutoMensual', sql.Decimal(12, 2), data.ingresoBrutoMensual)
      .input('vigenciaInicio', sql.DateTime2, data.vigenciaInicio)
      .input('vigenciaFin', sql.DateTime2, data.vigenciaFin ?? null)
      .input('createdBy', sql.VarChar(128), data.userId ?? null)
      .input('updatedBy', sql.VarChar(128), data.userId ?? null)
      .query(`
        INSERT INTO afi.CategoriaPuestoOrg (
          Nivel, Org0, Org1, Org2, Org3, Categoria, NombreCategoria,
          IngresoBrutoMensual, VigenciaInicio, VigenciaFin, createdBy, updatedBy
        )
        OUTPUT
          INSERTED.CategoriaPuestoOrgId,
          INSERTED.Nivel,
          INSERTED.Org0,
          INSERTED.Org1,
          INSERTED.Org2,
          INSERTED.Org3,
          INSERTED.Categoria,
          INSERTED.NombreCategoria,
          INSERTED.IngresoBrutoMensual,
          INSERTED.VigenciaInicio,
          INSERTED.VigenciaFin,
          INSERTED.createdAt,
          INSERTED.updatedAt,
          INSERTED.createdBy,
          INSERTED.updatedBy
        VALUES (
          @nivel, @org0, @org1, @org2, @org3, @categoria, @nombreCategoria,
          @ingresoBrutoMensual, @vigenciaInicio, @vigenciaFin, @createdBy, @updatedBy
        )
      `);

    return this.mapRowToCategoriaPuestoOrg(result.recordset[0]);
  }

  async update(data: UpdateCategoriaPuestoOrgData): Promise<CategoriaPuestoOrg> {
    const sets: string[] = [];
    const request = this.mssqlPool.request().input('categoriaPuestoOrgId', sql.BigInt, data.categoriaPuestoOrgId);

    if (data.nombreCategoria !== undefined) {
      request.input('nombreCategoria', sql.NVarChar(80), data.nombreCategoria);
      sets.push('NombreCategoria = @nombreCategoria');
    }
    if (data.ingresoBrutoMensual !== undefined) {
      request.input('ingresoBrutoMensual', sql.Decimal(12, 2), data.ingresoBrutoMensual);
      sets.push('IngresoBrutoMensual = @ingresoBrutoMensual');
    }
    if (data.vigenciaFin !== undefined) {
      request.input('vigenciaFin', sql.DateTime2, data.vigenciaFin);
      sets.push('VigenciaFin = @vigenciaFin');
    }

    sets.push('updatedAt = SYSUTCDATETIME()');
    request.input('updatedBy', sql.VarChar(128), data.userId ?? null);
    sets.push('updatedBy = @updatedBy');

    if (sets.length === 2) { // Only updatedAt and updatedBy
      throw new Error('CATEGORIA_PUESTO_ORG_NO_UPDATE_DATA');
    }

    const updateQuery = `
      UPDATE afi.CategoriaPuestoOrg
      SET ${sets.join(', ')}
      OUTPUT
        INSERTED.CategoriaPuestoOrgId,
        INSERTED.Nivel,
        INSERTED.Org0,
        INSERTED.Org1,
        INSERTED.Org2,
        INSERTED.Org3,
        INSERTED.Categoria,
        INSERTED.NombreCategoria,
        INSERTED.IngresoBrutoMensual,
        INSERTED.VigenciaInicio,
        INSERTED.VigenciaFin,
        INSERTED.createdAt,
        INSERTED.updatedAt,
        INSERTED.createdBy,
        INSERTED.updatedBy
      WHERE CategoriaPuestoOrgId = @categoriaPuestoOrgId
    `;

    const result = await request.query(updateQuery);

    if (result.recordset.length === 0) {
      throw new Error('CATEGORIA_PUESTO_ORG_NOT_FOUND');
    }

    return this.mapRowToCategoriaPuestoOrg(result.recordset[0]);
  }

  async delete(categoriaPuestoOrgId: number): Promise<number> {
    const result = await this.mssqlPool.request()
      .input('categoriaPuestoOrgId', sql.BigInt, categoriaPuestoOrgId)
      .query(`
        DELETE FROM afi.CategoriaPuestoOrg
        OUTPUT DELETED.CategoriaPuestoOrgId
        WHERE CategoriaPuestoOrgId = @categoriaPuestoOrgId
      `);

    if (result.recordset.length === 0) {
      throw new Error('CATEGORIA_PUESTO_ORG_NOT_FOUND');
    }

    return result.recordset[0].CategoriaPuestoOrgId;
  }
}
