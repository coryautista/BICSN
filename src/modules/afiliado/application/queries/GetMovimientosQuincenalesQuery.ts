import { ConnectionPool } from 'mssql';
import sql from 'mssql';
import { MovimientoQuincenal } from '../../domain/entities/MovimientoQuincenal.js';
import pino from 'pino';
import {
  AfiliadoQueryError,
  InvalidAfiliadoDataError
} from '../../domain/errors.js';

const logger = pino({
  name: 'getMovimientosQuincenalesQuery',
  level: process.env.LOG_LEVEL || 'info'
});

export class GetMovimientosQuincenalesQuery {
  constructor(private mssqlPool: ConnectionPool) {}

  async execute(userOrg0: string, userOrg1: string): Promise<MovimientoQuincenal[]> {
    const logContext = {
      operation: 'getMovimientosQuincenales',
      userOrg0,
      userOrg1
    };

    logger.info(logContext, 'Consultando movimientos quincenales');

    // Validar parámetros de entrada
    if (!userOrg0 || !userOrg1) {
      logger.warn(logContext, 'Parámetros de organización inválidos');
      throw new InvalidAfiliadoDataError('userOrg0/userOrg1', 'Parámetros de organización requeridos');
    }

    try {
      const result = await this.mssqlPool.request()
        .input('userOrg0', sql.Char(2), userOrg0)
        .input('userOrg1', sql.Char(2), userOrg1)
      .query(`
      SELECT
        -- Afiliado fields
        a.id as afiliado_id,
        a.folio,
        a.apellidoPaterno,
        a.apellidoMaterno,
        a.nombre,
        a.curp,
        a.rfc,
        a.numeroSeguroSocial,
        a.fechaNacimiento,
        a.entidadFederativaNacId,
        a.domicilioCalle,
        a.domicilioNumeroExterior,
        a.domicilioNumeroInterior,
        a.domicilioEntreCalle1,
        a.domicilioEntreCalle2,
        a.domicilioColonia,
        a.domicilioCodigoPostal,
        a.telefono,
        a.estadoCivilId,
        a.sexo,
        a.correoElectronico,
        a.estatus,
        a.interno,
        a.noEmpleado,
        a.localidad,
        a.municipio,
        a.estado,
        a.pais,
        a.dependientes,
        a.poseeInmuebles,
        a.fechaCarta,
        a.nacionalidad,
        a.fechaAlta,
        a.celular,
        a.expediente,
        a.quincenaAplicacion,
        a.anioAplicacion,
        a.numValidacion,

        -- AfiliadoOrg fields
        ao.id as afiliadoOrg_id,
        ao.afiliadoId,
        ao.nivel0Id,
        ao.nivel1Id,
        ao.nivel2Id,
        ao.nivel3Id,
        ao.claveOrganica0,
        ao.claveOrganica1,
        ao.claveOrganica2,
        ao.claveOrganica3,
        ao.interno as internoOrg,
        ao.sueldo,
        ao.otrasPrestaciones,
        ao.quinquenios,
        ao.activo,
        ao.fechaMovAlt,
        ao.orgs1,
        ao.orgs2,
        ao.orgs3,
        ao.orgs4,
        ao.dSueldo,
        ao.dOtrasPrestaciones,
        ao.dQuinquenios,
        ao.aplicar,
        ao.bc,
        ao.porcentaje,

        -- Movimiento fields
        m.id as movimiento_id,
        m.quincenaId,
        m.tipoMovimientoId,
        m.afiliadoId as movimiento_afiliadoId,
        m.fecha,
        m.observaciones,
        m.folio as movimiento_folio,
        m.estatus as movimiento_estatus,
        m.creadoPor,
        m.creadoPorUid,

        -- TipoMovimiento fields
        tm.nombre as tipoMovimientoDescripcion,

        -- AfiliadoStatusControl fields
        statusCtrl.nombreStatus as numValidacionDescripcion

      FROM afi.Afiliado a
      INNER JOIN afi.AfiliadoOrg ao ON a.id = ao.afiliadoId
      INNER JOIN afi.Movimiento m ON a.id = m.afiliadoId
      LEFT JOIN afi.TipoMovimiento tm ON m.tipoMovimientoId = tm.id
      LEFT JOIN afi.AfiliadoStatusControl statusCtrl ON a.numValidacion = statusCtrl.numValidacion
      WHERE ao.claveOrganica0 = @userOrg0
        AND ao.claveOrganica1 = @userOrg1
        AND a.estatus = 1
        AND m.estatus IN ('A', 'L')
      ORDER BY a.id, m.id
    `);

  const movimientos = result.recordset.map((row: any) => {
        const afiliadoObj = {
          id: parseInt(row.afiliado_id) || 0,
          folio: row.folio ? parseInt(row.folio) : null,
          apellidoPaterno: row.apellidoPaterno,
          apellidoMaterno: row.apellidoMaterno,
          nombre: row.nombre,
          curp: row.curp,
          rfc: row.rfc,
          numeroSeguroSocial: row.numeroSeguroSocial,
          fechaNacimiento: row.fechaNacimiento?.toISOString().split('T')[0] || null,
          entidadFederativaNacId: row.entidadFederativaNacId ? parseInt(row.entidadFederativaNacId) : null,
          domicilioCalle: row.domicilioCalle,
          domicilioNumeroExterior: row.domicilioNumeroExterior,
          domicilioNumeroInterior: row.domicilioNumeroInterior,
          domicilioEntreCalle1: row.domicilioEntreCalle1,
          domicilioEntreCalle2: row.domicilioEntreCalle2,
          domicilioColonia: row.domicilioColonia,
          domicilioCodigoPostal: row.domicilioCodigoPostal ? parseInt(row.domicilioCodigoPostal) : null,
          telefono: row.telefono,
          estadoCivilId: row.estadoCivilId ? parseInt(row.estadoCivilId) : null,
          sexo: row.sexo,
          correoElectronico: row.correoElectronico,
          estatus: row.estatus === 1 || row.estatus === true,
          interno: row.interno ? parseInt(row.interno) : null,
          noEmpleado: row.noEmpleado,
          localidad: row.localidad,
          municipio: row.municipio,
          estado: row.estado,
          pais: row.pais,
          dependientes: row.dependientes ? parseInt(row.dependientes) : null,
          poseeInmuebles: row.poseeInmuebles === 1 || row.poseeInmuebles === true ? true : row.poseeInmuebles === 0 || row.poseeInmuebles === false ? false : null,
          fechaCarta: row.fechaCarta?.toISOString().split('T')[0] || null,
          nacionalidad: row.nacionalidad,
          fechaAlta: row.fechaAlta?.toISOString().split('T')[0] || null,
          celular: row.celular,
          expediente: row.expediente,
          quincenaAplicacion: row.quincenaAplicacion ? parseInt(row.quincenaAplicacion) : null,
          anioAplicacion: row.anioAplicacion ? parseInt(row.anioAplicacion) : null,
          numValidacion: row.numValidacion || 1,
          numValidacionDescripcion: row.numValidacionDescripcion,
          createdAt: row.afiliado_createdAt?.toISOString() || new Date().toISOString(),
          updatedAt: row.afiliado_updatedAt?.toISOString() || new Date().toISOString()
        };

        console.log('DEBUG: Raw numValidacion:', row.numValidacion);
        console.log('DEBUG: Raw numValidacionDescripcion:', row.numValidacionDescripcion);
        console.log('DEBUG: Raw tipoMovimientoDescripcion:', row.tipoMovimientoDescripcion);
        console.log('DEBUG: Final afiliado object:', JSON.stringify(afiliadoObj, null, 2));

        return {
          afiliado: afiliadoObj,
          afiliadoOrg: {
            id: parseInt(row.afiliadoOrg_id) || 0,
            afiliadoId: parseInt(row.afiliadoId) || 0,
            nivel0Id: row.nivel0Id ? parseInt(row.nivel0Id) : null,
            nivel1Id: row.nivel1Id ? parseInt(row.nivel1Id) : null,
            nivel2Id: row.nivel2Id ? parseInt(row.nivel2Id) : null,
            nivel3Id: row.nivel3Id ? parseInt(row.nivel3Id) : null,
            claveOrganica0: row.claveOrganica0,
            claveOrganica1: row.claveOrganica1,
            claveOrganica2: row.claveOrganica2,
            claveOrganica3: row.claveOrganica3,
            interno: row.internoOrg ? parseInt(row.internoOrg) : null,
            sueldo: row.sueldo ? parseFloat(row.sueldo) : null,
            otrasPrestaciones: row.otrasPrestaciones ? parseFloat(row.otrasPrestaciones) : null,
            quinquenios: row.quinquenios ? parseFloat(row.quinquenios) : null,
            activo: row.activo === 1 || row.activo === true,
            fechaMovAlt: row.fechaMovAlt?.toISOString().split('T')[0] || null,
            orgs1: row.orgs1,
            orgs2: row.orgs2,
            orgs3: row.orgs3,
            orgs4: row.orgs4,
            dSueldo: row.dSueldo,
            dOtrasPrestaciones: row.dOtrasPrestaciones,
            dQuinquenios: row.dQuinquenios,
            aplicar: row.aplicar === 1 || row.aplicar === true ? true : row.aplicar === 0 || row.aplicar === false ? false : null,
            bc: row.bc,
            porcentaje: row.porcentaje ? parseFloat(row.porcentaje) : null
          },
          movimiento: {
            id: parseInt(row.movimiento_id) || 0,
            quincenaId: row.quincenaId,
            tipoMovimientoId: row.tipoMovimientoId ? parseInt(row.tipoMovimientoId) : 0,
            tipoMovimientoDescripcion: row.tipoMovimientoDescripcion,
            afiliadoId: parseInt(row.movimiento_afiliadoId) || 0,
            fecha: row.fecha?.toISOString().split('T')[0] || null,
            observaciones: row.observaciones,
            folio: row.movimiento_folio,
            estatus: row.movimiento_estatus,
            creadoPor: row.creadoPor ? parseInt(row.creadoPor) : null,
            creadoPorUid: row.creadoPorUid
          }
        };
      });

      console.log('DEBUG: Final movimientos array:', JSON.stringify(movimientos, null, 2));

      // Debug minimal fields to verify presence in runtime without exposing sensitive data
      if (movimientos.length > 0) {
        const sample = movimientos[0];
        logger.info({
          ...logContext,
          sample: {
            afiliadoId: sample.afiliado.id,
            numValidacion: sample.afiliado.numValidacion,
            numValidacionDescripcion: sample.afiliado.numValidacionDescripcion,
            tipoMovimientoDescripcion: sample.movimiento.tipoMovimientoDescripcion
          }
        }, 'Verificación de campos de validación en respuesta');
      }

      logger.info({
        ...logContext,
        count: movimientos.length
      }, 'Consulta de movimientos quincenales completada exitosamente');

      return movimientos;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      logger.error({
        ...logContext,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      }, 'Error al consultar movimientos quincenales');

      throw new AfiliadoQueryError('Error al obtener movimientos quincenales', {
        originalError: errorMessage,
        userOrg0,
        userOrg1
      });
    }
  }
}
