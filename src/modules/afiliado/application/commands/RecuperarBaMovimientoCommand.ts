import sql from 'mssql';
import type { ConnectionPool } from 'mssql';

export interface RecuperarBaMovimientoInput {
  org0: string;
  org1: string;
  periodo: string;
  preview: boolean;
  fechaAplicacion?: string;
  forzar: boolean;
}

export interface RecuperarBaMovimientoResult {
  periodo: string;
  afectacionId: number;
  fechaAplicacion: string;
  fechaCorteHipotecario: string;
  fechaInicio: string;
  fechaFin: string;
  fechasObjetivo: string[];
  creados: number;
  existentes: string[];
  conflictos: Array<{ fecha: string; periodoQna: string | null }>;
  preview: boolean;
}

export class RecuperarBaMovimientoCommand {
  constructor(private mssqlPool: ConnectionPool) {}

  async execute(input: RecuperarBaMovimientoInput): Promise<RecuperarBaMovimientoResult> {
    if (!/^\d{4}$/.test(input.periodo)) {
      throw new Error('PERIODO_INVALIDO');
    }

    const quincena = Number(input.periodo.slice(0, 2));
    const anio = 2000 + Number(input.periodo.slice(2, 4));
    const aplicacion = await this.mssqlPool.request()
      .input('org0', sql.VarChar(2), input.org0)
      .input('org1', sql.VarChar(2), input.org1)
      .input('quincena', sql.Int, quincena)
      .input('anio', sql.Int, anio)
      .query(`
        SELECT TOP (1)
          AfectacionId,
          Accion,
          CONVERT(VARCHAR(10), ModifiedAt, 23) AS FechaAplicacion
        FROM afec.BitacoraAfectacionOrg
        WHERE Entidad = 'AFILIADOS'
          AND Org0 = @org0
          AND Org1 = @org1
          AND Quincena = @quincena
          AND Anio = @anio
          AND Accion IN ('TERMINADO', 'APLICAR')
          AND Resultado = 'OK'
        ORDER BY ModifiedAt DESC, CreatedAt DESC
      `);

    if (aplicacion.recordset.length === 0) {
      throw new Error('APLICACION_QNA_HISTORICA_NO_FINALIZADA');
    }

    const afectacion = aplicacion.recordset[0];
    const bitacoraTerminada = String(afectacion.Accion) === 'TERMINADO';
    if (!bitacoraTerminada && (!input.forzar || !input.fechaAplicacion)) {
      throw new Error('APLICACION_QNA_HISTORICA_NO_FINALIZADA');
    }
    if (input.fechaAplicacion && !/^\d{4}-\d{2}-\d{2}$/.test(input.fechaAplicacion)) {
      throw new Error('FECHA_APLICACION_INVALIDA');
    }
    const fechaAplicacion = input.fechaAplicacion || String(afectacion.FechaAplicacion);
    const corte = await this.mssqlPool.request()
      .input('fechaAplicacion', sql.Date, fechaAplicacion)
      .query(`
        SELECT TOP (1) id, CONVERT(VARCHAR(10), fecha, 23) AS Fecha
        FROM dbo.EventoCalendario
        WHERE tipo = 'HIPOTECARIO' AND fecha > @fechaAplicacion
        ORDER BY fecha ASC, id ASC
      `);

    if (corte.recordset.length === 0) {
      throw new Error('CORTE_HIPOTECARIO_NO_ENCONTRADO');
    }

    const fechaCorteHipotecario = String(corte.recordset[0].Fecha);
    const fechaInicio = fechaAplicacion;
    const fechaFin = this.diaAnterior(fechaCorteHipotecario);
    const fechasObjetivo = this.crearRango(fechaInicio, fechaFin);
    const existentesResult = await this.mssqlPool.request()
      .input('fechaInicio', sql.Date, fechaInicio)
      .input('fechaFin', sql.Date, fechaFin)
      .query(`
        SELECT CONVERT(VARCHAR(10), fecha, 23) AS Fecha, periodoQna
        FROM dbo.EventoCalendario
        WHERE tipo = 'BA_MOVIMIENTO' AND fecha BETWEEN @fechaInicio AND @fechaFin
      `);
    const existentes = existentesResult.recordset.map((row) => String(row.Fecha));
    const conflictos = existentesResult.recordset
      .filter((row) => row.periodoQna && String(row.periodoQna) !== input.periodo)
      .map((row) => ({ fecha: String(row.Fecha), periodoQna: row.periodoQna ? String(row.periodoQna) : null }));

    let creados = 0;
    if (!input.preview && conflictos.length === 0) {
      const transaction = new sql.Transaction(this.mssqlPool);
      await transaction.begin();
      try {
        for (const fecha of fechasObjetivo.filter((item) => !existentes.includes(item))) {
          const result = await new sql.Request(transaction)
            .input('fecha', sql.Date, fecha)
            .input('anio', sql.Int, Number(fecha.slice(0, 4)))
            .input('periodoQna', sql.NVarChar(4), input.periodo)
            .input('eventoHipotecarioId', sql.Int, Number(corte.recordset[0].id))
            .query(`
              INSERT INTO dbo.EventoCalendario (fecha, tipo, anio, createdAt, origen, periodoQna, eventoHipotecarioId)
              SELECT @fecha, 'BA_MOVIMIENTO', @anio, SYSUTCDATETIME(), 'AUTOMATICO', @periodoQna, @eventoHipotecarioId
              WHERE NOT EXISTS (
                SELECT 1 FROM dbo.EventoCalendario WITH (UPDLOCK, HOLDLOCK)
                WHERE fecha = @fecha AND tipo = 'BA_MOVIMIENTO'
              )
            `);
          creados += result.rowsAffected[0] || 0;
        }
        await transaction.commit();
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    }

    return {
      periodo: input.periodo,
      afectacionId: Number(afectacion.AfectacionId),
      fechaAplicacion,
      fechaCorteHipotecario,
      fechaInicio,
      fechaFin,
      fechasObjetivo,
      creados,
      existentes,
      conflictos,
      preview: input.preview
    };
  }

  private diaAnterior(fecha: string): string {
    const date = new Date(`${fecha}T12:00:00`);
    date.setDate(date.getDate() - 1);
    return this.formatearFecha(date);
  }

  private crearRango(inicio: string, fin: string): string[] {
    const fechas: string[] = [];
    for (const fecha = new Date(`${inicio}T12:00:00`); fecha <= new Date(`${fin}T12:00:00`); fecha.setDate(fecha.getDate() + 1)) {
      fechas.push(this.formatearFecha(fecha));
    }
    return fechas;
  }

  private formatearFecha(fecha: Date): string {
    return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
  }
}
