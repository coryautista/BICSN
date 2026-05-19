import { ConnectionPool, Transaction } from 'mssql';
import sql from 'mssql';
import {
  NominaAplicacionQnalQueryFilters,
  NominaAplicacionQnalQueryResult,
  NominaAplicacionQnalRegistroParsed,
  NominaAplicacionQnalUploadInput,
  NominaAplicacionQnalUploadResult
} from '../../domain/entities/NominaAplicacionQnalTxt.js';
import { INominaAplicacionQnalTxtRepository } from '../../domain/repositories/INominaAplicacionQnalTxtRepository.js';

export class NominaAplicacionQnalTxtRepository implements INominaAplicacionQnalTxtRepository {
  constructor(private mssqlPool: ConnectionPool) {}

  async registrarCargaRechazada(
    input: NominaAplicacionQnalUploadInput,
    errores: Array<{ numeroLinea: number; campo?: string; mensaje: string }>,
    totalRegistros: number
  ): Promise<NominaAplicacionQnalUploadResult> {
    const transaction = new sql.Transaction(this.mssqlPool);
    await transaction.begin();

    try {
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
    await transaction.begin();

    try {
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
        FROM dbo.NominaAplicacionQnalDetalle
        WHERE EntidadId = @EntidadId AND Anio = @Anio AND Quincena = @Quincena
          AND Organica0 = @Organica0 AND Organica1 = @Organica1 AND Organica2 = @Organica2 AND Organica3 = @Organica3
      `);

      await this.applyScopeInputs(new sql.Request(transaction), input).query(`
        DELETE FROM dbo.NominaAplicacionQnalDetalle
        WHERE EntidadId = @EntidadId AND Anio = @Anio AND Quincena = @Quincena
          AND Organica0 = @Organica0 AND Organica1 = @Organica1 AND Organica2 = @Organica2 AND Organica3 = @Organica3
      `);

      for (const registro of registros) {
        await this.insertDetalle(transaction, cargaId, input, registro);
      }

      await transaction.commit();
      return { cargaId, estado: 'ACEPTADA', totalRegistros: registros.length, totalErrores: 0, errores: [] };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
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
        ${whereBuscar};

      SELECT *
      FROM dbo.NominaAplicacionQnalDetalle
      WHERE EntidadId = @EntidadId AND Anio = @Anio AND Quincena = @Quincena
        AND Organica0 = @Organica0 AND Organica1 = @Organica1 AND Organica2 = @Organica2 AND Organica3 = @Organica3
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
      .input('TotalLineas', sql.Int, totalRegistros)
      .input('TotalDetalles', sql.Int, totalRegistros)
      .input('MotivoRechazo', sql.NVarChar(1000), totalErrores > 0 ? 'La carga contiene errores de validacion.' : null)
      .input('UsuarioRegistro', sql.NVarChar(100), input.usuarioId ?? null)
      .query(`
        INSERT INTO dbo.NominaAplicacionQnalCarga
          (EntidadId, Anio, Quincena, Organica0, Organica1, Organica2, Organica3, ArchivoNombre, TotalLineas, TotalDetalles, Estatus, MotivoRechazo, UsuarioRegistro)
        OUTPUT INSERTED.Id
        VALUES
          (@EntidadId, @Anio, @Quincena, @Organica0, @Organica1, @Organica2, @Organica3, @ArchivoNombre, @TotalLineas, @TotalDetalles, @Estatus, @MotivoRechazo, @UsuarioRegistro)
      `);

    return result.recordset[0].Id;
  }

  private async insertDetalle(transaction: Transaction, cargaId: number, input: NominaAplicacionQnalUploadInput, registro: NominaAplicacionQnalRegistroParsed): Promise<void> {
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
        INSERT INTO dbo.NominaAplicacionQnalDetalle
          (CargaId, EntidadId, Anio, Quincena, Organica0, Organica1, Organica2, Organica3, LineaNumero, LineaOriginal, Lote, TipoRegistro, ClavePersonal, RFC, NombreAfiliado,
           AportacionAfiliadoFondoAhorro, AportacionEntidadFondoAhorro, AportacionAfiliadoEBI, AportacionEntidadEBI, BaseCotizacionSueldo, BaseCotizacionQuinquenios,
           SueldoMensual, DescuentoPrestamoCortoPlazo, DescuentoPrestamoHipotecario, FechaMovimiento, DescuentoPrestamoMedianoPlazo, DescuentosOtros, CAIR,
           CAIRVoluntario, FechaRegistro, DiasLaborados)
        VALUES
          (@CargaId, @EntidadId, @Anio, @Quincena, @Organica0, @Organica1, @Organica2, @Organica3, @LineaNumero, @LineaOriginal, @Lote, @TipoRegistro, @ClavePersonal, @RFC, @NombreAfiliado,
           @AportacionAfiliadoFondoAhorro, @AportacionEntidadFondoAhorro, @AportacionAfiliadoEBI, @AportacionEntidadEBI, @BaseCotizacionSueldo, @BaseCotizacionQuinquenios,
           @SueldoMensual, @DescuentoPrestamoCortoPlazo, @DescuentoPrestamoHipotecario, @FechaMovimiento, @DescuentoPrestamoMedianoPlazo, @DescuentosOtros, @CAIR,
           @CAIRVoluntario, @FechaRegistro, @DiasLaborados)
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
