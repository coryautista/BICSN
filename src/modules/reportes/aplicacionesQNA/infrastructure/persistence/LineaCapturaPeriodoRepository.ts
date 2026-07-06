import { ConnectionPool } from 'mssql';
import sql from 'mssql';
import { formatSqlDateOnly, formatSqlDateTimeMx } from '../../../../../utils/sqlServerDate.js';

export interface LineaCapturaPeriodoRecord {
  lineaCapturaPeriodoId: number;
  org0: string;
  org1: string;
  periodo: string;
  quincena: number;
  anio: number;
  importe: number;
  lineaCaptura: string;
  referencia4: string;
  fechaInicioPeriodo: string;
  fechaFinalPeriodo: string;
  fechaInicioVigencia: string;
  fechaFinVigencia: string;
  fechaReferenciaValidacion: string;
  tipoReferenciaValidacion: string;
  fechaLimite: string;
  fechaCondensada: string;
  montoCondensado: number;
  digitoVerificador: string;
  usuarioId: string | null;
  estatus: string;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface CreateLineaCapturaPeriodoData {
  org0: string;
  org1: string;
  periodo: string;
  quincena: number;
  anio: number;
  importe: number;
  lineaCaptura: string;
  referencia4: string;
  fechaInicioPeriodo: string;
  fechaFinalPeriodo: string;
  fechaInicioVigencia: string;
  fechaFinVigencia: string;
  fechaReferenciaValidacion: string;
  tipoReferenciaValidacion: string;
  fechaLimite: string;
  fechaCondensada: string;
  montoCondensado: number;
  digitoVerificador: string;
  usuarioId?: string;
}

export interface ImporteHistoricoPeriodo {
  totalAportaciones: number;
  totalRetenciones: number;
  importe: number;
  totalRegistros: number;
}

export class LineaCapturaPeriodoRepository {
  constructor(private mssqlPool: ConnectionPool) {}

  private mapRow(row: any): LineaCapturaPeriodoRecord {
    return {
      lineaCapturaPeriodoId: Number(row.LineaCapturaPeriodoId ?? row.lineaCapturaPeriodoId),
      org0: String(row.Org0 ?? row.org0).trim(),
      org1: String(row.Org1 ?? row.org1).trim(),
      periodo: String(row.Periodo ?? row.periodo).trim(),
      quincena: Number(row.Quincena ?? row.quincena),
      anio: Number(row.Anio ?? row.anio),
      importe: Number(row.Importe ?? row.importe),
      lineaCaptura: String(row.LineaCaptura ?? row.lineaCaptura),
      referencia4: String(row.Referencia4 ?? row.referencia4),
      fechaInicioPeriodo: this.formatDate(row.FechaInicioPeriodo ?? row.fechaInicioPeriodo),
      fechaFinalPeriodo: this.formatDate(row.FechaFinalPeriodo ?? row.fechaFinalPeriodo),
      fechaInicioVigencia: this.formatDate(row.FechaInicioVigencia ?? row.fechaInicioVigencia),
      fechaFinVigencia: this.formatDate(row.FechaFinVigencia ?? row.fechaFinVigencia),
      fechaReferenciaValidacion: this.formatDate(row.FechaReferenciaValidacion ?? row.fechaReferenciaValidacion),
      tipoReferenciaValidacion: String(row.TipoReferenciaValidacion ?? row.tipoReferenciaValidacion),
      fechaLimite: this.formatDate(row.FechaLimite ?? row.fechaLimite),
      fechaCondensada: String(row.FechaCondensada ?? row.fechaCondensada),
      montoCondensado: Number(row.MontoCondensado ?? row.montoCondensado),
      digitoVerificador: String(row.DigitoVerificador ?? row.digitoVerificador),
      usuarioId: row.UsuarioId ?? row.usuarioId ?? null,
      estatus: String(row.Estatus ?? row.estatus),
      createdAt: this.formatDateTime(row.CreatedAt ?? row.createdAt),
      updatedAt: this.formatDateTime(row.UpdatedAt ?? row.updatedAt)
    };
  }

  async findVigente(org0: string, org1: string, periodo: string, importe?: number): Promise<LineaCapturaPeriodoRecord | null> {
    const request = this.mssqlPool.request()
      .input('org0', sql.Char(2), org0)
      .input('org1', sql.Char(2), org1)
      .input('periodo', sql.Char(4), periodo);

    let importeFilter = '';
    if (importe !== undefined) {
      request.input('importe', sql.Decimal(18, 2), importe);
      importeFilter = 'AND Importe = @importe';
    }

    const result = await request.query(`
      SELECT TOP 1 *
      FROM pagos.LineaCapturaPeriodo
      WHERE Org0 = @org0
        AND Org1 = @org1
        AND Periodo = @periodo
        AND Estatus = 'VIGENTE'
        ${importeFilter}
      ORDER BY CreatedAt DESC
    `);

    return result.recordset[0] ? this.mapRow(result.recordset[0]) : null;
  }

  async findVigenteActiva(org0: string, org1: string, fechaMexicoHoy: string): Promise<LineaCapturaPeriodoRecord | null> {
    const result = await this.mssqlPool.request()
      .input('org0', sql.Char(2), org0)
      .input('org1', sql.Char(2), org1)
      .input('fechaMexicoHoy', sql.Date, fechaMexicoHoy)
      .query(`
        SELECT TOP 1 *
        FROM pagos.LineaCapturaPeriodo
        WHERE Org0 = @org0
          AND Org1 = @org1
          AND Estatus = 'VIGENTE'
          AND FechaFinVigencia >= @fechaMexicoHoy
        ORDER BY FechaFinVigencia DESC, CreatedAt DESC
      `);

    return result.recordset[0] ? this.mapRow(result.recordset[0]) : null;
  }

  async calcularImporteHistorico(org0: string, org1: string, periodo: string): Promise<ImporteHistoricoPeriodo> {
    const quincena = Number(periodo.slice(0, 2));
    const anio = 2000 + Number(periodo.slice(2, 4));

    const result = await this.mssqlPool.request()
      .input('org0', sql.Char(2), org0)
      .input('org1', sql.Char(2), org1)
      .input('quincena', sql.Int, quincena)
      .input('anio', sql.Int, anio)
      .query(`
        WITH aportaciones_detalle AS (
          SELECT 'AHORRO' AS tipo, COUNT(*) AS registros, COALESCE(SUM(total), 0) AS total, 'APORTACION' AS grupo
          FROM aportaciones.IndividualesAhorroHistorico
          WHERE clave_organica_0 = @org0 AND clave_organica_1 = @org1 AND quincena = @quincena AND anio = @anio
          UNION ALL
          SELECT 'VIVIENDA', COUNT(*), COALESCE(SUM(total), 0), 'APORTACION'
          FROM aportaciones.IndividualesViviendaHistorico
          WHERE clave_organica_0 = @org0 AND clave_organica_1 = @org1 AND quincena = @quincena AND anio = @anio
          UNION ALL
          SELECT 'PRESTACIONES', COUNT(*), COALESCE(SUM(total), 0), 'APORTACION'
          FROM aportaciones.IndividualesPrestacionesHistorico
          WHERE clave_organica_0 = @org0 AND clave_organica_1 = @org1 AND quincena = @quincena AND anio = @anio
          UNION ALL
          SELECT 'CAIR', COUNT(*), COALESCE(SUM(total), 0), 'APORTACION'
          FROM aportaciones.IndividualesCairHistorico
          WHERE clave_organica_0 = @org0 AND clave_organica_1 = @org1 AND quincena = @quincena AND anio = @anio
          UNION ALL
          SELECT 'TRANSITORIO', COUNT(*), COALESCE(SUM(total), 0), 'APORTACION'
          FROM aportaciones.PensionNominaTransitorioHistorico
          WHERE clave_organica_0 = @org0 AND clave_organica_1 = @org1 AND quincena = @quincena AND anio = @anio
          UNION ALL
          SELECT 'GUARDERIA', COUNT(*), COALESCE(SUM(recibo_total), 0), 'APORTACION'
          FROM aportaciones.GuarderiasHistorico
          WHERE clave_organica_0 = @org0 AND clave_organica_1 = @org1 AND quincena = @quincena AND anio = @anio
          UNION ALL
          SELECT 'AGUINALDO', COUNT(*), COALESCE(SUM(general), 0), 'APORTACION'
          FROM aportaciones.AguinaldoHistorico
          WHERE clave_organica_0 = @org0 AND clave_organica_1 = @org1 AND quincena = @quincena AND anio = @anio
        ),
        aportaciones_resumen AS (
          SELECT
            COALESCE(SUM(total_contribucion), 0) AS total,
            COALESCE(SUM(total_empleados), 0) AS registros
          FROM aportaciones.ResumenHistorico
          WHERE clave_organica_0 = @org0
            AND clave_organica_1 = @org1
            AND quincena = @quincena
            AND anio = @anio
        ),
        retenciones AS (
          SELECT 'PCP', COUNT(*), COALESCE(SUM(total), 0), 'RETENCION'
          FROM retenciones.PrestamosCortoPlazoHistorico
          WHERE clave_organica_0 = @org0 AND clave_organica_1 = @org1 AND quincena = @quincena AND anio = @anio
          UNION ALL
          SELECT 'PMP', COUNT(*), COALESCE(SUM(total), 0), 'RETENCION'
          FROM retenciones.PrestamosMedianoPlazoHistorico
          WHERE clave_organica_0 = @org0 AND clave_organica_1 = @org1 AND quincena = @quincena AND anio = @anio
          UNION ALL
          SELECT 'HIP', COUNT(*), COALESCE(SUM(cantidad), 0), 'RETENCION'
          FROM retenciones.PrestamosHipotecariosHistorico
          WHERE clave_organica_0 = @org0 AND clave_organica_1 = @org1 AND quincena = @quincena AND anio = @anio
        )
        SELECT
          CASE
            WHEN (SELECT registros FROM aportaciones_resumen) > 0
              THEN (SELECT total FROM aportaciones_resumen)
            ELSE (SELECT COALESCE(SUM(total), 0) FROM aportaciones_detalle)
          END AS totalAportaciones,
          (SELECT COALESCE(SUM(total), 0) FROM retenciones) AS totalRetenciones,
          (
            CASE
              WHEN (SELECT registros FROM aportaciones_resumen) > 0
                THEN (SELECT total FROM aportaciones_resumen)
              ELSE (SELECT COALESCE(SUM(total), 0) FROM aportaciones_detalle)
            END
            + (SELECT COALESCE(SUM(total), 0) FROM retenciones)
          ) AS importe,
          (
            CASE
              WHEN (SELECT registros FROM aportaciones_resumen) > 0
                THEN (SELECT registros FROM aportaciones_resumen)
              ELSE (SELECT COALESCE(SUM(registros), 0) FROM aportaciones_detalle)
            END
            + (SELECT COALESCE(SUM(registros), 0) FROM retenciones)
          ) AS totalRegistros;
      `);

    const row = result.recordset[0] ?? {};
    const totalAportaciones = Math.round(Number(row.totalAportaciones ?? 0) * 100) / 100;
    const totalRetenciones = Math.round(Number(row.totalRetenciones ?? 0) * 100) / 100;

    return {
      totalAportaciones,
      totalRetenciones,
      importe: Math.round((totalAportaciones + totalRetenciones) * 100) / 100,
      totalRegistros: Number(row.totalRegistros ?? 0)
    };
  }

  async findPrimerPagoPosterior(fechaFinalPeriodo: string): Promise<string | null> {
    const result = await this.mssqlPool.request()
      .input('fechaFinalPeriodo', sql.Date, fechaFinalPeriodo)
      .query(`
        SELECT TOP 1 CONVERT(VARCHAR(10), fecha, 23) AS fecha
        FROM dbo.EventoCalendario
        WHERE tipo = 'PAGO'
          AND fecha > @fechaFinalPeriodo
        ORDER BY fecha ASC
      `);

    return result.recordset[0]?.fecha ?? null;
  }

  async findPrimerPagoDesde(fecha: string): Promise<string | null> {
    const result = await this.mssqlPool.request()
      .input('fecha', sql.Date, fecha)
      .query(`
        SELECT TOP 1 CONVERT(VARCHAR(10), fecha, 23) AS fecha
        FROM dbo.EventoCalendario
        WHERE tipo = 'PAGO'
          AND fecha >= @fecha
        ORDER BY fecha ASC
      `);

    return result.recordset[0]?.fecha ?? null;
  }

  async create(data: CreateLineaCapturaPeriodoData): Promise<LineaCapturaPeriodoRecord> {
    const result = await this.mssqlPool.request()
      .input('org0', sql.Char(2), data.org0)
      .input('org1', sql.Char(2), data.org1)
      .input('periodo', sql.Char(4), data.periodo)
      .input('quincena', sql.TinyInt, data.quincena)
      .input('anio', sql.SmallInt, data.anio)
      .input('importe', sql.Decimal(18, 2), data.importe)
      .input('lineaCaptura', sql.VarChar(15), data.lineaCaptura)
      .input('referencia4', sql.VarChar(4), data.referencia4)
      .input('fechaInicioPeriodo', sql.Date, data.fechaInicioPeriodo)
      .input('fechaFinalPeriodo', sql.Date, data.fechaFinalPeriodo)
      .input('fechaInicioVigencia', sql.Date, data.fechaInicioVigencia)
      .input('fechaFinVigencia', sql.Date, data.fechaFinVigencia)
      .input('fechaReferenciaValidacion', sql.Date, data.fechaReferenciaValidacion)
      .input('tipoReferenciaValidacion', sql.VarChar(30), data.tipoReferenciaValidacion)
      .input('fechaLimite', sql.Date, data.fechaLimite)
      .input('fechaCondensada', sql.VarChar(4), data.fechaCondensada)
      .input('montoCondensado', sql.TinyInt, data.montoCondensado)
      .input('digitoVerificador', sql.VarChar(2), data.digitoVerificador)
      .input('usuarioId', sql.NVarChar(100), data.usuarioId ?? null)
      .query(`
        INSERT INTO pagos.LineaCapturaPeriodo (
          Org0, Org1, Periodo, Quincena, Anio, Importe, LineaCaptura, Referencia4,
          FechaInicioPeriodo, FechaFinalPeriodo, FechaInicioVigencia, FechaFinVigencia,
          FechaReferenciaValidacion, TipoReferenciaValidacion, FechaLimite, FechaCondensada,
          MontoCondensado, DigitoVerificador, UsuarioId
        )
        OUTPUT INSERTED.*
        VALUES (
          @org0, @org1, @periodo, @quincena, @anio, @importe, @lineaCaptura, @referencia4,
          @fechaInicioPeriodo, @fechaFinalPeriodo, @fechaInicioVigencia, @fechaFinVigencia,
          @fechaReferenciaValidacion, @tipoReferenciaValidacion, @fechaLimite, @fechaCondensada,
          @montoCondensado, @digitoVerificador, @usuarioId
        )
      `);

    return this.mapRow(result.recordset[0]);
  }

  private formatDate(value: unknown): string {
    return formatSqlDateOnly(value) ?? '';
  }

  private formatDateTime(value: unknown): string | null {
    return formatSqlDateTimeMx(value);
  }
}
