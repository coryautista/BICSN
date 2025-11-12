import { ConnectionPool } from 'mssql';
import { sql } from '../../../../db/mssql.js';
import { CreateCompleteAfiliadoData, CompleteAfiliadoResult } from '../../domain/entities/CompleteAfiliado.js';
import { getPool } from '../../../../db/mssql.js';
import pino from 'pino';
import {
  AfiliadoAlreadyExistsError,
  AfiliadoRegistrationError
} from '../../domain/errors.js';

const logger = pino({
  name: 'createCompleteAfiliadoCommand',
  level: process.env.LOG_LEVEL || 'info'
});

export class CreateCompleteAfiliadoCommand {
  constructor(private mssqlPool: ConnectionPool) {}

  async execute(data: CreateCompleteAfiliadoData): Promise<CompleteAfiliadoResult> {
    const logContext = {
      operation: 'createCompleteAfiliado',
      curp: data.afiliado.curp,
      rfc: data.afiliado.rfc,
      numeroSeguroSocial: data.afiliado.numeroSeguroSocial,
      usuario: data.movimiento.creadoPor
    };

    logger.info(logContext, 'Iniciando creación completa de afiliado');

    // Validar duplicados de CURP, RFC o NSS
    const duplicateQuery = await this.mssqlPool.request()
      .input('curp', sql.VarChar(18), data.afiliado.curp)
      .input('rfc', sql.VarChar(13), data.afiliado.rfc)
      .input('numeroSeguroSocial', sql.VarChar(50), data.afiliado.numeroSeguroSocial)
      .query(`
        SELECT id, curp, rfc, numeroSeguroSocial
        FROM afi.Afiliado
        WHERE (curp = @curp AND curp IS NOT NULL)
           OR (rfc = @rfc AND rfc IS NOT NULL)
           OR (numeroSeguroSocial = @numeroSeguroSocial AND numeroSeguroSocial IS NOT NULL)
      `);

    if (duplicateQuery.recordset.length > 0) {
      const duplicate = duplicateQuery.recordset[0];
      const duplicateField = duplicate.curp === data.afiliado.curp ? 'CURP'
        : duplicate.rfc === data.afiliado.rfc ? 'RFC'
        : 'NSS';

      logger.warn({ ...logContext, duplicateField, duplicateId: duplicate.id }, `Afiliado ya existe con ${duplicateField}`);
      throw new AfiliadoAlreadyExistsError({
        field: duplicateField,
        value: duplicate[duplicateField.toLowerCase()],
        existingId: duplicate.id
      });
    }

    // Iniciar transacción
    const p = await getPool();
    const transaction = p.transaction();
    await transaction.begin();

    try {
      // Auto-generar folio si no se proporciona o es 0
      let folio = data.afiliado.folio;
      if (!folio || folio === 0) {
        const folioResult = await transaction.request().query(`
          SELECT ISNULL(MAX(folio), 0) + 1 AS nextFolio
          FROM afi.Afiliado
        `);
        folio = folioResult.recordset[0].nextFolio;
        logger.info({ ...logContext, folio }, 'Folio auto-generado para afiliado');
      }

      // Calcular quincena y año si no se proporcionan
      let quincenaAplicacion = data.afiliado.quincenaAplicacion;
      let anioAplicacion = data.afiliado.anioAplicacion;
      
      if (!quincenaAplicacion || !anioAplicacion) {
        const quincenaData = await this.getQuincenaAplicacion(
          data.afiliadoOrg.claveOrganica0 || '',
          data.afiliadoOrg.claveOrganica1,
          data.afiliadoOrg.claveOrganica2,
          data.afiliadoOrg.claveOrganica3,
          data.movimiento.creadoPor || undefined
        );
        quincenaAplicacion = quincenaData.quincena;
        anioAplicacion = quincenaData.anio;
        logger.info({
          ...logContext,
          quincenaAplicacion,
          anioAplicacion,
          claveOrganica0: data.afiliadoOrg.claveOrganica0,
          claveOrganica1: data.afiliadoOrg.claveOrganica1,
          claveOrganica2: data.afiliadoOrg.claveOrganica2,
          claveOrganica3: data.afiliadoOrg.claveOrganica3
        }, 'Quincena calculada para orgánica');
      }

      // Insertar Afiliado
      const afiliadoRequest = transaction.request()
        .input('folio', sql.Int, folio)
        .input('apellidoPaterno', sql.NVarChar(255), data.afiliado.apellidoPaterno)
        .input('apellidoMaterno', sql.NVarChar(255), data.afiliado.apellidoMaterno)
        .input('nombre', sql.NVarChar(200), data.afiliado.nombre)
        .input('curp', sql.VarChar(18), data.afiliado.curp)
        .input('rfc', sql.VarChar(13), data.afiliado.rfc)
        .input('numeroSeguroSocial', sql.VarChar(50), data.afiliado.numeroSeguroSocial)
        .input('fechaNacimiento', sql.Date, data.afiliado.fechaNacimiento ? new Date(data.afiliado.fechaNacimiento) : null)
        .input('entidadFederativaNacId', sql.Int, data.afiliado.entidadFederativaNacId)
        .input('domicilioCalle', sql.NVarChar(255), data.afiliado.domicilioCalle)
        .input('domicilioNumeroExterior', sql.VarChar(50), data.afiliado.domicilioNumeroExterior)
        .input('domicilioNumeroInterior', sql.VarChar(50), data.afiliado.domicilioNumeroInterior)
        .input('domicilioEntreCalle1', sql.NVarChar(120), data.afiliado.domicilioEntreCalle1)
        .input('domicilioEntreCalle2', sql.NVarChar(120), data.afiliado.domicilioEntreCalle2)
        .input('domicilioColonia', sql.NVarChar(255), data.afiliado.domicilioColonia)
        .input('domicilioCodigoPostal', sql.Int, data.afiliado.domicilioCodigoPostal)
        .input('telefono', sql.VarChar(10), data.afiliado.telefono)
        .input('estadoCivilId', sql.Int, data.afiliado.estadoCivilId)
        .input('sexo', sql.Char(1), data.afiliado.sexo)
        .input('correoElectronico', sql.NVarChar(255), data.afiliado.correoElectronico)
        .input('estatus', sql.Bit, data.afiliado.estatus)
        .input('interno', sql.Int, data.afiliado.interno)
        .input('noEmpleado', sql.VarChar(20), data.afiliado.noEmpleado)
        .input('localidad', sql.NVarChar(150), data.afiliado.localidad)
        .input('municipio', sql.NVarChar(150), data.afiliado.municipio)
        .input('estado', sql.NVarChar(150), data.afiliado.estado)
        .input('pais', sql.NVarChar(100), data.afiliado.pais)
        .input('dependientes', sql.SmallInt, data.afiliado.dependientes)
        .input('poseeInmuebles', sql.Bit, data.afiliado.poseeInmuebles)
        .input('fechaCarta', sql.Date, data.afiliado.fechaCarta ? new Date(data.afiliado.fechaCarta) : null)
        .input('nacionalidad', sql.NVarChar(80), data.afiliado.nacionalidad)
        .input('fechaAlta', sql.Date, data.afiliado.fechaAlta ? new Date(data.afiliado.fechaAlta) : null)
        .input('celular', sql.VarChar(15), data.afiliado.celular)
        .input('expediente', sql.VarChar(50), data.afiliado.expediente)
        .input('quincenaAplicacion', sql.TinyInt, quincenaAplicacion)
        .input('anioAplicacion', sql.SmallInt, anioAplicacion);

      const afiliadoResult = await afiliadoRequest.query(`
        INSERT INTO afi.Afiliado (
          folio, apellidoPaterno, apellidoMaterno, nombre, curp, rfc,
          numeroSeguroSocial, fechaNacimiento, entidadFederativaNacId,
          domicilioCalle, domicilioNumeroExterior, domicilioNumeroInterior,
          domicilioEntreCalle1, domicilioEntreCalle2, domicilioColonia,
          domicilioCodigoPostal, telefono, estadoCivilId, sexo,
          correoElectronico, estatus, interno, noEmpleado, localidad,
          municipio, estado, pais, dependientes, poseeInmuebles,
          fechaCarta, nacionalidad, fechaAlta, celular, expediente,
          quincenaAplicacion, anioAplicacion
        )
        OUTPUT INSERTED.*
        VALUES (
          @folio, @apellidoPaterno, @apellidoMaterno, @nombre, @curp, @rfc,
          @numeroSeguroSocial, @fechaNacimiento, @entidadFederativaNacId,
          @domicilioCalle, @domicilioNumeroExterior, @domicilioNumeroInterior,
          @domicilioEntreCalle1, @domicilioEntreCalle2, @domicilioColonia,
          @domicilioCodigoPostal, @telefono, @estadoCivilId, @sexo,
          @correoElectronico, @estatus, @interno, @noEmpleado, @localidad,
          @municipio, @estado, @pais, @dependientes, @poseeInmuebles,
          @fechaCarta, @nacionalidad, @fechaAlta, @celular, @expediente,
          @quincenaAplicacion, @anioAplicacion
        )
      `);

      const afiliadoRow = afiliadoResult.recordset[0];
      const afiliadoId = afiliadoRow.id;
      logger.info({
        ...logContext,
        afiliadoId,
        folio,
        quincenaAplicacion,
        anioAplicacion
      }, 'Afiliado creado exitosamente');

      // Insertar AfiliadoOrg
      const afiliadoOrgRequest = transaction.request()
        .input('afiliadoId', sql.Int, afiliadoId)
        .input('nivel0Id', sql.BigInt, data.afiliadoOrg.nivel0Id)
        .input('nivel1Id', sql.BigInt, data.afiliadoOrg.nivel1Id)
        .input('nivel2Id', sql.BigInt, data.afiliadoOrg.nivel2Id)
        .input('nivel3Id', sql.BigInt, data.afiliadoOrg.nivel3Id)
        .input('claveOrganica0', sql.VarChar(30), data.afiliadoOrg.claveOrganica0)
        .input('claveOrganica1', sql.VarChar(30), data.afiliadoOrg.claveOrganica1)
        .input('claveOrganica2', sql.VarChar(30), data.afiliadoOrg.claveOrganica2)
        .input('claveOrganica3', sql.VarChar(30), data.afiliadoOrg.claveOrganica3)
        .input('interno', sql.Int, data.afiliadoOrg.interno)
        .input('sueldo', sql.Decimal(12, 2), data.afiliadoOrg.sueldo)
        .input('otrasPrestaciones', sql.Decimal(12, 2), data.afiliadoOrg.otrasPrestaciones)
        .input('quinquenios', sql.Decimal(12, 2), data.afiliadoOrg.quinquenios)
        .input('activo', sql.Bit, data.afiliadoOrg.activo)
        .input('fechaMovAlt', sql.Date, data.afiliadoOrg.fechaMovAlt ? new Date(data.afiliadoOrg.fechaMovAlt) : null)
        .input('orgs1', sql.VarChar(200), data.afiliadoOrg.orgs1)
        .input('orgs2', sql.VarChar(200), data.afiliadoOrg.orgs2)
        .input('orgs3', sql.VarChar(200), data.afiliadoOrg.orgs3)
        .input('orgs4', sql.VarChar(200), data.afiliadoOrg.orgs4)
        .input('dSueldo', sql.VarChar(200), data.afiliadoOrg.dSueldo)
        .input('dOtrasPrestaciones', sql.VarChar(200), data.afiliadoOrg.dOtrasPrestaciones)
        .input('dQuinquenios', sql.VarChar(200), data.afiliadoOrg.dQuinquenios)
        .input('aplicar', sql.Bit, data.afiliadoOrg.aplicar)
        .input('bc', sql.VarChar(30), data.afiliadoOrg.bc)
        .input('porcentaje', sql.Decimal(9, 4), data.afiliadoOrg.porcentaje);

      const afiliadoOrgResult = await afiliadoOrgRequest.query(`
        INSERT INTO afi.AfiliadoOrg (
          afiliadoId, nivel0Id, nivel1Id, nivel2Id, nivel3Id,
          claveOrganica0, claveOrganica1, claveOrganica2, claveOrganica3,
          interno, sueldo, otrasPrestaciones, quinquenios, activo,
          fechaMovAlt, orgs1, orgs2, orgs3, orgs4, dSueldo,
          dOtrasPrestaciones, dQuinquenios, aplicar, bc, porcentaje
        )
        OUTPUT INSERTED.*
        VALUES (
          @afiliadoId, @nivel0Id, @nivel1Id, @nivel2Id, @nivel3Id,
          @claveOrganica0, @claveOrganica1, @claveOrganica2, @claveOrganica3,
          @interno, @sueldo, @otrasPrestaciones, @quinquenios, @activo,
          @fechaMovAlt, @orgs1, @orgs2, @orgs3, @orgs4, @dSueldo,
          @dOtrasPrestaciones, @dQuinquenios, @aplicar, @bc, @porcentaje
        )
      `);

      const afiliadoOrgRow = afiliadoOrgResult.recordset[0];

      // Calcular quincenaId para el movimiento
      let quincenaId = data.movimiento.quincenaId;
      if (!quincenaId) {
        quincenaId = `${anioAplicacion}-${String(quincenaAplicacion).padStart(2, '0')}`;
      }

      // Insertar Movimiento
      const movimientoRequest = transaction.request()
        .input('quincenaId', sql.VarChar(30), quincenaId)
        .input('tipoMovimientoId', sql.Int, data.movimiento.tipoMovimientoId)
        .input('afiliadoId', sql.Int, afiliadoId)
        .input('fecha', sql.Date, data.movimiento.fecha ? new Date(data.movimiento.fecha) : null)
        .input('observaciones', sql.NVarChar(1024), data.movimiento.observaciones)
        .input('folio', sql.VarChar(100), data.movimiento.folio)
        .input('estatus', sql.VarChar(30), data.movimiento.estatus)
        .input('creadoPor', sql.Int, data.movimiento.creadoPor)
        .input('creadoPorUid', sql.UniqueIdentifier, data.movimiento.creadoPorUid);

      const movimientoResult = await movimientoRequest.query(`
        INSERT INTO afi.Movimiento (
          quincenaId, tipoMovimientoId, afiliadoId, fecha,
          observaciones, folio, estatus, creadoPor, creadoPorUid
        )
        OUTPUT INSERTED.*
        VALUES (
          @quincenaId, @tipoMovimientoId, @afiliadoId, @fecha,
          @observaciones, @folio, @estatus, @creadoPor, @creadoPorUid
        )
      `);

      const movimientoRow = movimientoResult.recordset[0];

      // Commit transacción
      await transaction.commit();

      logger.info({
        ...logContext,
        afiliadoId: afiliadoRow.id,
        afiliadoOrgId: afiliadoOrgRow.id,
        movimientoId: movimientoRow.id
      }, 'Creación completa de afiliado finalizada exitosamente');

      // Mapear resultados
      return {
        afiliado: {
          id: afiliadoRow.id,
          folio: afiliadoRow.folio,
          apellidoPaterno: afiliadoRow.apellidoPaterno,
          apellidoMaterno: afiliadoRow.apellidoMaterno,
          nombre: afiliadoRow.nombre,
          curp: afiliadoRow.curp,
          rfc: afiliadoRow.rfc,
          numeroSeguroSocial: afiliadoRow.numeroSeguroSocial,
          fechaNacimiento: afiliadoRow.fechaNacimiento?.toISOString().split('T')[0] || null,
          entidadFederativaNacId: afiliadoRow.entidadFederativaNacId,
          domicilioCalle: afiliadoRow.domicilioCalle,
          domicilioNumeroExterior: afiliadoRow.domicilioNumeroExterior,
          domicilioNumeroInterior: afiliadoRow.domicilioNumeroInterior,
          domicilioEntreCalle1: afiliadoRow.domicilioEntreCalle1,
          domicilioEntreCalle2: afiliadoRow.domicilioEntreCalle2,
          domicilioColonia: afiliadoRow.domicilioColonia,
          domicilioCodigoPostal: afiliadoRow.domicilioCodigoPostal,
          telefono: afiliadoRow.telefono,
          estadoCivilId: afiliadoRow.estadoCivilId,
          sexo: afiliadoRow.sexo,
          correoElectronico: afiliadoRow.correoElectronico,
          estatus: afiliadoRow.estatus === 1 || afiliadoRow.estatus === true,
          interno: afiliadoRow.interno,
          noEmpleado: afiliadoRow.noEmpleado,
          localidad: afiliadoRow.localidad,
          municipio: afiliadoRow.municipio,
          estado: afiliadoRow.estado,
          pais: afiliadoRow.pais,
          dependientes: afiliadoRow.dependientes,
          poseeInmuebles: afiliadoRow.poseeInmuebles === 1 || afiliadoRow.poseeInmuebles === true ? true : afiliadoRow.poseeInmuebles === 0 || afiliadoRow.poseeInmuebles === false ? false : null,
          fechaCarta: afiliadoRow.fechaCarta?.toISOString().split('T')[0] || null,
          nacionalidad: afiliadoRow.nacionalidad,
          fechaAlta: afiliadoRow.fechaAlta?.toISOString().split('T')[0] || null,
          celular: afiliadoRow.celular,
          expediente: afiliadoRow.expediente,
          quincenaAplicacion: afiliadoRow.quincenaAplicacion,
          anioAplicacion: afiliadoRow.anioAplicacion,
          createdAt: afiliadoRow.createdAt?.toISOString() || new Date().toISOString(),
          updatedAt: afiliadoRow.updatedAt?.toISOString() || new Date().toISOString()
        },
        afiliadoOrg: {
          id: afiliadoOrgRow.id,
          afiliadoId: afiliadoOrgRow.afiliadoId,
          nivel0Id: afiliadoOrgRow.nivel0Id,
          nivel1Id: afiliadoOrgRow.nivel1Id,
          nivel2Id: afiliadoOrgRow.nivel2Id,
          nivel3Id: afiliadoOrgRow.nivel3Id,
          claveOrganica0: afiliadoOrgRow.claveOrganica0,
          claveOrganica1: afiliadoOrgRow.claveOrganica1,
          claveOrganica2: afiliadoOrgRow.claveOrganica2,
          claveOrganica3: afiliadoOrgRow.claveOrganica3,
          interno: afiliadoOrgRow.interno,
          sueldo: afiliadoOrgRow.sueldo,
          otrasPrestaciones: afiliadoOrgRow.otrasPrestaciones,
          quinquenios: afiliadoOrgRow.quinquenios,
          activo: afiliadoOrgRow.activo === 1 || afiliadoOrgRow.activo === true,
          fechaMovAlt: afiliadoOrgRow.fechaMovAlt?.toISOString().split('T')[0] || null,
          orgs1: afiliadoOrgRow.orgs1,
          orgs2: afiliadoOrgRow.orgs2,
          orgs3: afiliadoOrgRow.orgs3,
          orgs4: afiliadoOrgRow.orgs4,
          dSueldo: afiliadoOrgRow.dSueldo,
          dOtrasPrestaciones: afiliadoOrgRow.dOtrasPrestaciones,
          dQuinquenios: afiliadoOrgRow.dQuinquenios,
          aplicar: afiliadoOrgRow.aplicar === 1 || afiliadoOrgRow.aplicar === true ? true : afiliadoOrgRow.aplicar === 0 || afiliadoOrgRow.aplicar === false ? false : null,
          bc: afiliadoOrgRow.bc,
          porcentaje: afiliadoOrgRow.porcentaje,
          createdAt: afiliadoOrgRow.createdAt?.toISOString() || new Date().toISOString(),
          updatedAt: afiliadoOrgRow.updatedAt?.toISOString() || new Date().toISOString()
        },
        movimiento: {
          id: movimientoRow.id,
          quincenaId: movimientoRow.quincenaId,
          tipoMovimientoId: movimientoRow.tipoMovimientoId,
          afiliadoId: movimientoRow.afiliadoId,
          fecha: movimientoRow.fecha?.toISOString().split('T')[0] || null,
          observaciones: movimientoRow.observaciones,
          folio: movimientoRow.folio,
          estatus: movimientoRow.estatus,
          creadoPor: movimientoRow.creadoPor,
          creadoPorUid: movimientoRow.creadoPorUid,
          createdAt: movimientoRow.createdAt?.toISOString() || new Date().toISOString()
        }
      };
    } catch (error) {
      await transaction.rollback();
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      const errorStack = error instanceof Error ? error.stack : undefined;

      logger.error({
        ...logContext,
        error: errorMessage,
        stack: errorStack
      }, 'Error al crear afiliado completo, transacción revertida');

      if (error instanceof AfiliadoAlreadyExistsError) {
        throw error;
      }

      throw new AfiliadoRegistrationError('Error al crear afiliado completo', {
        originalError: errorMessage,
        curp: data.afiliado.curp
      });
    }
  }

  private async getQuincenaAplicacion(
    org0: string,
    org1?: string | null,
    org2?: string | null,
    org3?: string | null,
    userId?: number
  ): Promise<{ quincena: number; anio: number }> {
    const p = await getPool();
    
    const whereConditions = ['Org0 = @Org0'];
    const request = p.request().input('Org0', sql.Char(2), org0);
    
    let orgNivel = 0;
    if (org1) {
      whereConditions.push('Org1 = @Org1');
      request.input('Org1', sql.Char(2), org1);
      orgNivel = 1;
    }
    if (org2) {
      whereConditions.push('Org2 = @Org2');
      request.input('Org2', sql.Char(2), org2);
      orgNivel = 2;
    }
    if (org3) {
      whereConditions.push('Org3 = @Org3');
      request.input('Org3', sql.Char(2), org3);
      orgNivel = 3;
    }
    
    const result = await request.query(`
      SELECT TOP 1 Quincena, Anio, Accion
      FROM afec.BitacoraAfectacionOrg
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY Anio DESC, Quincena DESC, CreatedAt DESC
    `);

    const currentYear = new Date().getFullYear();
    let quincena: number;
    let anio: number;
    let needsRegistration = false;

    if (result.recordset.length === 0) {
      quincena = 1;
      anio = currentYear;
      needsRegistration = true;
      logger.info({
        org0, org1, org2, org3, quincena, anio
      }, 'No existe quincena para orgánica, creando quincena inicial');
    } else {
      const lastRecord = result.recordset[0];
      const lastQuincena = lastRecord.Quincena;
      const lastAnio = lastRecord.Anio;
      const accion = lastRecord.Accion;

      if (accion === 'Completa') {
        quincena = lastQuincena === 24 ? 1 : lastQuincena + 1;
        anio = lastQuincena === 24 ? lastAnio + 1 : lastAnio;
        needsRegistration = true;
        logger.info({
          org0, org1, org2, org3, quincena, anio, lastQuincena, lastAnio, accion
        }, 'Última acción fue Completa, calculando nueva quincena');
      } else {
        quincena = lastQuincena;
        anio = lastAnio;
        logger.info({
          org0, org1, org2, org3, quincena, anio, accion
        }, 'Usando quincena existente');
      }
    }

    if (needsRegistration) {
      try {
        const registerRequest = p.request()
          .input('Entidad', sql.NVarChar(128), 'AFILIADOS')
          .input('Anio', sql.SmallInt, anio)
          .input('Quincena', sql.TinyInt, quincena)
          .input('OrgNivel', sql.TinyInt, orgNivel)
          .input('Org0', sql.Char(2), org0)
          .input('Org1', sql.Char(2), org1 || null)
          .input('Org2', sql.Char(2), org2 || null)
          .input('Org3', sql.Char(2), org3 || null)
          .input('Accion', sql.VarChar(20), 'Aplicar')
          .input('Resultado', sql.VarChar(10), 'OK')
          .input('Mensaje', sql.NVarChar(4000), `Quincena ${quincena}/${anio} creada automáticamente para afiliación`)
          .input('Usuario', sql.NVarChar(100), userId ? `Usuario_${userId}` : 'Sistema')
          .input('AppName', sql.NVarChar(100), 'BICSN_Afiliados')
          .input('Ip', sql.NVarChar(64), 'localhost');

        await registerRequest.execute('afec.usp_RegistrarAfectacionOrg');
        logger.info({
          org0, org1, org2, org3, quincena, anio, userId
        }, 'Quincena registrada exitosamente en BitacoraAfectacionOrg');
      } catch (error: any) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        logger.warn({
          org0, org1, org2, org3, quincena, anio, userId, error: errorMessage
        }, 'Error al registrar quincena en afectación, continuando con creación de afiliado');
      }
    }

    return { quincena, anio };
  }
}
