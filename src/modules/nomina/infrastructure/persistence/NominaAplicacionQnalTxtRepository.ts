import { ConnectionPool, Transaction } from 'mssql';
import sql from 'mssql';
import {
  NominaAplicacionQnalQueryFilters,
  NominaAplicacionQnalQueryResult,
  NominaAplicacionQnalCargaVigente,
  NominaAplicacionQnalRegistroParsed,
  NominaAplicacionQnalScope,
  NominaAplicacionQnalUploadInput,
  NominaAplicacionQnalUploadResult
} from '../../domain/entities/NominaAplicacionQnalTxt.js';
import { NominaCargaBloqueadaError, NominaCargaInconsistenteError } from '../../domain/errors.js';
import { INominaAplicacionQnalTxtRepository } from '../../domain/repositories/INominaAplicacionQnalTxtRepository.js';

export class NominaAplicacionQnalTxtRepository implements INominaAplicacionQnalTxtRepository {
  constructor(private mssqlPool: ConnectionPool) {}

  async registrarCargaRechazada(
    input: NominaAplicacionQnalUploadInput,
    errores: Array<{ numeroLinea: number; campo?: string; mensaje: string }>,
    totalRegistros: number
  ): Promise<NominaAplicacionQnalUploadResult> {
    const transaction = new sql.Transaction(this.mssqlPool);
    await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);

    try {
      await this.assertCargaMutable(transaction, input);
      const cargaId = await this.insertCarga(transaction, input, 'RECHAZADA', totalRegistros, errores.length);
      for (const error of errores) {
        await new sql.Request(transaction)
          .input('CargaId', sql.BigInt, cargaId)
          .input('LineaNumero', sql.Int, error.numeroLinea || null)
          .input('CodigoError', sql.VarChar(50), error.campo ?? 'VALIDACION')
          .input('Mensaje', sql.NVarChar(1000), error.mensaje)
          .query(`
            INSERT INTO dbo.NominaAplicacionQnalCargaError (CargaId, LineaNumero, CodigoError, Mensaje)
            VALUES (@CargaId, @LineaNumero, @CodigoError, @Mensaje)
          `);
      }

      await transaction.commit();
      return { cargaId, estado: 'RECHAZADA', totalRegistros, totalErrores: errores.length, errores };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async reemplazarVigentes(input: NominaAplicacionQnalUploadInput, registros: NominaAplicacionQnalRegistroParsed[]): Promise<NominaAplicacionQnalUploadResult> {
    const transaction = new sql.Transaction(this.mssqlPool);
    await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);

    try {
      await this.assertCargaMutable(transaction, input);
      await this.applyScopeInputs(new sql.Request(transaction), input).query(`
        UPDATE dbo.NominaAplicacionQnalCarga
        SET EsVigente = 0
        WHERE EntidadId = @EntidadId AND Anio = @Anio AND Quincena = @Quincena
          AND Organica0 = @Organica0 AND Organica1 = @Organica1 AND Organica2 = @Organica2 AND Organica3 = @Organica3
          AND TipoCarga = 'TXT' AND EsVigente = 1
      `);
      const cargaId = await this.insertCarga(transaction, input, 'ACEPTADA', registros.length, 0);
      const baseRequest = this.applyScopeInputs(new sql.Request(transaction), input)
        .input('CargaId', sql.BigInt, cargaId);

      await baseRequest.query(`
        INSERT INTO dbo.NominaAplicacionQnalDetalleHistorial
          (DetalleIdOriginal, CargaId, CargaReemplazoId, EntidadId, Anio, Quincena, Organica0, Organica1, Organica2, Organica3, LineaNumero, LineaOriginal,
           Lote, TipoRegistro, OrganicaI, OrganicaII, OrganicaIII, RFC, ClavePersonal, NombreAfiliado, Movimiento, FechaMovimiento, SueldoMensual,
           AyudasMensuales, QuinqueniosMensual, BaseCotizacionSueldo, BaseCotizacionQuinquenios, DiasLaborados, AportacionAfiliadoFondoAhorro,
           AportacionEntidadFondoAhorro, AportacionAfiliadoEBI, AportacionEntidadEBI, DescuentoPrestamoCortoPlazo, DescuentoPrestamoHipotecario,
           DescuentoPrestamoMedianoPlazo, DescuentosOtros, Calle, Colonia, Ciudad, Estado, Municipio, CodigoPostal, Telefono, FechaNacimiento,
           Sexo, EstadoCivil, CAIR, CAIRVoluntario, FechaRegistroOriginal)
        SELECT Id, CargaId, @CargaId, EntidadId, Anio, Quincena, Organica0, Organica1, Organica2, Organica3, LineaNumero, LineaOriginal,
           Lote, TipoRegistro, OrganicaI, OrganicaII, OrganicaIII, RFC, ClavePersonal, NombreAfiliado, Movimiento, FechaMovimiento, SueldoMensual,
           AyudasMensuales, QuinqueniosMensual, BaseCotizacionSueldo, BaseCotizacionQuinquenios, DiasLaborados, AportacionAfiliadoFondoAhorro,
           AportacionEntidadFondoAhorro, AportacionAfiliadoEBI, AportacionEntidadEBI, DescuentoPrestamoCortoPlazo, DescuentoPrestamoHipotecario,
           DescuentoPrestamoMedianoPlazo, DescuentosOtros, Calle, Colonia, Ciudad, Estado, Municipio, CodigoPostal, Telefono, FechaNacimiento,
           Sexo, EstadoCivil, CAIR, CAIRVoluntario, FechaRegistro
        FROM dbo.NominaAplicacionQnalDetalle d
        WHERE d.EntidadId = @EntidadId AND d.Anio = @Anio AND d.Quincena = @Quincena
          AND d.Organica0 = @Organica0 AND d.Organica1 = @Organica1 AND d.Organica2 = @Organica2 AND d.Organica3 = @Organica3
          AND EXISTS (SELECT 1 FROM dbo.NominaAplicacionQnalCarga c WHERE c.Id=d.CargaId AND c.TipoCarga='TXT')
      `);

      await this.applyScopeInputs(new sql.Request(transaction), input).query(`
        DELETE d
        FROM dbo.NominaAplicacionQnalDetalle d
        INNER JOIN dbo.NominaAplicacionQnalCarga c ON c.Id=d.CargaId
        WHERE d.EntidadId = @EntidadId AND d.Anio = @Anio AND d.Quincena = @Quincena
          AND d.Organica0 = @Organica0 AND d.Organica1 = @Organica1 AND d.Organica2 = @Organica2 AND d.Organica3 = @Organica3
          AND c.TipoCarga='TXT'
      `);

      for (const registro of registros) {
        await this.upsertDetalleTxt(transaction, cargaId, input, registro);
      }

      await transaction.commit();
      return { cargaId, estado: 'ACEPTADA', totalRegistros: registros.length, totalErrores: 0, errores: [] };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  private async assertCargaMutable(transaction: Transaction, input: NominaAplicacionQnalUploadInput): Promise<void> {
    const result = await this.applyScopeInputs(new sql.Request(transaction), input).query(`
      SELECT TOP (1) a.LiquidacionSnapshotId
      FROM liquidacion.QnaSnapshotOficialActual a WITH (UPDLOCK, HOLDLOCK)
      INNER JOIN liquidacion.QnaSnapshot s WITH (UPDLOCK, HOLDLOCK)
        ON s.LiquidacionSnapshotId = a.LiquidacionSnapshotId
      WHERE s.EntidadId = @EntidadId AND s.Anio = @Anio AND s.Quincena = @Quincena
        AND s.Organica0 = @Organica0 AND s.Organica1 = @Organica1
        AND s.Organica2 = @Organica2 AND s.Organica3 = @Organica3
    `);
    if (result.recordset.length > 0) throw new NominaCargaBloqueadaError();
  }

  async consultarRegistros(filters: NominaAplicacionQnalQueryFilters): Promise<NominaAplicacionQnalQueryResult> {
    const offset = (filters.page - 1) * filters.pageSize;
    const request = this.applyScopeInputs(this.mssqlPool.request(), filters)
      .input('Buscar', sql.NVarChar(200), filters.buscar ? `%${filters.buscar}%` : null)
      .input('Offset', sql.Int, offset)
      .input('PageSize', sql.Int, filters.pageSize);

    const whereBuscar = filters.buscar
      ? 'AND (RFC LIKE @Buscar OR ClavePersonal LIKE @Buscar OR NombreAfiliado LIKE @Buscar)'
      : '';

    const result = await request.query(`
      SELECT COUNT(1) AS Total
      FROM dbo.NominaAplicacionQnalDetalle
      WHERE EntidadId = @EntidadId AND Anio = @Anio AND Quincena = @Quincena
        AND Organica0 = @Organica0 AND Organica1 = @Organica1 AND Organica2 = @Organica2 AND Organica3 = @Organica3
        AND CargaId = (
          SELECT TOP 1 Id FROM dbo.NominaAplicacionQnalCarga
          WHERE EntidadId=@EntidadId AND Anio=@Anio AND Quincena=@Quincena
            AND Organica0=@Organica0 AND Organica1=@Organica1 AND Organica2=@Organica2 AND Organica3=@Organica3
            AND TipoCarga='TXT' AND Estatus='APLICADA' AND EsVigente=1
          ORDER BY Id DESC
        )
        ${whereBuscar};

      SELECT *
      FROM dbo.NominaAplicacionQnalDetalle
      WHERE EntidadId = @EntidadId AND Anio = @Anio AND Quincena = @Quincena
        AND Organica0 = @Organica0 AND Organica1 = @Organica1 AND Organica2 = @Organica2 AND Organica3 = @Organica3
        AND CargaId = (
          SELECT TOP 1 Id FROM dbo.NominaAplicacionQnalCarga
          WHERE EntidadId=@EntidadId AND Anio=@Anio AND Quincena=@Quincena
            AND Organica0=@Organica0 AND Organica1=@Organica1 AND Organica2=@Organica2 AND Organica3=@Organica3
            AND TipoCarga='TXT' AND Estatus='APLICADA' AND EsVigente=1
          ORDER BY Id DESC
        )
        ${whereBuscar}
      ORDER BY LineaNumero
      OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;
    `);

    const recordsets = result.recordsets as sql.IRecordSet<any>[];
    const total = recordsets[0][0]?.Total ?? 0;
    return {
      data: recordsets[1] as Record<string, unknown>[],
      pagination: {
        page: filters.page,
        pageSize: filters.pageSize,
        total,
        totalPages: Math.ceil(total / filters.pageSize)
      }
    };
  }

  async consultarCargaVigente(scope: NominaAplicacionQnalScope): Promise<NominaAplicacionQnalCargaVigente | null> {
    const transaction = new sql.Transaction(this.mssqlPool);
    await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
    let rows: Record<string, any>[];
    try {
      const result = await this.applyScopeInputs(new sql.Request(transaction), scope).query(`
      WITH CargaActiva AS (
        SELECT
          Id AS CargaId, EntidadId, Anio, Quincena,
          Organica0, Organica1, Organica2, Organica3,
          ArchivoNombre, TipoCarga, Estatus, EsVigente,
          TotalLineas, TotalDetalles, FechaRegistro
        FROM dbo.NominaAplicacionQnalCarga
        WHERE EntidadId = @EntidadId AND Anio = @Anio AND Quincena = @Quincena
          AND Organica0 = @Organica0 AND Organica1 = @Organica1 AND Organica2 = @Organica2 AND Organica3 = @Organica3
          AND TipoCarga = 'TXT' AND Estatus = 'APLICADA' AND EsVigente = 1
      ),
      DetalleAmbito AS (
        SELECT CargaId, RFC, DiasLaborados
        FROM dbo.NominaAplicacionQnalDetalle
        WHERE EntidadId = @EntidadId AND Anio = @Anio AND Quincena = @Quincena
          AND Organica0 = @Organica0 AND Organica1 = @Organica1 AND Organica2 = @Organica2 AND Organica3 = @Organica3
          AND CargaId IN (SELECT CargaId FROM CargaActiva)
      ),
      Estadisticas AS (
        SELECT
          COUNT(*) AS RegistrosVigentes,
          COUNT(DISTINCT CargaId) AS CargasEnDetalle,
          COUNT(DISTINCT NULLIF(UPPER(LTRIM(RTRIM(RFC))), '')) AS RfcUnicos,
          SUM(CASE WHEN DiasLaborados > 0 AND DiasLaborados < 15 THEN 1 ELSE 0 END) AS DiasParciales,
          SUM(CASE WHEN DiasLaborados = 0 THEN 1 ELSE 0 END) AS DiasCero,
          SUM(CASE WHEN DiasLaborados IS NULL THEN 1 ELSE 0 END) AS DiasNulos,
          SUM(CASE WHEN DiasLaborados = 15 THEN 1 ELSE 0 END) AS DiasQuince
        FROM DetalleAmbito
      ),
      Duplicados AS (
        SELECT COALESCE(SUM(x.Repeticiones - 1), 0) AS RfcDuplicados
        FROM (
          SELECT COUNT(*) AS Repeticiones
          FROM DetalleAmbito
          WHERE NULLIF(LTRIM(RTRIM(RFC)), '') IS NOT NULL
          GROUP BY UPPER(LTRIM(RTRIM(RFC)))
          HAVING COUNT(*) > 1
        ) x
      )
      SELECT
        c.*,
        (SELECT COUNT(*) FROM DetalleAmbito n WHERE n.CargaId = c.CargaId) AS RegistrosCargaBase,
        (SELECT COUNT(*) FROM DetalleAmbito n WHERE n.CargaId <> c.CargaId) AS RegistrosComplementarios,
        s.RegistrosVigentes,
        s.CargasEnDetalle,
        s.RfcUnicos,
        s.DiasParciales,
        s.DiasCero,
        s.DiasNulos,
        s.DiasQuince,
        d.RfcDuplicados
      FROM CargaActiva c
      CROSS JOIN Estadisticas s
      CROSS JOIN Duplicados d
      ORDER BY c.FechaRegistro DESC, c.CargaId DESC
      `);
      rows = result.recordset;
      await transaction.commit();
    } catch (error) {
      await transaction.rollback().catch(() => undefined);
      throw error;
    }

    if (rows.length === 0) return null;
    if (rows.length !== 1) {
      throw new NominaCargaInconsistenteError('MULTIPLES_CARGAS_BASE');
    }
    const load = rows[0];
    const duplicateCount = Number(load.RfcDuplicados ?? 0);
    if (duplicateCount > 0) throw new NominaCargaInconsistenteError('RFC_DUPLICADO');

    return {
      cargaId: String(load.CargaId),
      entidadId: Number(load.EntidadId),
      anio: Number(load.Anio),
      quincena: Number(load.Quincena),
      organica0: String(load.Organica0).trim(),
      organica1: String(load.Organica1).trim(),
      organica2: String(load.Organica2).trim(),
      organica3: String(load.Organica3).trim(),
      archivoNombre: String(load.ArchivoNombre),
      tipoCarga: 'TXT',
      estatus: 'APLICADA',
      esVigente: true,
      totalLineas: Number(load.TotalLineas),
      totalDetallesDeclarados: Number(load.TotalDetalles),
      fechaRegistro: load.FechaRegistro?.toISOString?.() ?? String(load.FechaRegistro),
      registrosVigentes: Number(load.RegistrosVigentes ?? 0),
      registrosCargaBase: Number(load.RegistrosCargaBase ?? 0),
      registrosComplementarios: Number(load.RegistrosComplementarios ?? 0),
      cargasEnDetalle: Number(load.CargasEnDetalle ?? 0),
      rfcUnicos: Number(load.RfcUnicos ?? 0),
      rfcDuplicados: duplicateCount,
      diasParciales: Number(load.DiasParciales ?? 0),
      diasCero: Number(load.DiasCero ?? 0),
      diasNulos: Number(load.DiasNulos ?? 0),
      diasQuince: Number(load.DiasQuince ?? 0)
    };
  }

  private async insertCarga(
    transaction: Transaction,
    input: NominaAplicacionQnalUploadInput,
    estado: 'ACEPTADA' | 'RECHAZADA',
    totalRegistros: number,
    totalErrores: number
  ): Promise<number> {
    const result = await this.applyScopeInputs(new sql.Request(transaction), input)
      .input('ArchivoNombre', sql.NVarChar(255), input.archivoNombre)
      .input('Estatus', sql.VarChar(20), estado === 'ACEPTADA' ? 'APLICADA' : 'RECHAZADA')
      .input('TipoCarga', sql.VarChar(20), 'TXT')
      .input('EsVigente', sql.Bit, estado === 'ACEPTADA')
      .input('TotalLineas', sql.Int, totalRegistros)
      .input('TotalDetalles', sql.Int, totalRegistros)
      .input('MotivoRechazo', sql.NVarChar(1000), totalErrores > 0 ? 'La carga contiene errores de validacion.' : null)
      .input('UsuarioRegistro', sql.NVarChar(100), input.usuarioId ?? null)
      .query(`
        INSERT INTO dbo.NominaAplicacionQnalCarga
          (EntidadId, Anio, Quincena, Organica0, Organica1, Organica2, Organica3, ArchivoNombre, TotalLineas, TotalDetalles, Estatus, TipoCarga, EsVigente, MotivoRechazo, UsuarioRegistro)
        OUTPUT INSERTED.Id
        VALUES
          (@EntidadId, @Anio, @Quincena, @Organica0, @Organica1, @Organica2, @Organica3, @ArchivoNombre, @TotalLineas, @TotalDetalles, @Estatus, @TipoCarga, @EsVigente, @MotivoRechazo, @UsuarioRegistro)
      `);

    return result.recordset[0].Id;
  }

  private async upsertDetalleTxt(transaction: Transaction, cargaId: number, input: NominaAplicacionQnalUploadInput, registro: NominaAplicacionQnalRegistroParsed): Promise<void> {
    await this.applyScopeInputs(new sql.Request(transaction), input)
      .input('CargaId', sql.BigInt, cargaId)
      .input('LineaNumero', sql.Int, registro.numeroLinea)
      .input('Lote', sql.NVarChar(50), registro.lote)
      .input('TipoRegistro', sql.NVarChar(5), registro.tipoRegistro)
      .input('ClavePersonal', sql.NVarChar(50), registro.clavePersonal)
      .input('RFC', sql.NVarChar(20), registro.rfc)
      .input('NombreAfiliado', sql.NVarChar(250), registro.nombreAfiliado)
      .input('AportacionAfiliadoFondoAhorro', sql.Decimal(18, 2), registro.aportacionAfiliadoFondoAhorro)
      .input('AportacionEntidadFondoAhorro', sql.Decimal(18, 2), registro.aportacionEntidadFondoAhorro)
      .input('AportacionAfiliadoEBI', sql.Decimal(18, 2), registro.aportacionAfiliadoEBI)
      .input('AportacionEntidadEBI', sql.Decimal(18, 2), registro.aportacionEntidadEBI)
      .input('BaseCotizacionSueldo', sql.Decimal(18, 2), registro.baseCotizacionSueldo)
      .input('BaseCotizacionQuinquenios', sql.Decimal(18, 2), registro.baseCotizacionQuinquenios)
      .input('SueldoMensual', sql.Decimal(18, 2), registro.sueldoMensual)
      .input('DescuentoPrestamoCortoPlazo', sql.Decimal(18, 2), registro.descuentoPrestamoCortoPlazo)
      .input('DescuentoPrestamoHipotecario', sql.Decimal(18, 2), registro.descuentoPrestamoHipotecario)
      .input('FechaMovimiento', sql.Date, registro.fechaMovimiento)
      .input('DescuentoPrestamoMedianoPlazo', sql.Decimal(18, 2), registro.descuentoPrestamoMedianoPlazo)
      .input('DescuentosOtros', sql.Decimal(18, 2), registro.descuentosOtros)
      .input('CAIR', sql.Decimal(18, 2), registro.cair)
      .input('CAIRVoluntario', sql.Decimal(18, 2), registro.cairVoluntario)
      .input('FechaRegistro', sql.DateTime2, registro.fechaRegistro)
      .input('DiasLaborados', sql.Decimal(5, 2), registro.diasLaborados)
      .input('LineaOriginal', sql.NVarChar(sql.MAX), registro.lineaOriginal)
      .query(`
        DECLARE @DetalleMovimientoId BIGINT;
        SELECT TOP (1) @DetalleMovimientoId=d.Id
        FROM dbo.NominaAplicacionQnalDetalle d WITH (UPDLOCK,HOLDLOCK)
        INNER JOIN dbo.NominaAplicacionQnalCarga c WITH (UPDLOCK,HOLDLOCK) ON c.Id=d.CargaId
        WHERE d.EntidadId=@EntidadId AND d.Anio=@Anio AND d.Quincena=@Quincena
          AND d.Organica0=@Organica0 AND d.Organica1=@Organica1 AND d.Organica2=@Organica2 AND d.Organica3=@Organica3
          AND d.RfcNormalizado=NULLIF(UPPER(LTRIM(RTRIM(@RFC))), '')
          AND c.TipoCarga='MOVIMIENTO';

        IF @DetalleMovimientoId IS NOT NULL
        BEGIN
          INSERT INTO dbo.NominaAplicacionQnalDetalleHistorial
            (DetalleIdOriginal, CargaId, CargaReemplazoId, EntidadId, Anio, Quincena, Organica0, Organica1, Organica2, Organica3, LineaNumero, LineaOriginal,
             Lote, TipoRegistro, OrganicaI, OrganicaII, OrganicaIII, RFC, ClavePersonal, NombreAfiliado, Movimiento, FechaMovimiento, SueldoMensual,
             AyudasMensuales, QuinqueniosMensual, BaseCotizacionSueldo, BaseCotizacionQuinquenios, DiasLaborados, AportacionAfiliadoFondoAhorro,
             AportacionEntidadFondoAhorro, AportacionAfiliadoEBI, AportacionEntidadEBI, DescuentoPrestamoCortoPlazo, DescuentoPrestamoHipotecario,
             DescuentoPrestamoMedianoPlazo, DescuentosOtros, Calle, Colonia, Ciudad, Estado, Municipio, CodigoPostal, Telefono, FechaNacimiento,
             Sexo, EstadoCivil, CAIR, CAIRVoluntario, FechaRegistroOriginal)
          SELECT Id, CargaId, @CargaId, EntidadId, Anio, Quincena, Organica0, Organica1, Organica2, Organica3, LineaNumero, LineaOriginal,
             Lote, TipoRegistro, OrganicaI, OrganicaII, OrganicaIII, RFC, ClavePersonal, NombreAfiliado, Movimiento, FechaMovimiento, SueldoMensual,
             AyudasMensuales, QuinqueniosMensual, BaseCotizacionSueldo, BaseCotizacionQuinquenios, DiasLaborados, AportacionAfiliadoFondoAhorro,
             AportacionEntidadFondoAhorro, AportacionAfiliadoEBI, AportacionEntidadEBI, DescuentoPrestamoCortoPlazo, DescuentoPrestamoHipotecario,
             DescuentoPrestamoMedianoPlazo, DescuentosOtros, Calle, Colonia, Ciudad, Estado, Municipio, CodigoPostal, Telefono, FechaNacimiento,
             Sexo, EstadoCivil, CAIR, CAIRVoluntario, FechaRegistro
          FROM dbo.NominaAplicacionQnalDetalle WHERE Id=@DetalleMovimientoId;

          UPDATE dbo.NominaAplicacionQnalDetalle
          SET CargaId=@CargaId, EntidadId=@EntidadId, Anio=@Anio, Quincena=@Quincena,
              Organica0=@Organica0, Organica1=@Organica1, Organica2=@Organica2, Organica3=@Organica3,
              LineaNumero=@LineaNumero, LineaOriginal=@LineaOriginal, Lote=@Lote, TipoRegistro=@TipoRegistro,
              ClavePersonal=@ClavePersonal, RFC=@RFC, NombreAfiliado=@NombreAfiliado,
              OrganicaI=NULL, OrganicaII=NULL, OrganicaIII=NULL, Movimiento=NULL,
              AportacionAfiliadoFondoAhorro=@AportacionAfiliadoFondoAhorro,
              AportacionEntidadFondoAhorro=@AportacionEntidadFondoAhorro,
              AportacionAfiliadoEBI=@AportacionAfiliadoEBI, AportacionEntidadEBI=@AportacionEntidadEBI,
              BaseCotizacionSueldo=@BaseCotizacionSueldo, BaseCotizacionQuinquenios=@BaseCotizacionQuinquenios,
              SueldoMensual=@SueldoMensual, AyudasMensuales=NULL, QuinqueniosMensual=NULL,
              DescuentoPrestamoCortoPlazo=@DescuentoPrestamoCortoPlazo,
              DescuentoPrestamoHipotecario=@DescuentoPrestamoHipotecario,
              FechaMovimiento=@FechaMovimiento, DescuentoPrestamoMedianoPlazo=@DescuentoPrestamoMedianoPlazo,
              DescuentosOtros=@DescuentosOtros, CAIR=@CAIR, CAIRVoluntario=@CAIRVoluntario,
              FechaRegistro=@FechaRegistro, DiasLaborados=@DiasLaborados,
              Calle=NULL, Colonia=NULL, Ciudad=NULL, Estado=NULL, Municipio=NULL, CodigoPostal=NULL,
              Telefono=NULL, FechaNacimiento=NULL, Sexo=NULL, EstadoCivil=NULL
          WHERE Id=@DetalleMovimientoId;
        END
        ELSE
        BEGIN
          INSERT INTO dbo.NominaAplicacionQnalDetalle
            (CargaId, EntidadId, Anio, Quincena, Organica0, Organica1, Organica2, Organica3, LineaNumero, LineaOriginal, Lote, TipoRegistro, ClavePersonal, RFC, NombreAfiliado,
             AportacionAfiliadoFondoAhorro, AportacionEntidadFondoAhorro, AportacionAfiliadoEBI, AportacionEntidadEBI, BaseCotizacionSueldo, BaseCotizacionQuinquenios,
             SueldoMensual, DescuentoPrestamoCortoPlazo, DescuentoPrestamoHipotecario, FechaMovimiento, DescuentoPrestamoMedianoPlazo, DescuentosOtros, CAIR,
             CAIRVoluntario, FechaRegistro, DiasLaborados)
          VALUES
            (@CargaId, @EntidadId, @Anio, @Quincena, @Organica0, @Organica1, @Organica2, @Organica3, @LineaNumero, @LineaOriginal, @Lote, @TipoRegistro, @ClavePersonal, @RFC, @NombreAfiliado,
             @AportacionAfiliadoFondoAhorro, @AportacionEntidadFondoAhorro, @AportacionAfiliadoEBI, @AportacionEntidadEBI, @BaseCotizacionSueldo, @BaseCotizacionQuinquenios,
             @SueldoMensual, @DescuentoPrestamoCortoPlazo, @DescuentoPrestamoHipotecario, @FechaMovimiento, @DescuentoPrestamoMedianoPlazo, @DescuentosOtros, @CAIR,
             @CAIRVoluntario, @FechaRegistro, @DiasLaborados);
        END
      `);
  }

  private applyScopeInputs<T extends sql.Request>(request: T, input: Pick<NominaAplicacionQnalQueryFilters, 'entidadId' | 'anio' | 'quincena' | 'organica0' | 'organica1' | 'organica2' | 'organica3'>): T {
    return request
      .input('EntidadId', sql.Int, input.entidadId)
      .input('Anio', sql.Int, input.anio)
      .input('Quincena', sql.Int, input.quincena)
      .input('Organica0', sql.Char(2), input.organica0)
      .input('Organica1', sql.Char(2), input.organica1)
      .input('Organica2', sql.Char(2), input.organica2)
      .input('Organica3', sql.Char(2), input.organica3) as T;
  }
}
