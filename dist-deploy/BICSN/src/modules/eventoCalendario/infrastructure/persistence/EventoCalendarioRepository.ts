import { ConnectionPool } from 'mssql';
import { IEventoCalendarioRepository } from '../../domain/repositories/IEventoCalendarioRepository.js';
import { EventoCalendario, CreateEventoCalendarioData, UpdateEventoCalendarioData } from '../../domain/entities/EventoCalendario.js';
import sql from 'mssql';

export class EventoCalendarioRepository implements IEventoCalendarioRepository {
  constructor(private mssqlPool: ConnectionPool) {}

  private mapRowToEventoCalendario(row: any): EventoCalendario {
    return {
      id: row.id,
      fecha: row.fecha,
      tipo: row.tipo,
      anio: row.anio,
      createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
      origen: row.origen || 'MANUAL',
      periodoQna: row.periodoQna || null,
      eventoHipotecarioId: row.eventoHipotecarioId ?? null
    };
  }

  async findById(id: number): Promise<EventoCalendario | undefined> {
    const result = await this.mssqlPool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT
          id,
          CONVERT(VARCHAR(10), fecha, 23) as fecha,
          tipo,
          anio,
          createdAt,
          origen,
          periodoQna,
          eventoHipotecarioId
        FROM dbo.EventoCalendario
        WHERE id = @id
      `);

    if (result.recordset.length === 0) return undefined;
    return this.mapRowToEventoCalendario(result.recordset[0]);
  }

  async findAll(): Promise<EventoCalendario[]> {
    const result = await this.mssqlPool.request().query(`
      SELECT
        id,
        CONVERT(VARCHAR(10), fecha, 23) as fecha,
        tipo,
        anio,
        createdAt,
        origen,
        periodoQna,
        eventoHipotecarioId
      FROM dbo.EventoCalendario
      ORDER BY fecha DESC, createdAt DESC
    `);

    return result.recordset.map(this.mapRowToEventoCalendario);
  }

  async findByAnio(anio: number): Promise<EventoCalendario[]> {
    const result = await this.mssqlPool.request()
      .input('anio', sql.Int, anio)
      .query(`
        SELECT
          id,
          CONVERT(VARCHAR(10), fecha, 23) as fecha,
          tipo,
          anio,
          createdAt,
          origen,
          periodoQna,
          eventoHipotecarioId
        FROM dbo.EventoCalendario
        WHERE anio = @anio
        ORDER BY fecha ASC
      `);

    return result.recordset.map(this.mapRowToEventoCalendario);
  }

  async findByDateRange(fechaInicio: string, fechaFin: string, tipo?: string): Promise<EventoCalendario[]> {
    const request = this.mssqlPool.request()
      .input('fechaInicio', sql.Date, fechaInicio)
      .input('fechaFin', sql.Date, fechaFin);

    let query = `
      SELECT
        id,
        CONVERT(VARCHAR(10), fecha, 23) as fecha,
        tipo,
        anio,
        createdAt,
        origen,
        periodoQna,
        eventoHipotecarioId
      FROM dbo.EventoCalendario
      WHERE fecha BETWEEN @fechaInicio AND @fechaFin
    `;

    if (tipo) {
      request.input('tipo', sql.NVarChar(50), tipo);
      query += ` AND tipo = @tipo`;
    }

    query += ` ORDER BY fecha ASC`;

    const result = await request.query(query);
    return result.recordset.map(this.mapRowToEventoCalendario);
  }

  async hasAplicacionQnaFinalizada(fecha: string, org0: string, org1: string): Promise<boolean> {
    const result = await this.mssqlPool.request()
      .input('fecha', sql.Date, fecha)
      .input('org0', sql.VarChar(2), org0)
      .input('org1', sql.VarChar(2), org1)
      .query(`
        DECLARE @HipotecarioAnterior DATE = (
          SELECT MAX(fecha) FROM dbo.EventoCalendario
          WHERE tipo = 'HIPOTECARIO' AND fecha < @fecha
        );
        DECLARE @HipotecarioSiguiente DATE = (
          SELECT MIN(fecha) FROM dbo.EventoCalendario
          WHERE tipo = 'HIPOTECARIO' AND fecha > @fecha
        );

        SELECT TOP (1) b.AfectacionId
        FROM afec.BitacoraAfectacionOrg b
        WHERE @HipotecarioAnterior IS NOT NULL
          AND @HipotecarioSiguiente IS NOT NULL
          AND b.Entidad = 'AFILIADOS'
          AND b.Org0 = @org0
          AND b.Org1 = @org1
          AND b.Accion IN ('APLICAR', 'TERMINADO')
          AND b.Resultado = 'OK'
          AND CAST(b.CreatedAt AS DATE) > @HipotecarioAnterior
          AND CAST(b.CreatedAt AS DATE) < @HipotecarioSiguiente
        ORDER BY b.CreatedAt DESC
      `);
    return result.recordset.length > 0;
  }

  async countBaAutomaticosByHipotecarioId(eventoHipotecarioId: number): Promise<number> {
    const result = await this.mssqlPool.request()
      .input('eventoHipotecarioId', sql.Int, eventoHipotecarioId)
      .query(`
        SELECT COUNT(*) AS total
        FROM dbo.EventoCalendario
        WHERE tipo = 'BA_MOVIMIENTO'
          AND origen = 'AUTOMATICO'
          AND eventoHipotecarioId = @eventoHipotecarioId
      `);
    return Number(result.recordset[0]?.total || 0);
  }

  async create(data: CreateEventoCalendarioData): Promise<EventoCalendario> {
    const createdAt = data.createdAt || new Date().toISOString();

    // Check if event already exists
    const checkResult = await this.mssqlPool.request()
      .input('fecha', sql.Date, data.fecha)
      .input('tipo', sql.NVarChar(50), data.tipo)
      .query(`
        SELECT id FROM dbo.EventoCalendario
        WHERE fecha = @fecha AND tipo = @tipo
      `);

    if (checkResult.recordset.length > 0) {
      throw new Error('EVENTO_CALENDARIO_ALREADY_EXISTS');
    }

    const result = await this.mssqlPool.request()
      .input('fecha', sql.Date, data.fecha)
      .input('tipo', sql.NVarChar(50), data.tipo)
      .input('anio', sql.Int, data.anio)
      .input('createdAt', sql.DateTime2, createdAt)
      .input('origen', sql.NVarChar(20), data.origen || 'MANUAL')
      .input('periodoQna', sql.NVarChar(4), data.periodoQna || null)
      .input('eventoHipotecarioId', sql.Int, data.eventoHipotecarioId || null)
      .query(`
        INSERT INTO dbo.EventoCalendario (fecha, tipo, anio, createdAt, origen, periodoQna, eventoHipotecarioId)
        VALUES (@fecha, @tipo, @anio, @createdAt, @origen, @periodoQna, @eventoHipotecarioId);

        SELECT
          id,
          CONVERT(VARCHAR(10), fecha, 23) as fecha,
          tipo,
          anio,
          createdAt,
          origen,
          periodoQna,
          eventoHipotecarioId
        FROM dbo.EventoCalendario
        WHERE id = SCOPE_IDENTITY()
      `);

    return this.mapRowToEventoCalendario(result.recordset[0]);
  }

  async update(data: UpdateEventoCalendarioData): Promise<EventoCalendario> {
    const sets: string[] = [];
    const request = this.mssqlPool.request().input('id', sql.Int, data.id);

    if (data.fecha !== undefined) {
      request.input('fecha', sql.Date, data.fecha);
      sets.push('fecha = @fecha');
    }
    if (data.tipo !== undefined) {
      request.input('tipo', sql.NVarChar(50), data.tipo);
      sets.push('tipo = @tipo');
    }
    if (data.anio !== undefined) {
      request.input('anio', sql.Int, data.anio);
      sets.push('anio = @anio');
    }
    if (data.createdAt !== undefined) {
      request.input('createdAt', sql.DateTime2, data.createdAt);
      sets.push('createdAt = @createdAt');
    }

    if (sets.length === 0) {
      throw new Error('EVENTO_CALENDARIO_NO_UPDATE_DATA');
    }

    const updateQuery = `
      UPDATE dbo.EventoCalendario
      SET ${sets.join(', ')}
      WHERE id = @id;

      SELECT
        id,
        CONVERT(VARCHAR(10), fecha, 23) as fecha,
        tipo,
        anio,
        createdAt,
        origen,
        periodoQna,
        eventoHipotecarioId
      FROM dbo.EventoCalendario
      WHERE id = @id
    `;

    const result = await request.query(updateQuery);

    if (result.recordset.length === 0) {
      throw new Error('EVENTO_CALENDARIO_NOT_FOUND');
    }

    return this.mapRowToEventoCalendario(result.recordset[0]);
  }

  async delete(id: number): Promise<number> {
    const result = await this.mssqlPool.request()
      .input('id', sql.Int, id)
      .query(`
        DELETE FROM dbo.EventoCalendario
        WHERE id = @id;
        SELECT @@ROWCOUNT AS affected;
      `);

    if (result.recordset[0].affected === 0) {
      throw new Error('EVENTO_CALENDARIO_NOT_FOUND');
    }

    return id;
  }
}
