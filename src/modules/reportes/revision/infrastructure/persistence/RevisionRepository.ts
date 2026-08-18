import sql from 'mssql';
import type { ConnectionPool, Transaction } from 'mssql';
import { executeSafeQuery, FIREBIRD_TIMEOUTS } from '../../../../../db/firebird.js';
import {
  FONDOS_REVISION,
  CatalogoRevisionActivo,
  ImportesRevision,
  GuardarAjusteRevisionData,
  GuardarAjusteRevisionResultado,
  ParametrosReporteRevision,
  ReporteRevision,
  RevisionTarea,
  TipoFondoLiberacionPcp,
  crearImportesRevision
} from '../../domain/Revision.types.js';

export interface GuardarRevisionParams {
  tarea: RevisionTarea;
  numeroConcepto: number;
  importes: ImportesRevision;
}

export interface GuardarRevisionResultado {
  operacion: 'INSERT' | 'UPDATE' | 'SIN_CAMBIOS';
  idRevision: number;
  idRevisionHistorico?: number;
  importesAnteriores?: ImportesRevision;
}

export type MovimientoAltasBajas = 'AL' | 'BA' | 'LB';
export type MovimientoRendimiento = 'B' | 'E';
export type EstatusRendimiento = 'A' | 'L';

export function resolverEstatusReporteRevision(
  estatus: unknown,
  error: unknown,
  conceptosGuardados: number
): ReporteRevision['estatusProceso'] {
  const estado = String(estatus || 'COMPLETADA').trim() as ReporteRevision['estatusProceso'];
  const mensaje = String(error || '');
  const falloFtpOpcional = estado === 'ERROR'
    && conceptosGuardados > 0
    && (mensaje.includes('upload text to FTP') || mensaje.includes('FTP_OPCIONAL_NO_DISPONIBLE'));
  return falloFtpOpcional ? 'COMPLETADA' : estado;
}

export class RevisionRepository {
  constructor(private mssqlPool: ConnectionPool) {}

  async encolar(params: Omit<RevisionTarea, 'idRevisionTarea' | 'intentos' | 'claimToken'>): Promise<number> {
    const resultado = await this.mssqlPool.request()
      .input('org0', sql.Char(2), params.org0)
      .input('org1', sql.Char(2), params.org1)
      .input('org2', sql.Char(2), params.org2)
      .input('org3', sql.Char(2), params.org3)
      .input('periodo', sql.Char(4), params.periodo)
      .input('usuarioId', sql.UniqueIdentifier, params.usuarioId)
      .query(`
        SET XACT_ABORT ON;
        BEGIN TRANSACTION;

        DECLARE @IdRevisionTarea BIGINT;

        SELECT @IdRevisionTarea = IdRevisionTarea
        FROM conciliacion.RevisionTarea WITH (UPDLOCK, HOLDLOCK)
        WHERE Organica0 = @org0 AND Organica1 = @org1
          AND Organica2 = @org2 AND Organica3 = @org3
          AND Periodo = @periodo;

        IF @IdRevisionTarea IS NULL
        BEGIN
          INSERT INTO conciliacion.RevisionTarea (
            Organica0, Organica1, Organica2, Organica3, Periodo, UsuarioId
          ) VALUES (@org0, @org1, @org2, @org3, @periodo, @usuarioId);
          SET @IdRevisionTarea = SCOPE_IDENTITY();
        END;
        ELSE
        BEGIN
          UPDATE conciliacion.RevisionTarea
          SET Estatus = CASE WHEN Estatus = 'ERROR' THEN 'PENDIENTE' ELSE Estatus END,
              Intentos = CASE WHEN Estatus = 'ERROR' THEN 0 ELSE Intentos END,
              ProximoIntento = CASE WHEN Estatus = 'ERROR' THEN NULL ELSE ProximoIntento END,
              Error = CASE WHEN Estatus = 'ERROR' THEN NULL ELSE Error END,
              UsuarioId = @usuarioId
          WHERE IdRevisionTarea = @IdRevisionTarea;
        END;

        COMMIT TRANSACTION;
        SELECT @IdRevisionTarea AS IdRevisionTarea;
      `);

    return Number(resultado.recordset[0].IdRevisionTarea);
  }

  async recuperarInterrumpidas(): Promise<void> {
    await this.mssqlPool.request().query(`
      UPDATE conciliacion.RevisionTarea
      SET Estatus = CASE WHEN Intentos < 3 THEN 'PENDIENTE' ELSE 'ERROR' END,
          Error = COALESCE(Error + CHAR(10), '') + 'Ejecución interrumpida por reinicio del servicio.',
          FechaFin = SYSDATETIME(), ClaimToken = NULL, ProximoIntento = NULL
      WHERE Estatus = 'PROCESANDO'
        AND FechaInicio < DATEADD(MINUTE, -30, SYSDATETIME());
    `);
  }

  async reclamarSiguiente(): Promise<RevisionTarea | null> {
    const resultado = await this.mssqlPool.request().query(`
      ;WITH siguiente AS (
        SELECT TOP (1) *
        FROM conciliacion.RevisionTarea WITH (UPDLOCK, READPAST, ROWLOCK)
        WHERE Intentos < 3
          AND (
            (Estatus = 'PENDIENTE' AND (ProximoIntento IS NULL OR ProximoIntento <= SYSDATETIME()))
            OR (Estatus = 'PROCESANDO' AND FechaInicio < DATEADD(MINUTE, -30, SYSDATETIME()))
          )
        ORDER BY FechaAlta, IdRevisionTarea
      )
      UPDATE siguiente
      SET Estatus = 'PROCESANDO',
          Intentos = Intentos + 1,
          FechaInicio = SYSDATETIME(),
          FechaFin = NULL,
          Error = NULL,
          ClaimToken = NEWID(),
          ProximoIntento = NULL
      OUTPUT INSERTED.IdRevisionTarea, INSERTED.Organica0, INSERTED.Organica1,
        INSERTED.Organica2, INSERTED.Organica3, INSERTED.Periodo,
        CONVERT(NVARCHAR(36), INSERTED.UsuarioId) AS UsuarioId, INSERTED.Intentos,
        CONVERT(NVARCHAR(36), INSERTED.ClaimToken) AS ClaimToken;
    `);

    const row = resultado.recordset[0];
    if (!row) return null;
    return {
      idRevisionTarea: Number(row.IdRevisionTarea),
      org0: String(row.Organica0).trim(),
      org1: String(row.Organica1).trim(),
      org2: String(row.Organica2).trim(),
      org3: String(row.Organica3).trim(),
      periodo: String(row.Periodo).trim(),
      usuarioId: String(row.UsuarioId),
      intentos: Number(row.Intentos),
      claimToken: String(row.ClaimToken)
    };
  }

  async calcularSaldoAnterior(tarea: RevisionTarea): Promise<{ importes: ImportesRevision; registros: number }> {
    const periodoAnterior = this.obtenerPeriodoAnterior(tarea.periodo);
    const resultado = await this.mssqlPool.request()
      .input('org0', sql.Char(2), tarea.org0)
      .input('org1', sql.Char(2), tarea.org1)
      .input('org2', sql.Char(2), tarea.org2)
      .input('org3', sql.Char(2), tarea.org3)
      .input('periodo', sql.Char(4), periodoAnterior)
      .query(`
        SELECT r.CAIR, r.FRA, r.FRE, r.FH, r.FV, r.FAA, r.FAE, r.FAT, r.FAI
        FROM conciliacion.Revision r
        INNER JOIN reportes.catalogoRevision c
          ON c.idcatalogoRevision = r.IdCatalogoRevision
        WHERE r.Organica0 = @org0 AND r.Organica1 = @org1
          AND r.Organica2 = @org2 AND r.Organica3 = @org3
          AND r.Periodo = @periodo AND c.numeroConcepto = 12
          AND c.activo = 1 AND r.Estatus = 'A';
      `);

    if (resultado.recordset.length === 0) {
      if (tarea.periodo === '1426') {
        return { importes: crearImportesRevision(), registros: 0 };
      }
      throw new Error(`SALDO_ANTERIOR_NO_ENCONTRADO: no existe concepto 12 para ${periodoAnterior}`);
    }
    return { importes: this.mapearImportes(resultado.recordset[0]), registros: 1 };
  }

  async calcularAplicacionQuincenal(tarea: RevisionTarea): Promise<{ importes: ImportesRevision; registros: number }> {
    const resultado = await this.mssqlPool.request()
      .input('org0', sql.Char(2), tarea.org0)
      .input('org1', sql.Char(2), tarea.org1)
      .input('org2', sql.Char(2), tarea.org2)
      .input('org3', sql.Char(2), tarea.org3)
      .input('periodo', sql.Char(4), tarea.periodo)
      .query(`
        SELECT CAIR, FRA, FRE, FH, FV, FAA, FAE, FAT, FAI, RegistrosOrigen
        FROM conciliacion.RevisionAplicacionHistorico
        WHERE Organica0 = @org0 AND Organica1 = @org1
          AND Organica2 = @org2 AND Organica3 = @org3
          AND Periodo = @periodo;
      `);
    const row = resultado.recordset[0];
    if (!row) {
      throw new Error(`APLICACION_QUINCENAL_HISTORICO_NO_ENCONTRADO: ${tarea.periodo}`);
    }
    return { importes: this.mapearImportes(row), registros: Number(row.RegistrosOrigen || 0) };
  }

  async calcularAltasBajas(
    tarea: RevisionTarea,
    movimiento: MovimientoAltasBajas
  ): Promise<{ importes: ImportesRevision; registros: number }> {
    const rows = await executeSafeQuery(`
      SELECT COUNT(*) AS REGISTROS,
        COALESCE(SUM(SARE), 0) AS CAIR,
        COALESCE(SUM(FRA), 0) AS FRA,
        COALESCE(SUM(FRE), 0) AS FRE,
        COALESCE(SUM(FH), 0) AS FH,
        COALESCE(SUM(FV), 0) AS FV,
        COALESCE(SUM(FAA), 0) AS FAA,
        COALESCE(SUM(FAE), 0) AS FAE,
        COALESCE(SUM(FAT), 0) AS FAT,
        COALESCE(SUM(FAI), 0) AS FAI
      FROM AP_G_FONDOS_ALTBAJ(?, ?, ?)
      WHERE CVE_MOVIMIENTO = ?
    `, [tarea.org0, tarea.org1, tarea.periodo, movimiento], FIREBIRD_TIMEOUTS.BATCH_OPERATION);

    const row = rows[0] || {};
    return { importes: this.mapearImportes(row), registros: Number(row.REGISTROS || 0) };
  }

  async calcularTraspasos(tarea: RevisionTarea): Promise<{ importes: ImportesRevision; registros: number }> {
    const periodoConsulta = this.obtenerPeriodoPar(tarea.periodo);
    const rows = await executeSafeQuery(`
      SELECT COUNT(*) AS REGISTROS,
        COALESCE(SUM(SARE), 0) AS CAIR,
        COALESCE(SUM(FRA), 0) AS FRA,
        COALESCE(SUM(FRE), 0) AS FRE,
        COALESCE(SUM(FHE), 0) AS FH,
        COALESCE(SUM(FVE), 0) AS FV,
        COALESCE(SUM(FAA), 0) AS FAA,
        COALESCE(SUM(FAE), 0) AS FAE,
        COALESCE(SUM(FAT), 0) AS FAT,
        COALESCE(SUM(FAI), 0) AS FAI
      FROM AP_G_FONDOS_REINGRESO_ORD(?)
      WHERE TRIM(TIPO_T_R_B) = ?
        AND HORG0 = ? AND HORG1 = ? AND HORG2 = ? AND HORG3 = ?
    `, [
      periodoConsulta,
      'TRASPASO',
      tarea.org0,
      tarea.org1,
      tarea.org2,
      tarea.org3
    ], FIREBIRD_TIMEOUTS.BATCH_OPERATION);

    const row = rows[0] || {};
    return { importes: this.mapearImportes(row), registros: Number(row.REGISTROS || 0) };
  }

  async calcularSaldoActual(tarea: RevisionTarea): Promise<{ importes: ImportesRevision; registros: number }> {
    const rows = await executeSafeQuery(`
      SELECT COUNT(*) AS REGISTROS,
        COALESCE(SUM(SSARE), 0) AS CAIR,
        COALESCE(SUM(SFRA), 0) AS FRA,
        COALESCE(SUM(SFRE), 0) AS FRE,
        COALESCE(SUM(SFHE), 0) AS FH,
        COALESCE(SUM(SFVE), 0) AS FV,
        COALESCE(SUM(SFAA), 0) AS FAA,
        COALESCE(SUM(SFAE), 0) AS FAE,
        COALESCE(SUM(SFAT), 0) AS FAT,
        COALESCE(SUM(SFAI), 0) AS FAI
      FROM AP_G_SALDO_FONDO(?, ?, ?)
    `, [tarea.org0, tarea.org1, tarea.periodo], FIREBIRD_TIMEOUTS.BATCH_OPERATION);

    const row = rows[0] || {};
    return { importes: this.mapearImportes(row), registros: Number(row.REGISTROS || 0) };
  }

  async calcularAportacionExtemporanea(
    tarea: RevisionTarea
  ): Promise<{ importes: ImportesRevision; registros: number }> {
    const rows = await executeSafeQuery(`
      SELECT COUNT(*) AS REGISTROS,
        COALESCE(SUM(CAIR), 0) AS CAIR,
        COALESCE(SUM(FRA), 0) AS FRA,
        COALESCE(SUM(FRE), 0) AS FRE,
        COALESCE(SUM(FH), 0) AS FH,
        COALESCE(SUM(FV), 0) AS FV,
        COALESCE(SUM(FAA), 0) AS FAA,
        COALESCE(SUM(FAE), 0) AS FAE,
        COALESCE(SUM(FAA), 0) + COALESCE(SUM(FAE), 0) AS FAT,
        COALESCE(SUM(FAI), 0) AS FAI
      FROM FONDOS_INICIALES_IND
      WHERE ORG0 = ? AND ORG1 = ?
        AND PERIODO = ? AND TIPO_FONDO = ?
    `, [tarea.org0, tarea.org1, tarea.periodo, 'AED'], FIREBIRD_TIMEOUTS.BATCH_OPERATION);

    const row = rows[0] || {};
    return { importes: this.mapearImportes(row), registros: Number(row.REGISTROS || 0) };
  }

  async obtenerConceptosActivos(): Promise<CatalogoRevisionActivo[]> {
    const resultado = await this.mssqlPool.request().query(`
      SELECT numeroConcepto, Concepto
      FROM reportes.catalogoRevision
      WHERE activo = 1
      ORDER BY numeroConcepto;
    `);
    return resultado.recordset.map((row) => ({
      numeroConcepto: Number(row.numeroConcepto),
      concepto: String(row.Concepto).trim()
    }));
  }

  async calcularRendimientoAnual(
    tarea: RevisionTarea,
    movimiento: MovimientoRendimiento,
    estatus: EstatusRendimiento
  ): Promise<{ importes: ImportesRevision; registros: number }> {
    const anioRendimiento = String(this.obtenerAnioPeriodo(tarea.periodo) - 1);
    const rows = await executeSafeQuery(`
      SELECT COUNT(*) AS REGISTROS,
        COALESCE(SUM(RENDIMIENTO), 0) AS FAI
      FROM RENDIMIENTOS_ANUALES
      WHERE TIPO_MOVIMIENTO = ? AND ANO = ?
        AND STATUS_ORG_PERS = ? AND ORG0 = ? AND ORG1 = ?
    `, [
      movimiento,
      anioRendimiento,
      estatus,
      tarea.org0,
      tarea.org1
    ], FIREBIRD_TIMEOUTS.BATCH_OPERATION);

    const row = rows[0] || {};
    return { importes: this.mapearImportes(row), registros: Number(row.REGISTROS || 0) };
  }

  async calcularLiberacionPcp(
    tarea: RevisionTarea,
    tipoFondo: TipoFondoLiberacionPcp
  ): Promise<{ importes: ImportesRevision; registros: number }> {
    const rows = await executeSafeQuery(`
      SELECT COUNT(*) AS REGISTROS,
        COALESCE(SUM(FAA), 0) AS FAA,
        COALESCE(SUM(FAE), 0) AS FAE,
        COALESCE(SUM(FAA), 0) + COALESCE(SUM(FAE), 0) AS FAT,
        COALESCE(SUM(FAI), 0) AS FAI
      FROM FONDOS_INICIALES_IND
      WHERE ORG0 = ? AND ORG1 = ? AND PERIODO = ?
        AND TIPO_FONDO = ?
    `, [
      tarea.org0,
      tarea.org1,
      tarea.periodo,
      tipoFondo
    ], FIREBIRD_TIMEOUTS.BATCH_OPERATION);

    const row = rows[0] || {};
    return { importes: this.mapearImportes(row), registros: Number(row.REGISTROS || 0) };
  }

  async obtenerReporte(parametros: ParametrosReporteRevision): Promise<ReporteRevision | null> {
    const crearRequest = () => this.mssqlPool.request()
      .input('org0', sql.Char(2), parametros.org0)
      .input('org1', sql.Char(2), parametros.org1)
      .input('org2', sql.Char(2), parametros.org2)
      .input('org3', sql.Char(2), parametros.org3)
      .input('periodo', sql.Char(4), parametros.periodo);

    const [tareaResultado, conceptosResultado] = await Promise.all([
      crearRequest().query(`
        SELECT TOP (1) Estatus, Intentos, Error, FechaAlta, FechaInicio, FechaFin
        FROM conciliacion.RevisionTarea
        WHERE Organica0 = @org0 AND Organica1 = @org1
          AND Organica2 = @org2 AND Organica3 = @org3
          AND Periodo = @periodo
        ORDER BY IdRevisionTarea DESC;
      `),
      crearRequest().query(`
        SELECT r.IdRevision, c.numeroConcepto, c.Concepto,
          r.CAIR, r.FRA, r.FRE, r.FH, r.FV, r.FAA, r.FAE, r.FAT, r.FAI,
          r.Estatus, r.FechaAlta, r.FechaActualizacion
        FROM conciliacion.Revision r
        INNER JOIN reportes.catalogoRevision c
          ON c.idcatalogoRevision = r.IdCatalogoRevision
        WHERE r.Organica0 = @org0 AND r.Organica1 = @org1
          AND r.Organica2 = @org2 AND r.Organica3 = @org3
          AND r.Periodo = @periodo AND c.activo = 1
        ORDER BY c.numeroConcepto;
      `)
    ]);

    const tarea = tareaResultado.recordset[0];
    const filas = conceptosResultado.recordset;
    if (!tarea && filas.length === 0) return null;

    const estatusProceso = tarea
      ? resolverEstatusReporteRevision(tarea.Estatus, tarea.Error, filas.length)
      : 'COMPLETADA';
    const conceptos = estatusProceso === 'COMPLETADA'
      ? filas.map((row) => ({
          idRevision: Number(row.IdRevision),
          numeroConcepto: Number(row.numeroConcepto),
          concepto: String(row.Concepto),
          cair: this.redondear(row.CAIR),
          fra: this.redondear(row.FRA),
          fre: this.redondear(row.FRE),
          fh: this.redondear(row.FH),
          fv: this.redondear(row.FV),
          faa: this.redondear(row.FAA),
          fae: this.redondear(row.FAE),
          fat: this.redondear(row.FAT),
          fai: this.redondear(row.FAI),
          estatus: String(row.Estatus).trim()
        }))
      : [];
    const fechas = filas
      .map((row) => row.FechaActualizacion || row.FechaAlta)
      .filter((fecha): fecha is Date => fecha instanceof Date);
    const fechaTarea = tarea?.FechaFin || tarea?.FechaInicio || tarea?.FechaAlta;
    if (fechaTarea instanceof Date) fechas.push(fechaTarea);
    const fechaActualizacion = fechas.length > 0
      ? new Date(Math.max(...fechas.map((fecha) => fecha.getTime()))).toISOString()
      : undefined;

    return {
      organica: {
        org0: parametros.org0,
        org1: parametros.org1,
        org2: parametros.org2,
        org3: parametros.org3,
        clave: `${parametros.org0}-${parametros.org1}-${parametros.org2}-${parametros.org3}`
      },
      periodo: parametros.periodo,
      quincena: Number(parametros.periodo.slice(0, 2)),
      anio: 2000 + Number(parametros.periodo.slice(2)),
      estatusProceso,
      intentos: Number(tarea?.Intentos || 0),
      fechaActualizacion,
      conceptos
    };
  }

  async guardarRevisiones(params: GuardarRevisionParams[]): Promise<GuardarRevisionResultado[]> {
    const transaction = new sql.Transaction(this.mssqlPool);
    await transaction.begin();
    try {
      const resultados: GuardarRevisionResultado[] = [];
      for (const item of params) {
        resultados.push(await this.guardarRevisionEnTransaccion(transaction, item));
      }
      await transaction.commit();
      return resultados;
    } catch (error) {
      try {
        await transaction.rollback();
      } catch {
        // Conserva el error original si SQL Server ya cerró la transacción.
      }
      throw error;
    }
  }

  async guardarAjuste(params: GuardarAjusteRevisionData): Promise<GuardarAjusteRevisionResultado> {
    const transaction = new sql.Transaction(this.mssqlPool);
    await transaction.begin();
    try {
      const tareaResultado = await new sql.Request(transaction)
        .input('org0', sql.Char(2), params.org0)
        .input('org1', sql.Char(2), params.org1)
        .input('org2', sql.Char(2), params.org2)
        .input('org3', sql.Char(2), params.org3)
        .input('periodo', sql.Char(4), params.periodo)
        .query(`
          SELECT TOP (1) IdRevisionTarea, Estatus
          FROM conciliacion.RevisionTarea WITH (UPDLOCK, HOLDLOCK)
          WHERE Organica0 = @org0 AND Organica1 = @org1
            AND Organica2 = @org2 AND Organica3 = @org3
            AND Periodo = @periodo
          ORDER BY IdRevisionTarea DESC;
        `);
      if (tareaResultado.recordset.length === 0) {
        throw new Error('REVISION_NO_ENCONTRADA');
      }
      if (String(tareaResultado.recordset[0].Estatus).trim() !== 'COMPLETADA') {
        throw new Error('REVISION_NO_COMPLETADA');
      }

      const resultado = await this.guardarRevisionEnTransaccion(transaction, {
        tarea: {
          idRevisionTarea: Number(tareaResultado.recordset[0].IdRevisionTarea),
          org0: params.org0,
          org1: params.org1,
          org2: params.org2,
          org3: params.org3,
          periodo: params.periodo,
          usuarioId: params.usuarioId,
          intentos: 0,
          claimToken: ''
        },
        numeroConcepto: 14,
        importes: params.importes
      });
      await transaction.commit();
      return {
        operacion: resultado.operacion,
        idRevision: resultado.idRevision,
        idRevisionHistorico: resultado.idRevisionHistorico
      };
    } catch (error) {
      try {
        await transaction.rollback();
      } catch {
        // Conserva el error original si SQL Server ya cerró la transacción.
      }
      throw error;
    }
  }

  private async guardarRevisionEnTransaccion(
    transaction: Transaction,
    params: GuardarRevisionParams
  ): Promise<GuardarRevisionResultado> {
      const catalogo = await new sql.Request(transaction)
        .input('numeroConcepto', sql.Int, params.numeroConcepto)
        .query(`
          SELECT idcatalogoRevision
          FROM reportes.catalogoRevision
          WHERE numeroConcepto = @numeroConcepto AND activo = 1;
        `);
      if (catalogo.recordset.length === 0) {
        throw new Error(`CONCEPTO_INACTIVO_O_INEXISTENTE: ${params.numeroConcepto}`);
      }
      const idCatalogo = Number(catalogo.recordset[0].idcatalogoRevision);
      const request = new sql.Request(transaction)
        .input('org0', sql.Char(2), params.tarea.org0)
        .input('org1', sql.Char(2), params.tarea.org1)
        .input('org2', sql.Char(2), params.tarea.org2)
        .input('org3', sql.Char(2), params.tarea.org3)
        .input('periodo', sql.Char(4), params.tarea.periodo)
        .input('idCatalogo', sql.Int, idCatalogo);
      const existente = await request.query(`
        SELECT * FROM conciliacion.Revision WITH (UPDLOCK, HOLDLOCK)
        WHERE Organica0 = @org0 AND Organica1 = @org1
          AND Organica2 = @org2 AND Organica3 = @org3
          AND Periodo = @periodo AND IdCatalogoRevision = @idCatalogo;
      `);

      if (existente.recordset.length === 0) {
        const insert = this.crearRequestRevision(transaction, params, idCatalogo);
        const resultado = await insert.query(`
          INSERT INTO conciliacion.Revision (
            Organica0, Organica1, Organica2, Organica3, Periodo, IdCatalogoRevision,
            CAIR, FRA, FRE, FH, FV, FAA, FAE, FAT, FAI, Estatus, Usuario
          ) OUTPUT INSERTED.IdRevision VALUES (
            @org0, @org1, @org2, @org3, @periodo, @idCatalogo,
            @CAIR, @FRA, @FRE, @FH, @FV, @FAA, @FAE, @FAT, @FAI, 'A', @usuarioId
          );
        `);
        return { operacion: 'INSERT', idRevision: Number(resultado.recordset[0].IdRevision) };
      }

      const actual = existente.recordset[0];
      const mismosImportes = FONDOS_REVISION.every((fondo) =>
        this.redondear(actual[fondo]) === this.redondear(params.importes[fondo]));
      const mismoEstatus = String(actual.Estatus) === 'A';
      const mismoUsuario = String(actual.Usuario || '').toUpperCase() === params.tarea.usuarioId.toUpperCase();
      if (mismosImportes && mismoEstatus && mismoUsuario) {
        return { operacion: 'SIN_CAMBIOS', idRevision: Number(actual.IdRevision) };
      }

      const historico = await new sql.Request(transaction)
        .input('idRevision', sql.BigInt, actual.IdRevision)
        .input('usuarioOperacion', sql.NVarChar(100), params.tarea.usuarioId)
        .query(`
          INSERT INTO conciliacion.RevisionHistorico (
            IdRevision, Organica0, Organica1, Organica2, Organica3, Periodo,
            IdCatalogoRevision, CAIR, FRA, FRE, FH, FV, FAA, FAE, FAT, FAI,
            Estatus, Usuario, FechaAlta, FechaActualizacion, TipoOperacion, UsuarioOperacion
          ) OUTPUT INSERTED.IdRevisionHistorico
          SELECT IdRevision, Organica0, Organica1, Organica2, Organica3, Periodo,
            IdCatalogoRevision, CAIR, FRA, FRE, FH, FV, FAA, FAE, FAT, FAI,
            Estatus, Usuario, FechaAlta, FechaActualizacion, 'ACTUALIZACION', @usuarioOperacion
          FROM conciliacion.Revision WHERE IdRevision = @idRevision;
        `);

      const update = this.crearRequestRevision(transaction, params, idCatalogo)
        .input('idRevision', sql.BigInt, actual.IdRevision);
      await update.query(`
        UPDATE conciliacion.Revision
        SET CAIR = @CAIR, FRA = @FRA, FRE = @FRE, FH = @FH, FV = @FV,
            FAA = @FAA, FAE = @FAE, FAT = @FAT, FAI = @FAI,
            Estatus = 'A', Usuario = @usuarioId, FechaActualizacion = SYSDATETIME()
        WHERE IdRevision = @idRevision;
      `);

      return {
        operacion: 'UPDATE',
        idRevision: Number(actual.IdRevision),
        idRevisionHistorico: Number(historico.recordset[0].IdRevisionHistorico),
        importesAnteriores: this.mapearImportes(actual)
      };
  }

  async completarTarea(
    idRevisionTarea: number,
    rutaReporteFtp: string | null,
    claimToken: string,
    advertencia: string | null = null
  ): Promise<void> {
    await this.mssqlPool.request()
      .input('id', sql.BigInt, idRevisionTarea)
      .input('ruta', sql.NVarChar(500), rutaReporteFtp)
      .input('claimToken', sql.UniqueIdentifier, claimToken)
      .input('advertencia', sql.NVarChar(2000), advertencia)
      .query(`
        UPDATE conciliacion.RevisionTarea
        SET Estatus = 'COMPLETADA', FechaFin = SYSDATETIME(), Error = @advertencia,
            RutaReporteFtp = @ruta, ClaimToken = NULL
        WHERE IdRevisionTarea = @id AND ClaimToken = @claimToken AND Estatus = 'PROCESANDO';
        IF @@ROWCOUNT = 0 THROW 50021, 'REVISION_TAREA_CLAIM_PERDIDO', 1;
      `);
  }

  async fallarTarea(tarea: RevisionTarea, error: string, rutaReporteFtp?: string): Promise<void> {
    await this.mssqlPool.request()
      .input('id', sql.BigInt, tarea.idRevisionTarea)
      .input('error', sql.NVarChar(2000), error.slice(0, 2000))
      .input('ruta', sql.NVarChar(500), rutaReporteFtp || null)
      .input('claimToken', sql.UniqueIdentifier, tarea.claimToken)
      .query(`
        UPDATE conciliacion.RevisionTarea
        SET Estatus = CASE WHEN Intentos < 3 THEN 'PENDIENTE' ELSE 'ERROR' END,
            FechaFin = SYSDATETIME(), Error = @error,
            RutaReporteFtp = COALESCE(@ruta, RutaReporteFtp), ClaimToken = NULL,
            ProximoIntento = CASE
              WHEN Intentos = 1 THEN DATEADD(SECOND, 10, SYSDATETIME())
              WHEN Intentos = 2 THEN DATEADD(MINUTE, 1, SYSDATETIME())
              ELSE NULL END
        WHERE IdRevisionTarea = @id AND ClaimToken = @claimToken AND Estatus = 'PROCESANDO';
        IF @@ROWCOUNT = 0 THROW 50021, 'REVISION_TAREA_CLAIM_PERDIDO', 1;
      `);
  }

  private crearRequestRevision(transaction: Transaction, params: GuardarRevisionParams, idCatalogo: number) {
    const request = new sql.Request(transaction)
      .input('org0', sql.Char(2), params.tarea.org0)
      .input('org1', sql.Char(2), params.tarea.org1)
      .input('org2', sql.Char(2), params.tarea.org2)
      .input('org3', sql.Char(2), params.tarea.org3)
      .input('periodo', sql.Char(4), params.tarea.periodo)
      .input('idCatalogo', sql.Int, idCatalogo)
      .input('usuarioId', sql.NVarChar(100), params.tarea.usuarioId);
    for (const fondo of FONDOS_REVISION) {
      request.input(fondo, sql.Decimal(19, 2), this.redondear(params.importes[fondo]));
    }
    return request;
  }

  private mapearImportes(row: Record<string, unknown>): ImportesRevision {
    const importes = crearImportesRevision();
    for (const fondo of FONDOS_REVISION) importes[fondo] = this.redondear(row[fondo]);
    return importes;
  }

  private redondear(valor: unknown): number {
    const numero = Number(valor || 0);
    return Math.round(numero * 100) / 100;
  }

  private obtenerPeriodoAnterior(periodo: string): string {
    if (!/^\d{4}$/.test(periodo)) throw new Error('PERIODO_INVALIDO');
    const quincena = Number(periodo.slice(0, 2));
    const anio = 2000 + Number(periodo.slice(2));
    if (quincena < 1 || quincena > 24) throw new Error('PERIODO_INVALIDO');
    const quincenaAnterior = quincena === 1 ? 24 : quincena - 1;
    const anioAnterior = quincena === 1 ? anio - 1 : anio;
    return `${String(quincenaAnterior).padStart(2, '0')}${String(anioAnterior).slice(-2)}`;
  }

  private obtenerPeriodoPar(periodo: string): string {
    if (!/^\d{4}$/.test(periodo)) throw new Error('PERIODO_INVALIDO');
    const quincena = Number(periodo.slice(0, 2));
    if (quincena < 1 || quincena > 24) throw new Error('PERIODO_INVALIDO');
    if (quincena % 2 === 0) return periodo;
    return `${String(quincena + 1).padStart(2, '0')}${periodo.slice(2)}`;
  }

  private obtenerAnioPeriodo(periodo: string): number {
    if (!/^\d{4}$/.test(periodo)) throw new Error('PERIODO_INVALIDO');
    const quincena = Number(periodo.slice(0, 2));
    if (quincena < 1 || quincena > 24) throw new Error('PERIODO_INVALIDO');
    return 2000 + Number(periodo.slice(2));
  }
}
