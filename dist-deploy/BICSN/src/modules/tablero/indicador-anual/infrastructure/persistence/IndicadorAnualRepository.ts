import { IIndicadorAnualRepository } from '../../domain/repositories/IIndicadorAnualRepository.js';
import { IndicadorAnual, IndicadorAnualWithRelations } from '../../domain/entities/IndicadorAnual.js';
import { getPool, sql } from '../../../../../db/mssql.js';
import { sql as sqlType } from '../../../../../db/context.js';

export class IndicadorAnualRepository implements IIndicadorAnualRepository {
  async findById(indicadorAnualId: number): Promise<IndicadorAnualWithRelations | null> {
    if (!indicadorAnualId || typeof indicadorAnualId !== 'number' || indicadorAnualId <= 0) {
      throw new Error('Invalid indicadorAnualId: must be a positive number');
    }
    const p = await getPool();
    const r = await p.request()
      .input('indicadorAnualId', sql.Int, indicadorAnualId)
      .query(`
        SELECT
          ia.id,
          ia.idIndicador,
          ia.anio,
          ia.enero,
          ia.febrero,
          ia.marzo,
          ia.abril,
          ia.mayo,
          ia.junio,
          ia.julio,
          ia.agosto,
          ia.septiembre,
          ia.octubre,
          ia.noviembre,
          ia.diciembre,
          ia.metaAnual,
          ia.observaciones,
          ia.createdAt,
          ia.updatedAt,
          ia.createdBy,
          ia.updatedBy,
          i.nombre as indicadorNombre,
          i.descripcion as indicadorDescripcion,
          i.tipoIndicador,
          i.frecuenciaMedicion,
          i.meta as indicadorMeta,
          i.sentido
        FROM tablero.IndicadorAnual ia
        INNER JOIN tablero.Indicador i ON ia.idIndicador = i.id
        WHERE ia.id = @indicadorAnualId
      `);
    const row = r.recordset[0];
    if (!row) return null;
    return this.mapToIndicadorAnualWithRelations(row);
  }

  async findByIndicador(indicadorId: number): Promise<IndicadorAnualWithRelations[]> {
    if (!indicadorId || typeof indicadorId !== 'number' || indicadorId <= 0) {
      throw new Error('Invalid indicadorId: must be a positive number');
    }
    const p = await getPool();
    const r = await p.request()
      .input('indicadorId', sql.Int, indicadorId)
      .query(`
        SELECT
          ia.id,
          ia.idIndicador,
          ia.anio,
          ia.enero,
          ia.febrero,
          ia.marzo,
          ia.abril,
          ia.mayo,
          ia.junio,
          ia.julio,
          ia.agosto,
          ia.septiembre,
          ia.octubre,
          ia.noviembre,
          ia.diciembre,
          ia.metaAnual,
          ia.observaciones,
          ia.createdAt,
          ia.updatedAt,
          ia.createdBy,
          ia.updatedBy,
          i.nombre as indicadorNombre,
          i.descripcion as indicadorDescripcion,
          i.tipoIndicador,
          i.frecuenciaMedicion,
          i.meta as indicadorMeta,
          i.sentido
        FROM tablero.IndicadorAnual ia
        INNER JOIN tablero.Indicador i ON ia.idIndicador = i.id
        WHERE ia.idIndicador = @indicadorId
        ORDER BY ia.anio DESC
      `);
    return r.recordset.map((row: any) => this.mapToIndicadorAnualWithRelations(row));
  }

  async findByAnio(anio: number): Promise<IndicadorAnualWithRelations[]> {
    if (!anio || typeof anio !== 'number' || anio < 2000 || anio > 2100) {
      throw new Error('Invalid anio: must be a number between 2000 and 2100');
    }
    const p = await getPool();
    const r = await p.request()
      .input('anio', sql.Int, anio)
      .query(`
        SELECT
          ia.id,
          ia.idIndicador,
          ia.anio,
          ia.enero,
          ia.febrero,
          ia.marzo,
          ia.abril,
          ia.mayo,
          ia.junio,
          ia.julio,
          ia.agosto,
          ia.septiembre,
          ia.octubre,
          ia.noviembre,
          ia.diciembre,
          ia.metaAnual,
          ia.observaciones,
          ia.createdAt,
          ia.updatedAt,
          ia.createdBy,
          ia.updatedBy,
          i.nombre as indicadorNombre,
          i.descripcion as indicadorDescripcion,
          i.tipoIndicador,
          i.frecuenciaMedicion,
          i.meta as indicadorMeta,
          i.sentido
        FROM tablero.IndicadorAnual ia
        INNER JOIN tablero.Indicador i ON ia.idIndicador = i.id
        WHERE ia.anio = @anio
        ORDER BY i.nombre ASC
      `);
    return r.recordset.map((row: any) => this.mapToIndicadorAnualWithRelations(row));
  }

  async create(
    idIndicador: number,
    anio: number,
    enero?: number,
    febrero?: number,
    marzo?: number,
    abril?: number,
    mayo?: number,
    junio?: number,
    julio?: number,
    agosto?: number,
    septiembre?: number,
    octubre?: number,
    noviembre?: number,
    diciembre?: number,
    metaAnual?: number,
    observaciones?: string,
    userId?: string,
    tx?: sql.Transaction
  ): Promise<IndicadorAnual> {
    if (!idIndicador || typeof idIndicador !== 'number' || idIndicador <= 0) {
      throw new Error('Invalid idIndicador: must be a positive number');
    }
    if (!anio || typeof anio !== 'number' || anio < 2000 || anio > 2100) {
      throw new Error('Invalid anio: must be a number between 2000 and 2100');
    }

    const req = tx ? new sqlType.Request(tx) : (await getPool()).request();
    const r = await req
      .input('idIndicador', sql.Int, idIndicador)
      .input('anio', sql.Int, anio)
      .input('enero', sql.Decimal(18, 2), enero ?? null)
      .input('febrero', sql.Decimal(18, 2), febrero ?? null)
      .input('marzo', sql.Decimal(18, 2), marzo ?? null)
      .input('abril', sql.Decimal(18, 2), abril ?? null)
      .input('mayo', sql.Decimal(18, 2), mayo ?? null)
      .input('junio', sql.Decimal(18, 2), junio ?? null)
      .input('julio', sql.Decimal(18, 2), julio ?? null)
      .input('agosto', sql.Decimal(18, 2), agosto ?? null)
      .input('septiembre', sql.Decimal(18, 2), septiembre ?? null)
      .input('octubre', sql.Decimal(18, 2), octubre ?? null)
      .input('noviembre', sql.Decimal(18, 2), noviembre ?? null)
      .input('diciembre', sql.Decimal(18, 2), diciembre ?? null)
      .input('metaAnual', sql.Decimal(18, 2), metaAnual ?? null)
      .input('observaciones', sql.NVarChar(2000), observaciones ?? null)
      .input('createdBy', sql.VarChar(128), userId ?? null)
      .input('updatedBy', sql.VarChar(128), userId ?? null)
      .query(`
        INSERT INTO tablero.IndicadorAnual (
          idIndicador, anio, enero, febrero, marzo, abril, mayo, junio,
          julio, agosto, septiembre, octubre, noviembre, diciembre,
          metaAnual, observaciones, createdBy, updatedBy
        )
        OUTPUT
          INSERTED.id,
          INSERTED.idIndicador,
          INSERTED.anio,
          INSERTED.enero,
          INSERTED.febrero,
          INSERTED.marzo,
          INSERTED.abril,
          INSERTED.mayo,
          INSERTED.junio,
          INSERTED.julio,
          INSERTED.agosto,
          INSERTED.septiembre,
          INSERTED.octubre,
          INSERTED.noviembre,
          INSERTED.diciembre,
          INSERTED.metaAnual,
          INSERTED.observaciones,
          INSERTED.createdAt,
          INSERTED.updatedAt,
          INSERTED.createdBy,
          INSERTED.updatedBy
        VALUES (
          @idIndicador, @anio, @enero, @febrero, @marzo, @abril, @mayo, @junio,
          @julio, @agosto, @septiembre, @octubre, @noviembre, @diciembre,
          @metaAnual, @observaciones, @createdBy, @updatedBy
        )
      `);
    const row = r.recordset[0];
    return {
      id: row.id,
      idIndicador: row.idIndicador,
      anio: row.anio,
      enero: row.enero,
      febrero: row.febrero,
      marzo: row.marzo,
      abril: row.abril,
      mayo: row.mayo,
      junio: row.junio,
      julio: row.julio,
      agosto: row.agosto,
      septiembre: row.septiembre,
      octubre: row.octubre,
      noviembre: row.noviembre,
      diciembre: row.diciembre,
      metaAnual: row.metaAnual,
      observaciones: row.observaciones,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      createdBy: row.createdBy,
      updatedBy: row.updatedBy
    };
  }

  async update(
    indicadorAnualId: number,
    enero?: number,
    febrero?: number,
    marzo?: number,
    abril?: number,
    mayo?: number,
    junio?: number,
    julio?: number,
    agosto?: number,
    septiembre?: number,
    octubre?: number,
    noviembre?: number,
    diciembre?: number,
    metaAnual?: number,
    observaciones?: string,
    userId?: string,
    tx?: sql.Transaction
  ): Promise<IndicadorAnual | null> {
    if (!indicadorAnualId || typeof indicadorAnualId !== 'number' || indicadorAnualId <= 0) {
      throw new Error('Invalid indicadorAnualId: must be a positive number');
    }

    const req = tx ? new sqlType.Request(tx) : (await getPool()).request();
    const r = await req
      .input('indicadorAnualId', sql.Int, indicadorAnualId)
      .input('enero', sql.Decimal(18, 2), enero ?? null)
      .input('febrero', sql.Decimal(18, 2), febrero ?? null)
      .input('marzo', sql.Decimal(18, 2), marzo ?? null)
      .input('abril', sql.Decimal(18, 2), abril ?? null)
      .input('mayo', sql.Decimal(18, 2), mayo ?? null)
      .input('junio', sql.Decimal(18, 2), junio ?? null)
      .input('julio', sql.Decimal(18, 2), julio ?? null)
      .input('agosto', sql.Decimal(18, 2), agosto ?? null)
      .input('septiembre', sql.Decimal(18, 2), septiembre ?? null)
      .input('octubre', sql.Decimal(18, 2), octubre ?? null)
      .input('noviembre', sql.Decimal(18, 2), noviembre ?? null)
      .input('diciembre', sql.Decimal(18, 2), diciembre ?? null)
      .input('metaAnual', sql.Decimal(18, 2), metaAnual ?? null)
      .input('observaciones', sql.NVarChar(2000), observaciones ?? null)
      .input('updatedBy', sql.VarChar(128), userId ?? null)
      .query(`
        UPDATE tablero.IndicadorAnual
        SET enero = @enero,
            febrero = @febrero,
            marzo = @marzo,
            abril = @abril,
            mayo = @mayo,
            junio = @junio,
            julio = @julio,
            agosto = @agosto,
            septiembre = @septiembre,
            octubre = @octubre,
            noviembre = @noviembre,
            diciembre = @diciembre,
            metaAnual = @metaAnual,
            observaciones = @observaciones,
            updatedAt = SYSUTCDATETIME(),
            updatedBy = @updatedBy
        OUTPUT
          INSERTED.id,
          INSERTED.idIndicador,
          INSERTED.anio,
          INSERTED.enero,
          INSERTED.febrero,
          INSERTED.marzo,
          INSERTED.abril,
          INSERTED.mayo,
          INSERTED.junio,
          INSERTED.julio,
          INSERTED.agosto,
          INSERTED.septiembre,
          INSERTED.octubre,
          INSERTED.noviembre,
          INSERTED.diciembre,
          INSERTED.metaAnual,
          INSERTED.observaciones,
          INSERTED.createdAt,
          INSERTED.updatedAt,
          INSERTED.createdBy,
          INSERTED.updatedBy
        WHERE id = @indicadorAnualId
      `);
    const row = r.recordset[0];
    if (!row) return null;
    return {
      id: row.id,
      idIndicador: row.idIndicador,
      anio: row.anio,
      enero: row.enero,
      febrero: row.febrero,
      marzo: row.marzo,
      abril: row.abril,
      mayo: row.mayo,
      junio: row.junio,
      julio: row.julio,
      agosto: row.agosto,
      septiembre: row.septiembre,
      octubre: row.octubre,
      noviembre: row.noviembre,
      diciembre: row.diciembre,
      metaAnual: row.metaAnual,
      observaciones: row.observaciones,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      createdBy: row.createdBy,
      updatedBy: row.updatedBy
    };
  }

  async delete(indicadorAnualId: number, tx?: sql.Transaction): Promise<number | null> {
    if (!indicadorAnualId || typeof indicadorAnualId !== 'number' || indicadorAnualId <= 0) {
      throw new Error('Invalid indicadorAnualId: must be a positive number');
    }
    const req = tx ? new sqlType.Request(tx) : (await getPool()).request();
    const r = await req
      .input('indicadorAnualId', sql.Int, indicadorAnualId)
      .query(`
        DELETE FROM tablero.IndicadorAnual
        OUTPUT DELETED.id
        WHERE id = @indicadorAnualId
      `);
    return r.recordset[0]?.id || null;
  }

  private mapToIndicadorAnualWithRelations(row: any): IndicadorAnualWithRelations {
    return {
      id: row.id,
      idIndicador: row.idIndicador,
      anio: row.anio,
      enero: row.enero,
      febrero: row.febrero,
      marzo: row.marzo,
      abril: row.abril,
      mayo: row.mayo,
      junio: row.junio,
      julio: row.julio,
      agosto: row.agosto,
      septiembre: row.septiembre,
      octubre: row.octubre,
      noviembre: row.noviembre,
      diciembre: row.diciembre,
      metaAnual: row.metaAnual,
      observaciones: row.observaciones,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      createdBy: row.createdBy,
      updatedBy: row.updatedBy,
      indicador: {
        id: row.idIndicador,
        nombre: row.indicadorNombre,
        descripcion: row.indicadorDescripcion,
        tipoIndicador: row.tipoIndicador,
        frecuenciaMedicion: row.frecuenciaMedicion,
        meta: row.indicadorMeta,
        sentido: row.sentido
      }
    };
  }
}
