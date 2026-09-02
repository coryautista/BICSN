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
import { acquireQnaScopeLock } from '../../../../db/qnaScopeLock.js';
import { createHash } from 'node:crypto';
import type { FirebirdTransactionOutcome } from '../../../../db/firebird.js';
import type { NominaLayout20FirebirdSyncEvidence } from '../../domain/services/NominaLayout20FirebirdSync.js';
import { NominaTxtSyncError } from '../../domain/errors.js';
import type { NominaAplicacionQnalSyncPrepared } from '../../domain/entities/NominaAplicacionQnalTxt.js';

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
      await acquireQnaScopeLock(transaction, input);
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
          AND EXISTS (SELECT 1 FROM dbo.NominaAplicacionQnalCarga c WHERE c.Id=d.CargaId AND c.TipoCarga IN ('TXT','MOVIMIENTO'))
      `);

      await this.applyScopeInputs(new sql.Request(transaction), input).query(`
        DELETE d
        FROM dbo.NominaAplicacionQnalDetalle d
        INNER JOIN dbo.NominaAplicacionQnalCarga c ON c.Id=d.CargaId
        WHERE d.EntidadId = @EntidadId AND d.Anio = @Anio AND d.Quincena = @Quincena
          AND d.Organica0 = @Organica0 AND d.Organica1 = @Organica1 AND d.Organica2 = @Organica2 AND d.Organica3 = @Organica3
          AND c.TipoCarga IN ('TXT','MOVIMIENTO')
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

  async prepararSincronizacion(input: NominaAplicacionQnalUploadInput, registros: NominaAplicacionQnalRegistroParsed[], archivoHash: string, intentoUuid: string): Promise<NominaAplicacionQnalSyncPrepared> {
    if (!input.usuarioId?.trim()) throw new NominaTxtSyncError('NOMINA_TXT_USUARIO_REQUERIDO', 500);
    const transaction = new sql.Transaction(this.mssqlPool);
    await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
    try {
      await acquireQnaScopeLock(transaction, input);
      const existing = await this.applyScopeInputs(new sql.Request(transaction), input)
        .input('ArchivoHash', sql.Char(64), archivoHash)
        .query(`SELECT SincronizacionId, IntentoUuid, Estado, CargaId, TotalDetalles FROM dbo.NominaAplicacionQnalSincronizacion WITH (UPDLOCK,HOLDLOCK)
          WHERE EntidadId=@EntidadId AND Anio=@Anio AND Quincena=@Quincena AND Organica0=@Organica0 AND Organica1=@Organica1 AND Organica2=@Organica2 AND Organica3=@Organica3 AND ArchivoHash=@ArchivoHash`);
      const row = existing.recordset[0];
      if (row?.Estado === 'TERMINADO') {
        await transaction.commit();
        return { sincronizacionId: Number(row.SincronizacionId), intentoUuid: String(row.IntentoUuid), alreadyTerminated: { cargaId: Number(row.CargaId), estado: 'ACEPTADA', totalRegistros: Number(row.TotalDetalles), totalErrores: 0, errores: [] } };
      }
      await this.assertCargaMutable(transaction, input);
      if (row?.Estado === 'FIREBIRD_REVERTIDO') {
        const resumed = await new sql.Request(transaction)
          .input('Id', sql.BigInt, row.SincronizacionId)
          .query(`UPDATE dbo.NominaAplicacionQnalSincronizacion
            SET Estado='PREPARADA', ResultadoFirebird=NULL, EvidenciaHash=NULL,
                ConteoFirebirdP=NULL, ConteoResumen=NULL, ErrorCodigo=NULL,
                ErrorPaso=NULL, ErrorNormalizado=NULL, FechaActualizacion=SYSUTCDATETIME()
            WHERE SincronizacionId=@Id AND Estado='FIREBIRD_REVERTIDO'`);
        if (resumed.rowsAffected[0] !== 1) throw new NominaTxtSyncError('NOMINA_TXT_REANUDACION_RECHAZADA', 409);
        await transaction.commit();
        return { sincronizacionId: Number(row.SincronizacionId), intentoUuid: String(row.IntentoUuid) };
      }
      if (row) throw new NominaTxtSyncError('NOMINA_TXT_SINCRONIZACION_EXISTENTE', 409);
      const active = await this.applyScopeInputs(new sql.Request(transaction), input).query(`SELECT TOP (1) SincronizacionId FROM dbo.NominaAplicacionQnalSincronizacion WITH (UPDLOCK,HOLDLOCK)
        WHERE EntidadId=@EntidadId AND Anio=@Anio AND Quincena=@Quincena AND Organica0=@Organica0 AND Organica1=@Organica1 AND Organica2=@Organica2 AND Organica3=@Organica3 AND Activo=1`);
      if (active.recordset.length > 0) throw new NominaTxtSyncError('NOMINA_TXT_SINCRONIZACION_EXISTENTE', 409);

      const inserted = await this.applyScopeInputs(new sql.Request(transaction), input)
        .input('IntentoUuid', sql.UniqueIdentifier, intentoUuid).input('ArchivoNombre', sql.NVarChar(255), input.archivoNombre)
        .input('ArchivoHash', sql.Char(64), archivoHash).input('Total', sql.Int, registros.length)
        .input('Usuario', sql.NVarChar(100), input.usuarioId.trim()).query(`
          INSERT dbo.NominaAplicacionQnalSincronizacion (IntentoUuid,EntidadId,Anio,Quincena,Organica0,Organica1,Organica2,Organica3,ArchivoNombre,ArchivoHash,LayoutVersion,TotalLineas,TotalDetalles,Estado,UsuarioRegistro)
          OUTPUT INSERTED.SincronizacionId VALUES (@IntentoUuid,@EntidadId,@Anio,@Quincena,@Organica0,@Organica1,@Organica2,@Organica3,@ArchivoNombre,@ArchivoHash,20,@Total,@Total,'PREPARADA',@Usuario)`);
      const sincronizacionId = Number(inserted.recordset[0].SincronizacionId);
      await new sql.Request(transaction).input('Id', sql.BigInt, sincronizacionId).input('Lote', sql.NVarChar(50), registros[0]?.lote ?? null)
        .query('INSERT dbo.NominaAplicacionQnalStagingCarga (SincronizacionId,Lote) VALUES (@Id,@Lote)');
      for (const r of registros) {
        await new sql.Request(transaction).input('Id',sql.BigInt,sincronizacionId).input('LineaNumero',sql.Int,r.numeroLinea).input('LineaOriginal',sql.NVarChar(sql.MAX),r.lineaOriginal)
          .input('Lote',sql.NVarChar(50),r.lote).input('TipoRegistro',sql.VarChar(1),r.tipoRegistro).input('ClavePersonal',sql.NVarChar(50),r.clavePersonal)
          .input('RFC',sql.NVarChar(20),r.rfc).input('Nombre',sql.NVarChar(250),r.nombreAfiliado).input('AAF',sql.Decimal(12,2),r.aportacionAfiliadoFondoAhorro)
          .input('AEF',sql.Decimal(12,2),r.aportacionEntidadFondoAhorro).input('AAE',sql.Decimal(12,2),r.aportacionAfiliadoEBI).input('AEE',sql.Decimal(12,2),r.aportacionEntidadEBI)
          .input('BCS',sql.Decimal(12,2),r.baseCotizacionSueldo).input('BCQ',sql.Decimal(12,2),r.baseCotizacionQuinquenios).input('Sueldo',sql.Decimal(12,2),r.sueldoMensual)
          .input('Ayudas',sql.Decimal(12,2),r.ayudasMensuales).input('QuinqMen',sql.Decimal(12,2),r.quinqueniosMensual)
          .input('DCP',sql.Decimal(12,2),r.descuentoPrestamoCortoPlazo).input('DHP',sql.Decimal(12,2),r.descuentoPrestamoHipotecario).input('Fecha',sql.Date,r.fechaMovimiento)
          .input('CAIR',sql.Decimal(12,2),r.cair).input('Dias',sql.Decimal(5,2),r.diasLaborados).query(`INSERT dbo.NominaAplicacionQnalStagingDetalle
          (SincronizacionId,LineaNumero,LineaOriginal,Lote,TipoRegistro,ClavePersonal,RFC,NombreAfiliado,AportacionAfiliadoFondoAhorro,AportacionEntidadFondoAhorro,AportacionAfiliadoEBI,AportacionEntidadEBI,BaseCotizacionSueldo,BaseCotizacionQuinquenios,SueldoMensual,AyudasMensuales,QuinqueniosMensual,DescuentoPrestamoCortoPlazo,DescuentoPrestamoHipotecario,FechaMovimiento,CAIR,DiasLaborados)
          VALUES (@Id,@LineaNumero,@LineaOriginal,@Lote,@TipoRegistro,@ClavePersonal,@RFC,@Nombre,@AAF,@AEF,@AAE,@AEE,@BCS,@BCQ,@Sueldo,@Ayudas,@QuinqMen,@DCP,@DHP,@Fecha,@CAIR,@Dias)`);
      }
      await transaction.commit();
      return { sincronizacionId, intentoUuid };
    } catch (error) { await transaction.rollback().catch(() => undefined); throw error; }
  }

  async iniciarSincronizacion(sincronizacionId: number, intentoUuid: string, claimToken: string): Promise<void> {
    const result = await this.mssqlPool.request().input('Id',sql.BigInt,sincronizacionId).input('Uuid',sql.UniqueIdentifier,intentoUuid).input('Claim',sql.UniqueIdentifier,claimToken)
      .query(`UPDATE dbo.NominaAplicacionQnalSincronizacion SET Estado='FIREBIRD_EN_PROGRESO',ClaimToken=@Claim,LeaseExpiraEn=DATEADD(MINUTE,10,SYSUTCDATETIME()),FechaActualizacion=SYSUTCDATETIME()
        WHERE SincronizacionId=@Id AND IntentoUuid=@Uuid AND Estado='PREPARADA'`);
    if (result.rowsAffected[0] !== 1) throw new NominaTxtSyncError('NOMINA_TXT_CLAIM_RECHAZADO', 409);
  }

  async registrarResultadoFirebird(sincronizacionId: number, intentoUuid: string, claimToken: string, outcome: FirebirdTransactionOutcome, evidence?: NominaLayout20FirebirdSyncEvidence, error?: unknown): Promise<void> {
    const estado = outcome === 'COMMIT_CONFIRMADO' ? 'FIREBIRD_CONFIRMADO' : outcome === 'RESULTADO_INCIERTO' ? 'FIREBIRD_INCIERTO' : 'FIREBIRD_REVERTIDO';
    const evidenceJson = evidence ? JSON.stringify({ ...evidence, totales: Object.fromEntries(Object.entries(evidence.totales).sort(([a], [b]) => a.localeCompare(b))) }) : undefined;
    const evidenceHash = evidenceJson ? createHash('sha256').update(evidenceJson).digest('hex').toUpperCase() : null;
    const message = error instanceof Error ? error.message : error == null ? null : String(error);
    const result = await this.mssqlPool.request().input('Id',sql.BigInt,sincronizacionId).input('Uuid',sql.UniqueIdentifier,intentoUuid).input('Claim',sql.UniqueIdentifier,claimToken)
      .input('Estado',sql.VarChar(30),estado).input('Outcome',sql.VarChar(30),outcome).input('Hash',sql.Char(64),evidenceHash)
      .input('P',sql.Int,evidence?.detallesP ?? null).input('Resumen',sql.Int,evidence?.resumenes ?? null).input('Codigo',sql.VarChar(100),error && typeof error === 'object' && 'code' in error ? String(error.code) : null)
      .input('Error',sql.NVarChar(500),message?.slice(0,500) ?? null).query(`UPDATE dbo.NominaAplicacionQnalSincronizacion SET Estado=@Estado,ResultadoFirebird=@Outcome,EvidenciaHash=@Hash,ConteoFirebirdP=@P,ConteoResumen=@Resumen,ErrorCodigo=@Codigo,ErrorPaso='FIREBIRD',ErrorNormalizado=@Error,ClaimToken=NULL,LeaseExpiraEn=NULL,FechaActualizacion=SYSUTCDATETIME()
        WHERE SincronizacionId=@Id AND IntentoUuid=@Uuid AND Estado='FIREBIRD_EN_PROGRESO' AND ClaimToken=@Claim`);
    if (result.rowsAffected[0] !== 1) throw new NominaTxtSyncError('NOMINA_TXT_OUTCOME_RECHAZADO', 409);
  }

  async finalizarSincronizacion(sincronizacionId: number, intentoUuid: string): Promise<NominaAplicacionQnalUploadResult> {
    const transaction = new sql.Transaction(this.mssqlPool); await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
    try {
      const selected = await new sql.Request(transaction).input('Id',sql.BigInt,sincronizacionId).input('Uuid',sql.UniqueIdentifier,intentoUuid).query('SELECT * FROM dbo.NominaAplicacionQnalSincronizacion WITH (UPDLOCK,HOLDLOCK) WHERE SincronizacionId=@Id AND IntentoUuid=@Uuid');
      const row = selected.recordset[0];
      if (!row) throw new NominaTxtSyncError('NOMINA_TXT_SINCRONIZACION_NO_EXISTE',409);
      const scope = { entidadId:Number(row.EntidadId),anio:Number(row.Anio),quincena:Number(row.Quincena),organica0:String(row.Organica0).trim(),organica1:String(row.Organica1).trim(),organica2:String(row.Organica2).trim(),organica3:String(row.Organica3).trim() };
      if (row.Estado === 'TERMINADO') { await transaction.commit(); return { cargaId:Number(row.CargaId),estado:'ACEPTADA',totalRegistros:Number(row.TotalDetalles),totalErrores:0,errores:[] }; }
      await acquireQnaScopeLock(transaction, scope); await this.assertCargaMutable(transaction, { ...scope, archivoNombre:String(row.ArchivoNombre), archivoContenido:Buffer.alloc(0) });
      if (row.Estado !== 'FIREBIRD_CONFIRMADO' || row.ResultadoFirebird !== 'COMMIT_CONFIRMADO') throw new NominaTxtSyncError('NOMINA_TXT_NO_CONFIRMADA_EN_FIREBIRD',409);
      const input = { ...scope, archivoNombre:String(row.ArchivoNombre), archivoContenido:Buffer.alloc(0), usuarioId:String(row.UsuarioRegistro) };
      await this.applyScopeInputs(new sql.Request(transaction),scope).query(`UPDATE dbo.NominaAplicacionQnalCarga SET EsVigente=0 WHERE EntidadId=@EntidadId AND Anio=@Anio AND Quincena=@Quincena AND Organica0=@Organica0 AND Organica1=@Organica1 AND Organica2=@Organica2 AND Organica3=@Organica3 AND TipoCarga='TXT' AND EsVigente=1`);
      const cargaId = await this.insertCarga(transaction,input,'ACEPTADA',Number(row.TotalDetalles),0);
      await this.applyScopeInputs(new sql.Request(transaction),scope).input('CargaId',sql.BigInt,cargaId).query(`INSERT dbo.NominaAplicacionQnalDetalleHistorial (DetalleIdOriginal,CargaId,CargaReemplazoId,EntidadId,Anio,Quincena,Organica0,Organica1,Organica2,Organica3,LineaNumero,LineaOriginal,Lote,TipoRegistro,OrganicaI,OrganicaII,OrganicaIII,RFC,ClavePersonal,NombreAfiliado,Movimiento,FechaMovimiento,SueldoMensual,AyudasMensuales,QuinqueniosMensual,BaseCotizacionSueldo,BaseCotizacionQuinquenios,DiasLaborados,AportacionAfiliadoFondoAhorro,AportacionEntidadFondoAhorro,AportacionAfiliadoEBI,AportacionEntidadEBI,DescuentoPrestamoCortoPlazo,DescuentoPrestamoHipotecario,DescuentoPrestamoMedianoPlazo,DescuentosOtros,Calle,Colonia,Ciudad,Estado,Municipio,CodigoPostal,Telefono,FechaNacimiento,Sexo,EstadoCivil,CAIR,CAIRVoluntario,FechaRegistroOriginal)
        SELECT d.Id,d.CargaId,@CargaId,d.EntidadId,d.Anio,d.Quincena,d.Organica0,d.Organica1,d.Organica2,d.Organica3,d.LineaNumero,d.LineaOriginal,d.Lote,d.TipoRegistro,d.OrganicaI,d.OrganicaII,d.OrganicaIII,d.RFC,d.ClavePersonal,d.NombreAfiliado,d.Movimiento,d.FechaMovimiento,d.SueldoMensual,d.AyudasMensuales,d.QuinqueniosMensual,d.BaseCotizacionSueldo,d.BaseCotizacionQuinquenios,d.DiasLaborados,d.AportacionAfiliadoFondoAhorro,d.AportacionEntidadFondoAhorro,d.AportacionAfiliadoEBI,d.AportacionEntidadEBI,d.DescuentoPrestamoCortoPlazo,d.DescuentoPrestamoHipotecario,d.DescuentoPrestamoMedianoPlazo,d.DescuentosOtros,d.Calle,d.Colonia,d.Ciudad,d.Estado,d.Municipio,d.CodigoPostal,d.Telefono,d.FechaNacimiento,d.Sexo,d.EstadoCivil,d.CAIR,d.CAIRVoluntario,d.FechaRegistro FROM dbo.NominaAplicacionQnalDetalle d JOIN dbo.NominaAplicacionQnalCarga c ON c.Id=d.CargaId WHERE d.EntidadId=@EntidadId AND d.Anio=@Anio AND d.Quincena=@Quincena AND d.Organica0=@Organica0 AND d.Organica1=@Organica1 AND d.Organica2=@Organica2 AND d.Organica3=@Organica3 AND c.TipoCarga IN ('TXT','MOVIMIENTO');
        DELETE d FROM dbo.NominaAplicacionQnalDetalle d JOIN dbo.NominaAplicacionQnalCarga c ON c.Id=d.CargaId WHERE d.EntidadId=@EntidadId AND d.Anio=@Anio AND d.Quincena=@Quincena AND d.Organica0=@Organica0 AND d.Organica1=@Organica1 AND d.Organica2=@Organica2 AND d.Organica3=@Organica3 AND c.TipoCarga IN ('TXT','MOVIMIENTO')`);
      const insertedDetails = await this.applyScopeInputs(new sql.Request(transaction),scope).input('CargaId',sql.BigInt,cargaId).input('Id',sql.BigInt,sincronizacionId).query(`INSERT dbo.NominaAplicacionQnalDetalle (CargaId,EntidadId,Anio,Quincena,Organica0,Organica1,Organica2,Organica3,LineaNumero,LineaOriginal,Lote,TipoRegistro,ClavePersonal,RFC,NombreAfiliado,AportacionAfiliadoFondoAhorro,AportacionEntidadFondoAhorro,AportacionAfiliadoEBI,AportacionEntidadEBI,BaseCotizacionSueldo,BaseCotizacionQuinquenios,SueldoMensual,AyudasMensuales,QuinqueniosMensual,DescuentoPrestamoCortoPlazo,DescuentoPrestamoHipotecario,FechaMovimiento,CAIR,DiasLaborados)
        SELECT @CargaId,@EntidadId,@Anio,@Quincena,@Organica0,@Organica1,@Organica2,@Organica3,LineaNumero,LineaOriginal,Lote,TipoRegistro,ClavePersonal,RFC,NombreAfiliado,AportacionAfiliadoFondoAhorro,AportacionEntidadFondoAhorro,AportacionAfiliadoEBI,AportacionEntidadEBI,BaseCotizacionSueldo,BaseCotizacionQuinquenios,SueldoMensual,AyudasMensuales,QuinqueniosMensual,DescuentoPrestamoCortoPlazo,DescuentoPrestamoHipotecario,FechaMovimiento,CAIR,DiasLaborados FROM dbo.NominaAplicacionQnalStagingDetalle WHERE SincronizacionId=@Id`);
      if (insertedDetails.rowsAffected[0] !== Number(row.TotalDetalles)) throw new NominaTxtSyncError('NOMINA_TXT_STAGING_INCOMPLETO', 500);
      const finalized = await new sql.Request(transaction).input('Id',sql.BigInt,sincronizacionId).input('Uuid',sql.UniqueIdentifier,intentoUuid).input('CargaId',sql.BigInt,cargaId).query(`UPDATE dbo.NominaAplicacionQnalSincronizacion SET Estado='TERMINADO',Activo=0,CargaId=@CargaId,FechaActualizacion=SYSUTCDATETIME() WHERE SincronizacionId=@Id AND IntentoUuid=@Uuid AND Estado='FIREBIRD_CONFIRMADO' AND ResultadoFirebird='COMMIT_CONFIRMADO'`);
      if (finalized.rowsAffected[0] !== 1) throw new NominaTxtSyncError('NOMINA_TXT_FINALIZACION_RECHAZADA', 409);
      await transaction.commit(); return { cargaId,estado:'ACEPTADA',totalRegistros:Number(row.TotalDetalles),totalErrores:0,errores:[] };
    } catch(error) { await transaction.rollback().catch(()=>undefined); throw error; }
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
      .input('AyudasMensuales', sql.Decimal(18, 2), registro.ayudasMensuales)
      .input('QuinqueniosMensual', sql.Decimal(18, 2), registro.quinqueniosMensual)
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
               SueldoMensual=@SueldoMensual, AyudasMensuales=@AyudasMensuales, QuinqueniosMensual=@QuinqueniosMensual,
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
              SueldoMensual, AyudasMensuales, QuinqueniosMensual, DescuentoPrestamoCortoPlazo, DescuentoPrestamoHipotecario, FechaMovimiento, DescuentoPrestamoMedianoPlazo, DescuentosOtros, CAIR,
             CAIRVoluntario, FechaRegistro, DiasLaborados)
          VALUES
            (@CargaId, @EntidadId, @Anio, @Quincena, @Organica0, @Organica1, @Organica2, @Organica3, @LineaNumero, @LineaOriginal, @Lote, @TipoRegistro, @ClavePersonal, @RFC, @NombreAfiliado,
             @AportacionAfiliadoFondoAhorro, @AportacionEntidadFondoAhorro, @AportacionAfiliadoEBI, @AportacionEntidadEBI, @BaseCotizacionSueldo, @BaseCotizacionQuinquenios,
              @SueldoMensual, @AyudasMensuales, @QuinqueniosMensual, @DescuentoPrestamoCortoPlazo, @DescuentoPrestamoHipotecario, @FechaMovimiento, @DescuentoPrestamoMedianoPlazo, @DescuentosOtros, @CAIR,
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
