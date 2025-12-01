import { getPool, sql } from '../../db/mssql.js';
import { executeSerializedQuery } from '../../db/firebird.js';
import type { AfiliadoOrg } from '../afiliadoOrg/afiliadoOrg.repo.js';
import type { Movimiento } from '../movimiento/movimiento.repo.js';
import { AfiliadoAlreadyExistsError } from './domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'afiliado-repo',
  level: process.env.LOG_LEVEL || 'info'
});

export type Afiliado = {
  id: number;
  folio: number | null;
  apellidoPaterno: string | null;
  apellidoMaterno: string | null;
  nombre: string | null;
  curp: string | null;
  rfc: string | null;
  numeroSeguroSocial: string | null;
  fechaNacimiento: string | null;
  entidadFederativaNacId: number | null;
  domicilioCalle: string | null;
  domicilioNumeroExterior: string | null;
  domicilioNumeroInterior: string | null;
  domicilioEntreCalle1: string | null;
  domicilioEntreCalle2: string | null;
  domicilioColonia: string | null;
  domicilioCodigoPostal: number | null;
  telefono: string | null;
  estadoCivilId: number | null;
  sexo: string | null;
  correoElectronico: string | null;
  estatus: boolean;
  interno: number | null;
  noEmpleado: string | null;
  localidad: string | null;
  municipio: string | null;
  estado: string | null;
  pais: string | null;
  dependientes: number | null;
  poseeInmuebles: boolean | null;
  fechaCarta: string | null;
  nacionalidad: string | null;
  fechaAlta: string | null;
  celular: string | null;
  expediente: string | null;
  quincenaAplicacion: number | null;
  anioAplicacion: number | null;
  codigoPostal: number | null;
  numValidacion: number;
  afiliadosComplete: number;
  createdAt: string;
  updatedAt: string;
};

// Tipos para gestión de estados
export interface AfiliadoStatusControl {
  id: number;
  numValidacion: number;
  nombreStatus: string;
  descripcion: string | null;
  color: string | null;
  activo: boolean;
  orden: number;
  fechaCreacion: string;
  fechaModificacion: string;
  usuarioCreacion: string;
  usuarioModificacion: string;
}

export interface AfiliadoStatusHistory {
  id: number;
  afiliadoId: number;
  numValidacionAnterior: number | null;
  numValidacionNuevo: number;
  statusAnterior: string | null;
  statusNuevo: string;
  motivo: string | null;
  observaciones: string | null;
  usuarioId: string;
  fechaCambio: string;
  ipAddress: string | null;
  userAgent: string | null;
}

export interface AfiliadoWithStatus extends Afiliado {
  numValidacion: number;
  nombreStatus: string;
  statusDescripcion: string | null;
  statusColor: string | null;
}

// Helper function to calculate quincenaAplicacion and anioAplicacion by organica
export async function getQuincenaAplicacion(
  org0: string,
  org1?: string | null,
  org2?: string | null,
  org3?: string | null,
  userId?: number
): Promise<{ quincena: number; anio: number }> {
  const p = await getPool();
  
  // Construir el WHERE dinámicamente basado en los niveles de orgánica proporcionados
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
    // No hay registros para esta orgánica, consultar Firebird para obtener quincena y año
    try {
      // Validar que org0 y org1 existan antes de consultar Firebird
      if (!org0 || !org1) {
        throw new Error('org0 y org1 son requeridos para consultar Firebird');
      }

      console.log(`No existe quincena para orgánica ${org0}/${org1}/${org2}/${org3}. Consultando Firebird AP_G_APLICADO_TIPO...`);
      
      // Consultar Firebird para obtener quincena y fecha
      const firebirdResult = await executeSerializedQuery((db) => {
        return new Promise<{ QUINCENA: number; FECHA: string }>((resolve, reject) => {
          try {
            const sql = `SELECT p.QUINCENA, p.FECHA FROM AP_G_APLICADO_TIPO(?, ?, '01', '01') p`;
            const params = [org0, org1];

            const timeoutId = setTimeout(() => {
              reject(new Error('Tiempo de espera agotado en consulta Firebird AP_G_APLICADO_TIPO'));
            }, 30000); // 30 segundos de timeout

            db.query(sql, params, (err: any, result: any) => {
              clearTimeout(timeoutId);
              
              if (err) {
                console.error(`Error al consultar AP_G_APLICADO_TIPO en Firebird: ${err.message}`);
                reject(err);
                return;
              }

              if (!result || result.length === 0) {
                reject(new Error('AP_G_APLICADO_TIPO no retornó resultados'));
                return;
              }

              const row = result[0];
              resolve({
                QUINCENA: row.QUINCENA,
                FECHA: row.FECHA
              });
            });
          } catch (error: any) {
            reject(error);
          }
        });
      });

      // Parsear QUINCENA: formato QQAA (quincena 2 dígitos + año 2 últimos dígitos)
      // Ejemplo: 2125 = quincena 21 del año 2025
      const quincenaStr = String(firebirdResult.QUINCENA).padStart(4, '0');
      const quincenaParsed = parseInt(quincenaStr.substring(0, 2));
      const anioSuffix = parseInt(quincenaStr.substring(2, 4));
      const anioFromQuincena = 2000 + anioSuffix; // Asumiendo siglo 20xx

      // Parsear FECHA: formato DD.MM.YYYY (ej: 15.11.2025)
      let anioFromFecha: number | null = null;
      if (firebirdResult.FECHA) {
        const fechaParts = firebirdResult.FECHA.split('.');
        if (fechaParts.length === 3) {
          const anioFecha = parseInt(fechaParts[2]);
          if (!isNaN(anioFecha) && anioFecha >= 2000 && anioFecha <= 2100) {
            anioFromFecha = anioFecha;
          }
        }
      }

      // Validar y usar los valores parseados
      if (quincenaParsed >= 1 && quincenaParsed <= 24 && anioFromQuincena >= 2000 && anioFromQuincena <= 2100) {
        quincena = quincenaParsed;
        // Preferir año de FECHA si está disponible y es válido, sino usar año de QUINCENA
        anio = anioFromFecha && anioFromFecha >= 2000 && anioFromFecha <= 2100 ? anioFromFecha : anioFromQuincena;
        needsRegistration = true;
        console.log(`Quincena obtenida de Firebird: ${quincena}/${anio} (QUINCENA: ${firebirdResult.QUINCENA}, FECHA: ${firebirdResult.FECHA})`);
      } else {
        throw new Error(`Valores parseados inválidos: quincena=${quincenaParsed}, año=${anioFromQuincena}`);
      }
    } catch (error: any) {
      // Fallback: usar quincena 1 y año actual si Firebird falla
      console.warn(`Error al consultar Firebird para obtener quincena (${error.message}), usando fallback: quincena 1, año ${currentYear}`);
      quincena = 1;
      anio = currentYear;
      needsRegistration = true;
    }
  } else {
    const lastRecord = result.recordset[0];
    const lastQuincena = lastRecord.Quincena;
    const lastAnio = lastRecord.Anio;
    const accion = lastRecord.Accion;

    // Si la última acción es "Completa", generar nueva quincena
    if (accion === 'Completa') {
      quincena = lastQuincena === 24 ? 1 : lastQuincena + 1;
      anio = lastQuincena === 24 ? lastAnio + 1 : lastAnio;
      needsRegistration = true;
      console.log(`Última acción fue 'Completa'. Nueva quincena: ${quincena}, Año: ${anio}`);
    } else {
      // Si es "Aplicar", usar la última quincena (no crear nueva)
      quincena = lastQuincena;
      anio = lastAnio;
      console.log(`Última acción fue '${accion}'. Usando quincena existente: ${quincena}, Año: ${anio}`);
    }
  }

  // Si se necesita registrar una nueva quincena, hacerlo en las 3 tablas
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
      console.log(`Quincena ${quincena}/${anio} registrada exitosamente en BitacoraAfectacionOrg, EstadoAfectacionOrg y ProgresoUsuarioOrg`);
    } catch (error: any) {
      console.error(`Error al registrar quincena en afec: ${error.message}`);
      // No fallar la transacción por esto, solo loguearlo
    }
  }

  return { quincena, anio };
}

export async function getAllAfiliados(): Promise<Afiliado[]> {
  const p = await getPool();
  const r = await p.request()
    .query(`
      SELECT
        id, folio, apellidoPaterno, apellidoMaterno, nombre, curp, rfc,
        numeroSeguroSocial, fechaNacimiento, entidadFederativaNacId,
        domicilioCalle, domicilioNumeroExterior, domicilioNumeroInterior,
        domicilioEntreCalle1, domicilioEntreCalle2,
        domicilioColonia, domicilioCodigoPostal, telefono, estadoCivilId,
        sexo, correoElectronico, estatus, interno, noEmpleado, localidad,
        municipio, estado, pais, dependientes, poseeInmuebles, fechaCarta,
        nacionalidad, fechaAlta, celular, expediente, quincenaAplicacion, anioAplicacion,
        codigoPostal, numValidacion, afiliadosComplete, createdAt, updatedAt
      FROM afi.Afiliado
      ORDER BY id
    `);
  return r.recordset.map((row: any) => ({
    id: row.id,
    folio: row.folio,
    apellidoPaterno: row.apellidoPaterno,
    apellidoMaterno: row.apellidoMaterno,
    nombre: row.nombre,
    curp: row.curp,
    rfc: row.rfc,
    numeroSeguroSocial: row.numeroSeguroSocial,
    fechaNacimiento: row.fechaNacimiento?.toISOString().split('T')[0] || null,
    entidadFederativaNacId: row.entidadFederativaNacId,
    domicilioCalle: row.domicilioCalle,
    domicilioNumeroExterior: row.domicilioNumeroExterior,
    domicilioNumeroInterior: row.domicilioNumeroInterior,
    domicilioEntreCalle1: row.domicilioEntreCalle1,
    domicilioEntreCalle2: row.domicilioEntreCalle2,
    domicilioColonia: row.domicilioColonia,
    domicilioCodigoPostal: row.domicilioCodigoPostal,
    telefono: row.telefono,
    estadoCivilId: row.estadoCivilId,
    sexo: row.sexo,
    correoElectronico: row.correoElectronico,
    estatus: row.estatus === 1 || row.estatus === true,
    interno: row.interno,
    noEmpleado: row.noEmpleado,
    localidad: row.localidad,
    municipio: row.municipio,
    estado: row.estado,
    pais: row.pais,
    dependientes: row.dependientes,
    poseeInmuebles: row.poseeInmuebles === 1 || row.poseeInmuebles === true ? true : row.poseeInmuebles === 0 || row.poseeInmuebles === false ? false : null,
    fechaCarta: row.fechaCarta?.toISOString().split('T')[0] || null,
    nacionalidad: row.nacionalidad,
    fechaAlta: row.fechaAlta?.toISOString().split('T')[0] || null,
    celular: row.celular,
    expediente: row.expediente,
    quincenaAplicacion: row.quincenaAplicacion,
    anioAplicacion: row.anioAplicacion,
    codigoPostal: row.codigoPostal,
    numValidacion: row.numValidacion || 1,
    afiliadosComplete: row.afiliadosComplete || 0,
    createdAt: row.createdAt?.toISOString() || new Date().toISOString(),
    updatedAt: row.updatedAt?.toISOString() || new Date().toISOString()
  }));
}

// Nueva función para obtener afiliados por orgánica del usuario
export async function getAfiliadosByUserOrganica(org0: string, org1: string): Promise<AfiliadoWithStatus[]> {
  const p = await getPool();
  const r = await p.request()
    .input('org0', sql.VarChar(30), org0)
    .input('org1', sql.VarChar(30), org1)
    .query(`
      SELECT DISTINCT
        a.id, a.folio, a.apellidoPaterno, a.apellidoMaterno, a.nombre, a.curp, a.rfc,
        a.numeroSeguroSocial, a.fechaNacimiento, a.entidadFederativaNacId,
        a.domicilioCalle, a.domicilioNumeroExterior, a.domicilioNumeroInterior,
        a.domicilioEntreCalle1, a.domicilioEntreCalle2,
        a.domicilioColonia, a.domicilioCodigoPostal, a.telefono, a.estadoCivilId,
        a.sexo, a.correoElectronico, a.estatus, a.interno, a.noEmpleado, a.localidad,
        a.municipio, a.estado, a.pais, a.dependientes, a.poseeInmuebles, a.fechaCarta,
        a.nacionalidad, a.fechaAlta, a.celular, a.expediente, a.quincenaAplicacion, a.anioAplicacion,
        a.codigoPostal, a.numValidacion, a.afiliadosComplete, a.createdAt, a.updatedAt,
        s.nombreStatus, s.descripcion as statusDescripcion, s.color as statusColor
      FROM afi.Afiliado a
      INNER JOIN afi.AfiliadoOrg ao ON a.id = ao.afiliadoId
      INNER JOIN afi.AfiliadoStatusControl s ON a.numValidacion = s.numValidacion
      WHERE ao.claveOrganica0 = @org0 
        AND ao.claveOrganica1 = @org1
        AND s.activo = 1
        AND a.estatus = 1
      ORDER BY a.id DESC
    `);
  
  return r.recordset.map((row: any) => ({
    ...row,
    fechaNacimiento: row.fechaNacimiento?.toISOString().split('T')[0] || null,
    fechaCarta: row.fechaCarta?.toISOString().split('T')[0] || null,
    fechaAlta: row.fechaAlta?.toISOString().split('T')[0] || null,
    createdAt: row.createdAt?.toISOString() || new Date().toISOString(),
    updatedAt: row.updatedAt?.toISOString() || new Date().toISOString(),
    estatus: row.estatus === 1 || row.estatus === true,
    poseeInmuebles: row.poseeInmuebles === 1 || row.poseeInmuebles === true ? true : row.poseeInmuebles === 0 || row.poseeInmuebles === false ? false : null,
    numValidacion: row.numValidacion || 1,
    afiliadosComplete: row.afiliadosComplete || 0
  }));
}

export async function getAfiliadoById(id: number): Promise<Afiliado | undefined> {
  const p = await getPool();
  const r = await p.request()
    .input('id', sql.Int, id)
    .query(`
      SELECT
        id, folio, apellidoPaterno, apellidoMaterno, nombre, curp, rfc,
        numeroSeguroSocial, fechaNacimiento, entidadFederativaNacId,
        domicilioCalle, domicilioNumeroExterior, domicilioNumeroInterior,
        domicilioEntreCalle1, domicilioEntreCalle2,
        domicilioColonia, domicilioCodigoPostal, telefono, estadoCivilId,
        sexo, correoElectronico, estatus, interno, noEmpleado, localidad,
        municipio, estado, pais, dependientes, poseeInmuebles, fechaCarta,
        nacionalidad, fechaAlta, celular, expediente, quincenaAplicacion, anioAplicacion,
        codigoPostal, numValidacion, afiliadosComplete, createdAt, updatedAt
      FROM afi.Afiliado
      WHERE id = @id
    `);
  const row = r.recordset[0];
  if (!row) return undefined;
  
  return {
    id: row.id,
    folio: row.folio,
    apellidoPaterno: row.apellidoPaterno,
    apellidoMaterno: row.apellidoMaterno,
    nombre: row.nombre,
    curp: row.curp,
    rfc: row.rfc,
    numeroSeguroSocial: row.numeroSeguroSocial,
    fechaNacimiento: row.fechaNacimiento?.toISOString().split('T')[0] || null,
    entidadFederativaNacId: row.entidadFederativaNacId,
    domicilioCalle: row.domicilioCalle,
    domicilioNumeroExterior: row.domicilioNumeroExterior,
    domicilioNumeroInterior: row.domicilioNumeroInterior,
    domicilioEntreCalle1: row.domicilioEntreCalle1,
    domicilioEntreCalle2: row.domicilioEntreCalle2,
    domicilioColonia: row.domicilioColonia,
    domicilioCodigoPostal: row.domicilioCodigoPostal,
    telefono: row.telefono,
    estadoCivilId: row.estadoCivilId,
    sexo: row.sexo,
    correoElectronico: row.correoElectronico,
    estatus: row.estatus === 1 || row.estatus === true,
    interno: row.interno,
    noEmpleado: row.noEmpleado,
    localidad: row.localidad,
    municipio: row.municipio,
    estado: row.estado,
    pais: row.pais,
    dependientes: row.dependientes,
    poseeInmuebles: row.poseeInmuebles === 1 || row.poseeInmuebles === true ? true : row.poseeInmuebles === 0 || row.poseeInmuebles === false ? false : null,
    fechaCarta: row.fechaCarta?.toISOString().split('T')[0] || null,
    nacionalidad: row.nacionalidad,
    fechaAlta: row.fechaAlta?.toISOString().split('T')[0] || null,
    celular: row.celular,
    expediente: row.expediente,
    quincenaAplicacion: row.quincenaAplicacion,
    anioAplicacion: row.anioAplicacion,
    codigoPostal: row.codigoPostal,
    numValidacion: row.numValidacion || 1,
    afiliadosComplete: row.afiliadosComplete || 0,
    createdAt: row.createdAt?.toISOString() || new Date().toISOString(),
    updatedAt: row.updatedAt?.toISOString() || new Date().toISOString()
  };
}

/**
 * Actualiza el campo interno de un afiliado en SQL Server
 * Se usa cuando se encuentra el INTERNO en Firebird y se necesita sincronizar con SQL Server
 * 
 * @param afiliadoId ID del afiliado en SQL Server
 * @param interno Número INTERNO obtenido de Firebird
 * @param usuarioId ID del usuario que realiza la actualización (opcional)
 */
export async function actualizarInternoAfiliado(
  afiliadoId: number,
  interno: number,
  usuarioId?: string
): Promise<void> {
  const logContext = {
    operation: 'actualizarInternoAfiliado',
    afiliadoId,
    interno,
    usuarioId
  };

  try {
    logger.info(logContext, `Actualizando INTERNO ${interno} en SQL Server para afiliado ${afiliadoId}`);

    const p = await getPool();
    const result = await p.request()
      .input('afiliadoId', sql.Int, afiliadoId)
      .input('interno', sql.Int, interno)
      .query(`
        UPDATE afi.Afiliado 
        SET interno = @interno, 
            updatedAt = SYSUTCDATETIME()
        WHERE id = @afiliadoId
      `);

    const rowsAffected = result.rowsAffected[0] || 0;

    if (rowsAffected === 0) {
      logger.warn({
        ...logContext,
        rowsAffected
      }, 'No se actualizó ningún registro - Afiliado no encontrado');
      throw new Error(`Afiliado con ID ${afiliadoId} no encontrado para actualizar INTERNO`);
    }

    logger.info({
      ...logContext,
      rowsAffected
    }, `INTERNO actualizado exitosamente en SQL Server`);

  } catch (error: any) {
    logger.error({
      ...logContext,
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code,
        number: error.number
      }
    }, 'Error al actualizar INTERNO en SQL Server');
    throw error;
  }
}

export async function createAfiliado(data: Omit<Afiliado, 'id' | 'createdAt' | 'updatedAt'>): Promise<Afiliado> {
  const p = await getPool();

  // Para createAfiliado sin información de orgánica, 
  // quincenaAplicacion y anioAplicacion deben proporcionarse manualmente o serán null
  const quincenaAplicacion = data.quincenaAplicacion ?? null;
  const anioAplicacion = data.anioAplicacion ?? null;

  const r = await p.request()
    .input('folio', sql.Int, data.folio)
    .input('apellidoPaterno', sql.NVarChar(255), data.apellidoPaterno)
    .input('apellidoMaterno', sql.NVarChar(255), data.apellidoMaterno)
    .input('nombre', sql.NVarChar(200), data.nombre)
    .input('curp', sql.VarChar(18), data.curp)
    .input('rfc', sql.VarChar(13), data.rfc)
    .input('numeroSeguroSocial', sql.VarChar(50), data.numeroSeguroSocial)
    .input('fechaNacimiento', sql.Date, data.fechaNacimiento ? new Date(data.fechaNacimiento) : null)
    .input('entidadFederativaNacId', sql.Int, data.entidadFederativaNacId)
    .input('domicilioCalle', sql.NVarChar(255), data.domicilioCalle)
    .input('domicilioNumeroExterior', sql.VarChar(50), data.domicilioNumeroExterior)
    .input('domicilioNumeroInterior', sql.VarChar(50), data.domicilioNumeroInterior)
    .input('domicilioEntreCalle1', sql.NVarChar(120), data.domicilioEntreCalle1)
    .input('domicilioEntreCalle2', sql.NVarChar(120), data.domicilioEntreCalle2)
    .input('domicilioColonia', sql.NVarChar(255), data.domicilioColonia)
    .input('domicilioCodigoPostal', sql.Int, data.domicilioCodigoPostal)
    .input('telefono', sql.VarChar(10), data.telefono)
    .input('estadoCivilId', sql.Int, data.estadoCivilId)
    .input('sexo', sql.Char(1), data.sexo)
    .input('correoElectronico', sql.NVarChar(255), data.correoElectronico)
    .input('estatus', sql.Bit, data.estatus)
    .input('interno', sql.Int, data.interno)
    .input('noEmpleado', sql.VarChar(20), data.noEmpleado)
    .input('localidad', sql.NVarChar(150), data.localidad)
    .input('municipio', sql.NVarChar(150), data.municipio)
    .input('estado', sql.NVarChar(150), data.estado)
    .input('pais', sql.NVarChar(100), data.pais)
    .input('dependientes', sql.SmallInt, data.dependientes)
    .input('poseeInmuebles', sql.Bit, data.poseeInmuebles)
    .input('fechaCarta', sql.Date, data.fechaCarta ? new Date(data.fechaCarta) : null)
    .input('nacionalidad', sql.NVarChar(80), data.nacionalidad)
    .input('fechaAlta', sql.Date, data.fechaAlta ? new Date(data.fechaAlta) : null)
    .input('celular', sql.VarChar(15), data.celular)
    .input('expediente', sql.VarChar(50), data.expediente)
    .input('quincenaAplicacion', sql.TinyInt, quincenaAplicacion)
    .input('anioAplicacion', sql.SmallInt, anioAplicacion)
    .input('codigoPostal', sql.Int, data.codigoPostal)
    .input('numValidacion', sql.Int, data.numValidacion || 1)
    .input('afiliadosComplete', sql.Int, data.afiliadosComplete || 0)
    .query(`
      INSERT INTO afi.Afiliado (
        folio, apellidoPaterno, apellidoMaterno, nombre, curp, rfc,
        numeroSeguroSocial, fechaNacimiento, entidadFederativaNacId,
        domicilioCalle, domicilioNumeroExterior, domicilioNumeroInterior,
        domicilioEntreCalle1, domicilioEntreCalle2,
        domicilioColonia, domicilioCodigoPostal, telefono, estadoCivilId,
        sexo, correoElectronico, estatus, interno, noEmpleado, localidad,
        municipio, estado, pais, dependientes, poseeInmuebles, fechaCarta,
        nacionalidad, fechaAlta, celular, expediente, quincenaAplicacion, anioAplicacion,
        codigoPostal, numValidacion, afiliadosComplete
      )
      OUTPUT INSERTED.*
      VALUES (
        @folio, @apellidoPaterno, @apellidoMaterno, @nombre, @curp, @rfc,
        @numeroSeguroSocial, @fechaNacimiento, @entidadFederativaNacId,
        @domicilioCalle, @domicilioNumeroExterior, @domicilioNumeroInterior,
        @domicilioEntreCalle1, @domicilioEntreCalle2,
        @domicilioColonia, @domicilioCodigoPostal, @telefono, @estadoCivilId,
        @sexo, @correoElectronico, @estatus, @interno, @noEmpleado, @localidad,
        @municipio, @estado, @pais, @dependientes, @poseeInmuebles, @fechaCarta,
        @nacionalidad, @fechaAlta, @celular, @expediente, @quincenaAplicacion, @anioAplicacion,
        @codigoPostal, @numValidacion, @afiliadosComplete
      )
    `);
  const row = r.recordset[0];
  return {
    id: row.id,
    folio: row.folio,
    apellidoPaterno: row.apellidoPaterno,
    apellidoMaterno: row.apellidoMaterno,
    nombre: row.nombre,
    curp: row.curp,
    rfc: row.rfc,
    numeroSeguroSocial: row.numeroSeguroSocial,
    fechaNacimiento: row.fechaNacimiento?.toISOString().split('T')[0] || null,
    entidadFederativaNacId: row.entidadFederativaNacId,
    domicilioCalle: row.domicilioCalle,
    domicilioNumeroExterior: row.domicilioNumeroExterior,
    domicilioNumeroInterior: row.domicilioNumeroInterior,
    domicilioEntreCalle1: row.domicilioEntreCalle1,
    domicilioEntreCalle2: row.domicilioEntreCalle2,
    domicilioColonia: row.domicilioColonia,
    domicilioCodigoPostal: row.domicilioCodigoPostal,
    telefono: row.telefono,
    estadoCivilId: row.estadoCivilId,
    sexo: row.sexo,
    correoElectronico: row.correoElectronico,
    estatus: row.estatus === 1 || row.estatus === true,
    interno: row.interno,
    noEmpleado: row.noEmpleado,
    localidad: row.localidad,
    municipio: row.municipio,
    estado: row.estado,
    pais: row.pais,
    dependientes: row.dependientes,
    poseeInmuebles: row.poseeInmuebles === 1 || row.poseeInmuebles === true ? true : row.poseeInmuebles === 0 || row.poseeInmuebles === false ? false : null,
    fechaCarta: row.fechaCarta?.toISOString().split('T')[0] || null,
    nacionalidad: row.nacionalidad,
    fechaAlta: row.fechaAlta?.toISOString().split('T')[0] || null,
    celular: row.celular,
    expediente: row.expediente,
    quincenaAplicacion: row.quincenaAplicacion,
    anioAplicacion: row.anioAplicacion,
    codigoPostal: row.codigoPostal,
    numValidacion: row.numValidacion || 1,
    afiliadosComplete: row.afiliadosComplete || 0,
    createdAt: row.createdAt?.toISOString() || new Date().toISOString(),
    updatedAt: row.updatedAt?.toISOString() || new Date().toISOString()
  };
}

export async function updateAfiliado(id: number, data: Partial<Omit<Afiliado, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Afiliado> {
  const p = await getPool();
  const updates: string[] = [];
  const request = p.request().input('id', sql.Int, id);

  if (data.folio !== undefined) {
    updates.push('folio = @folio');
    request.input('folio', sql.Int, data.folio);
  }
  if (data.apellidoPaterno !== undefined) {
    updates.push('apellidoPaterno = @apellidoPaterno');
    request.input('apellidoPaterno', sql.NVarChar(255), data.apellidoPaterno);
  }
  if (data.apellidoMaterno !== undefined) {
    updates.push('apellidoMaterno = @apellidoMaterno');
    request.input('apellidoMaterno', sql.NVarChar(255), data.apellidoMaterno);
  }
  if (data.nombre !== undefined) {
    updates.push('nombre = @nombre');
    request.input('nombre', sql.NVarChar(200), data.nombre);
  }
  if (data.curp !== undefined) {
    updates.push('curp = @curp');
    request.input('curp', sql.VarChar(18), data.curp);
  }
  if (data.rfc !== undefined) {
    updates.push('rfc = @rfc');
    request.input('rfc', sql.VarChar(13), data.rfc);
  }
  if (data.numeroSeguroSocial !== undefined) {
    updates.push('numeroSeguroSocial = @numeroSeguroSocial');
    request.input('numeroSeguroSocial', sql.VarChar(50), data.numeroSeguroSocial);
  }
  if (data.fechaNacimiento !== undefined) {
    updates.push('fechaNacimiento = @fechaNacimiento');
    request.input('fechaNacimiento', sql.Date, data.fechaNacimiento ? new Date(data.fechaNacimiento) : null);
  }
  if (data.entidadFederativaNacId !== undefined) {
    updates.push('entidadFederativaNacId = @entidadFederativaNacId');
    request.input('entidadFederativaNacId', sql.Int, data.entidadFederativaNacId);
  }
  if (data.domicilioCalle !== undefined) {
    updates.push('domicilioCalle = @domicilioCalle');
    request.input('domicilioCalle', sql.NVarChar(255), data.domicilioCalle);
  }
  if (data.domicilioNumeroExterior !== undefined) {
    updates.push('domicilioNumeroExterior = @domicilioNumeroExterior');
    request.input('domicilioNumeroExterior', sql.VarChar(50), data.domicilioNumeroExterior);
  }
  if (data.domicilioNumeroInterior !== undefined) {
    updates.push('domicilioNumeroInterior = @domicilioNumeroInterior');
    request.input('domicilioNumeroInterior', sql.VarChar(50), data.domicilioNumeroInterior);
  }
  if (data.domicilioEntreCalle1 !== undefined) {
    updates.push('domicilioEntreCalle1 = @domicilioEntreCalle1');
    request.input('domicilioEntreCalle1', sql.NVarChar(120), data.domicilioEntreCalle1);
  }
  if (data.domicilioEntreCalle2 !== undefined) {
    updates.push('domicilioEntreCalle2 = @domicilioEntreCalle2');
    request.input('domicilioEntreCalle2', sql.NVarChar(120), data.domicilioEntreCalle2);
  }
  if (data.domicilioColonia !== undefined) {
    updates.push('domicilioColonia = @domicilioColonia');
    request.input('domicilioColonia', sql.NVarChar(255), data.domicilioColonia);
  }
  if (data.domicilioCodigoPostal !== undefined) {
    updates.push('domicilioCodigoPostal = @domicilioCodigoPostal');
    request.input('domicilioCodigoPostal', sql.Int, data.domicilioCodigoPostal);
  }
  if (data.telefono !== undefined) {
    updates.push('telefono = @telefono');
    request.input('telefono', sql.VarChar(10), data.telefono);
  }
  if (data.estadoCivilId !== undefined) {
    updates.push('estadoCivilId = @estadoCivilId');
    request.input('estadoCivilId', sql.Int, data.estadoCivilId);
  }
  if (data.sexo !== undefined) {
    updates.push('sexo = @sexo');
    request.input('sexo', sql.Char(1), data.sexo);
  }
  if (data.correoElectronico !== undefined) {
    updates.push('correoElectronico = @correoElectronico');
    request.input('correoElectronico', sql.NVarChar(255), data.correoElectronico);
  }
  if (data.estatus !== undefined) {
    updates.push('estatus = @estatus');
    request.input('estatus', sql.Bit, data.estatus);
  }
  if (data.interno !== undefined) {
    updates.push('interno = @interno');
    request.input('interno', sql.Int, data.interno);
  }
  if (data.noEmpleado !== undefined) {
    updates.push('noEmpleado = @noEmpleado');
    request.input('noEmpleado', sql.VarChar(20), data.noEmpleado);
  }
  if (data.localidad !== undefined) {
    updates.push('localidad = @localidad');
    request.input('localidad', sql.NVarChar(150), data.localidad);
  }
  if (data.municipio !== undefined) {
    updates.push('municipio = @municipio');
    request.input('municipio', sql.NVarChar(150), data.municipio);
  }
  if (data.estado !== undefined) {
    updates.push('estado = @estado');
    request.input('estado', sql.NVarChar(150), data.estado);
  }
  if (data.pais !== undefined) {
    updates.push('pais = @pais');
    request.input('pais', sql.NVarChar(100), data.pais);
  }
  if (data.dependientes !== undefined) {
    updates.push('dependientes = @dependientes');
    request.input('dependientes', sql.SmallInt, data.dependientes);
  }
  if (data.poseeInmuebles !== undefined) {
    updates.push('poseeInmuebles = @poseeInmuebles');
    request.input('poseeInmuebles', sql.Bit, data.poseeInmuebles);
  }
  if (data.fechaCarta !== undefined) {
    updates.push('fechaCarta = @fechaCarta');
    request.input('fechaCarta', sql.Date, data.fechaCarta ? new Date(data.fechaCarta) : null);
  }
  if (data.nacionalidad !== undefined) {
    updates.push('nacionalidad = @nacionalidad');
    request.input('nacionalidad', sql.NVarChar(80), data.nacionalidad);
  }
  if (data.fechaAlta !== undefined) {
    updates.push('fechaAlta = @fechaAlta');
    request.input('fechaAlta', sql.Date, data.fechaAlta ? new Date(data.fechaAlta) : null);
  }
  if (data.celular !== undefined) {
    updates.push('celular = @celular');
    request.input('celular', sql.VarChar(15), data.celular);
  }
  if (data.expediente !== undefined) {
    updates.push('expediente = @expediente');
    request.input('expediente', sql.VarChar(50), data.expediente);
  }
  if (data.quincenaAplicacion !== undefined) {
    updates.push('quincenaAplicacion = @quincenaAplicacion');
    request.input('quincenaAplicacion', sql.TinyInt, data.quincenaAplicacion);
  }
  if (data.anioAplicacion !== undefined) {
    updates.push('anioAplicacion = @anioAplicacion');
    request.input('anioAplicacion', sql.SmallInt, data.anioAplicacion);
  }
  if (data.codigoPostal !== undefined) {
    updates.push('codigoPostal = @codigoPostal');
    request.input('codigoPostal', sql.Int, data.codigoPostal);
  }
  if (data.numValidacion !== undefined) {
    updates.push('numValidacion = @numValidacion');
    request.input('numValidacion', sql.Int, data.numValidacion);
  }
  if (data.afiliadosComplete !== undefined) {
    updates.push('afiliadosComplete = @afiliadosComplete');
    request.input('afiliadosComplete', sql.Int, data.afiliadosComplete);
  }

  updates.push('updatedAt = SYSUTCDATETIME()');

  const updateQuery = `
    UPDATE afi.Afiliado
    SET ${updates.join(', ')}
    OUTPUT INSERTED.*
    WHERE id = @id
  `;

  const r = await request.query(updateQuery);
  const row = r.recordset[0];
  if (!row) throw new Error('AFILIADO_NOT_FOUND');
  return {
    id: row.id,
    folio: row.folio,
    apellidoPaterno: row.apellidoPaterno,
    apellidoMaterno: row.apellidoMaterno,
    nombre: row.nombre,
    curp: row.curp,
    rfc: row.rfc,
    numeroSeguroSocial: row.numeroSeguroSocial,
    fechaNacimiento: row.fechaNacimiento?.toISOString().split('T')[0] || null,
    entidadFederativaNacId: row.entidadFederativaNacId,
    domicilioCalle: row.domicilioCalle,
    domicilioNumeroExterior: row.domicilioNumeroExterior,
    domicilioNumeroInterior: row.domicilioNumeroInterior,
    domicilioEntreCalle1: row.domicilioEntreCalle1,
    domicilioEntreCalle2: row.domicilioEntreCalle2,
    domicilioColonia: row.domicilioColonia,
    domicilioCodigoPostal: row.domicilioCodigoPostal,
    telefono: row.telefono,
    estadoCivilId: row.estadoCivilId,
    sexo: row.sexo,
    correoElectronico: row.correoElectronico,
    estatus: row.estatus === 1 || row.estatus === true,
    interno: row.interno,
    noEmpleado: row.noEmpleado,
    localidad: row.localidad,
    municipio: row.municipio,
    estado: row.estado,
    pais: row.pais,
    dependientes: row.dependientes,
    poseeInmuebles: row.poseeInmuebles === 1 || row.poseeInmuebles === true ? true : row.poseeInmuebles === 0 || row.poseeInmuebles === false ? false : null,
    fechaCarta: row.fechaCarta?.toISOString().split('T')[0] || null,
    nacionalidad: row.nacionalidad,
    fechaAlta: row.fechaAlta?.toISOString().split('T')[0] || null,
    celular: row.celular,
    expediente: row.expediente,
    quincenaAplicacion: row.quincenaAplicacion,
    anioAplicacion: row.anioAplicacion,
    codigoPostal: row.codigoPostal,
    numValidacion: row.numValidacion || 1,
    afiliadosComplete: row.afiliadosComplete || 0,
    createdAt: row.createdAt?.toISOString() || new Date().toISOString(),
    updatedAt: row.updatedAt?.toISOString() || new Date().toISOString()
  };
}

export async function deleteAfiliado(id: number): Promise<void> {
  const p = await getPool();
  const r = await p.request()
    .input('id', sql.Int, id)
    .query(`
      DELETE FROM afi.Afiliado
      WHERE id = @id
      SELECT @@ROWCOUNT as deletedCount
    `);
  if (r.recordset[0].deletedCount === 0) {
    throw new Error('AFILIADO_NOT_FOUND');
  }
}

// =============================================
// FUNCIONES PARA GESTIÓN DE ESTADOS DE VALIDACIÓN
// =============================================

// Obtener todos los estados de validación disponibles
export async function getAllStatusControl(): Promise<AfiliadoStatusControl[]> {
  const p = await getPool();
  const r = await p.request()
    .query(`
      SELECT
        id, numValidacion, nombreStatus, descripcion, color,
        activo, orden, fechaCreacion, fechaModificacion,
        usuarioCreacion, usuarioModificacion
      FROM afi.AfiliadoStatusControl
      WHERE activo = 1
      ORDER BY orden
    `);
  
  return r.recordset.map((row: any) => ({
    id: row.id,
    numValidacion: row.numValidacion,
    nombreStatus: row.nombreStatus,
    descripcion: row.descripcion,
    color: row.color,
    activo: row.activo === 1 || row.activo === true,
    orden: row.orden,
    fechaCreacion: row.fechaCreacion?.toISOString() || new Date().toISOString(),
    fechaModificacion: row.fechaModificacion?.toISOString() || new Date().toISOString(),
    usuarioCreacion: row.usuarioCreacion,
    usuarioModificacion: row.usuarioModificacion
  }));
}

// Función genérica para obtener afiliados por estado específico y orgánica
export async function getAfiliadosByStatus(org0: string, org1: string, numValidacion: number): Promise<AfiliadoWithStatus[]> {
  const p = await getPool();
  const r = await p.request()
    .input('org0', sql.VarChar(30), org0)
    .input('org1', sql.VarChar(30), org1)
    .input('numValidacion', sql.Int, numValidacion)
    .query(`
      SELECT DISTINCT
        a.id, a.folio, a.apellidoPaterno, a.apellidoMaterno, a.nombre, a.curp, a.rfc,
        a.numeroSeguroSocial, a.fechaNacimiento, a.entidadFederativaNacId,
        a.domicilioCalle, a.domicilioNumeroExterior, a.domicilioNumeroInterior,
        a.domicilioEntreCalle1, a.domicilioEntreCalle2,
        a.domicilioColonia, a.domicilioCodigoPostal, a.telefono, a.estadoCivilId,
        a.sexo, a.correoElectronico, a.estatus, a.interno, a.noEmpleado, a.localidad,
        a.municipio, a.estado, a.pais, a.dependientes, a.poseeInmuebles, a.fechaCarta,
        a.nacionalidad, a.fechaAlta, a.celular, a.expediente, a.quincenaAplicacion, a.anioAplicacion,
        a.codigoPostal, a.numValidacion, a.afiliadosComplete, a.createdAt, a.updatedAt,
        s.nombreStatus, s.descripcion as statusDescripcion, s.color as statusColor
      FROM afi.Afiliado a
      INNER JOIN afi.AfiliadoOrg ao ON a.id = ao.afiliadoId
      INNER JOIN afi.AfiliadoStatusControl s ON a.numValidacion = s.numValidacion
      WHERE ao.claveOrganica0 = @org0
        AND ao.claveOrganica1 = @org1
        AND a.numValidacion = @numValidacion
        AND s.activo = 1
        AND a.estatus = 1
      ORDER BY a.createdAt DESC
    `);
  
  return r.recordset.map((row: any) => ({
    ...row,
    fechaNacimiento: row.fechaNacimiento?.toISOString().split('T')[0] || null,
    fechaCarta: row.fechaCarta?.toISOString().split('T')[0] || null,
    fechaAlta: row.fechaAlta?.toISOString().split('T')[0] || null,
    createdAt: row.createdAt?.toISOString() || new Date().toISOString(),
    updatedAt: row.updatedAt?.toISOString() || new Date().toISOString(),
    estatus: row.estatus === 1 || row.estatus === true,
    poseeInmuebles: row.poseeInmuebles === 1 || row.poseeInmuebles === true ? true : row.poseeInmuebles === 0 || row.poseeInmuebles === false ? false : null,
    numValidacion: row.numValidacion || 1,
    afiliadosComplete: row.afiliadosComplete || 0
  }));
}

// Función genérica para cambiar status a estado específico
export async function cambiarAStatusAfiliado(
  afiliadoId: number,
  numValidacionNuevo: number,
  usuarioId: string,
  motivo?: string,
  observaciones?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<any> {
  const p = await getPool();
  const r = await p.request()
    .input('afiliadoId', sql.Int, afiliadoId)
    .input('numValidacionNuevo', sql.Int, numValidacionNuevo)
    .input('usuarioId', sql.NVarChar(50), usuarioId)
    .input('motivo', sql.NVarChar(500), motivo)
    .input('observaciones', sql.NVarChar(1000), observaciones)
    .input('ipAddress', sql.NVarChar(45), ipAddress)
    .input('userAgent', sql.NVarChar(500), userAgent)
    .execute('dbo.spCambiarStatusAfiliado');

  return r.recordset[0];
}

// Función genérica para cambio de status en lote
export async function cambiarStatusAfiliadosLote(
  afiliadoIds: number[],
  numValidacionNuevo: number,
  usuarioId: string,
  motivo?: string,
  observaciones?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<any[]> {
  const p = await getPool();
  const results: any[] = [];

  for (const afiliadoId of afiliadoIds) {
    try {
      const result = await cambiarAStatusAfiliado(
        afiliadoId,
        numValidacionNuevo,
        usuarioId,
        motivo || 'Cambio de estado en lote',
        observaciones,
        ipAddress,
        userAgent
      );
      results.push({
        afiliadoId,
        numValidacionAnterior: result.numValidacionAnterior,
        numValidacionNuevo: result.numValidacionNuevo,
        statusAnterior: result.statusAnterior,
        statusNuevo: result.statusNuevo,
        mensaje: result.mensaje,
        exitoso: true,
        error: null
      });
    } catch (error: any) {
      results.push({
        afiliadoId,
        numValidacionAnterior: null,
        numValidacionNuevo: numValidacionNuevo,
        statusAnterior: null,
        statusNuevo: 'Estado Desconocido',
        mensaje: 'Error al cambiar status de afiliado',
        exitoso: false,
        error: error.message
      });
    }
  }

  return results;
}

// Obtener afiliados pendientes por orgánica del usuario (numValidacion = 1)
export async function getAfiliadosPendientes(org0: string, org1: string): Promise<AfiliadoWithStatus[]> {
  const p = await getPool();
  const r = await p.request()
    .input('org0', sql.VarChar(30), org0)
    .input('org1', sql.VarChar(30), org1)
    .query(`
      SELECT DISTINCT
        a.id, a.folio, a.apellidoPaterno, a.apellidoMaterno, a.nombre, a.curp, a.rfc,
        a.correoElectronico, a.telefono, a.numValidacion, a.afiliadosComplete,
        s.nombreStatus, s.descripcion as statusDescripcion, s.color as statusColor,
        a.createdAt, a.updatedAt
      FROM afi.Afiliado a
      INNER JOIN afi.AfiliadoOrg ao ON a.id = ao.afiliadoId
      INNER JOIN afi.AfiliadoStatusControl s ON a.numValidacion = s.numValidacion
      WHERE ao.claveOrganica0 = @org0 
        AND ao.claveOrganica1 = @org1
        AND a.numValidacion = 1
        AND s.activo = 1
        AND a.estatus = 1
      ORDER BY a.createdAt DESC
    `);
  
  return r.recordset.map((row: any) => ({
    id: row.id,
    folio: row.folio,
    apellidoPaterno: row.apellidoPaterno,
    apellidoMaterno: row.apellidoMaterno,
    nombre: row.nombre,
    curp: row.curp,
    rfc: row.rfc,
    correoElectronico: row.correoElectronico,
    telefono: row.telefono,
    numValidacion: row.numValidacion || 1,
    afiliadosComplete: row.afiliadosComplete || 0,
    nombreStatus: row.nombreStatus,
    statusDescripcion: row.statusDescripcion,
    statusColor: row.statusColor,
    createdAt: row.createdAt?.toISOString() || new Date().toISOString(),
    updatedAt: row.updatedAt?.toISOString() || new Date().toISOString(),
    // Campos requeridos por AfiliadoWithStatus
    numeroSeguroSocial: null,
    fechaNacimiento: null,
    entidadFederativaNacId: null,
    domicilioCalle: null,
    domicilioNumeroExterior: null,
    domicilioNumeroInterior: null,
    domicilioEntreCalle1: null,
    domicilioEntreCalle2: null,
    domicilioColonia: null,
    domicilioCodigoPostal: null,
    estadoCivilId: null,
    sexo: null,
    estatus: true,
    interno: null,
    noEmpleado: null,
    localidad: null,
    municipio: null,
    estado: null,
    pais: null,
    dependientes: null,
    poseeInmuebles: null,
    fechaCarta: null,
    nacionalidad: null,
    fechaAlta: null,
    celular: null,
    expediente: null,
    quincenaAplicacion: null,
    anioAplicacion: null,
    codigoPostal: null
  }));
}

// Aprobar un afiliado específico (cambiar numValidacion a 2)
export async function aprobarAfiliado(params: {
  afiliadoId: number;
  motivo?: string;
  observaciones?: string;
  usuarioId: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<any> {
  const p = await getPool();
  const r = await p.request()
    .input('afiliadoId', sql.Int, params.afiliadoId)
    .input('numValidacionNuevo', sql.Int, 2) // Aprobado
    .input('usuarioId', sql.NVarChar(50), params.usuarioId)
    .input('motivo', sql.NVarChar(500), params.motivo || 'Aprobación de afiliado')
    .input('observaciones', sql.NVarChar(1000), params.observaciones)
    .input('ipAddress', sql.NVarChar(45), params.ipAddress)
    .input('userAgent', sql.NVarChar(500), params.userAgent)
    .execute('dbo.spCambiarStatusAfiliado');

  return r.recordset[0];
}

// Aprobar múltiples afiliados en lote
export async function aprobarAfiliadosLote(
  afiliadoIds: number[],
  usuarioId: string,
  motivo?: string,
  observaciones?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<any[]> {
  const p = await getPool();
  const results: any[] = [];

  for (const afiliadoId of afiliadoIds) {
    try {
      const result = await aprobarAfiliado({
        afiliadoId,
        motivo: motivo || 'Aprobación en lote',
        observaciones,
        usuarioId,
        ipAddress,
        userAgent
      });
      results.push({
        afiliadoId,
        numValidacionAnterior: result.numValidacionAnterior,
        numValidacionNuevo: result.numValidacionNuevo,
        statusAnterior: result.statusAnterior,
        statusNuevo: result.statusNuevo,
        mensaje: result.mensaje,
        exitoso: true,
        error: null
      });
    } catch (error: any) {
      results.push({
        afiliadoId,
        numValidacionAnterior: null,
        numValidacionNuevo: 2,
        statusAnterior: null,
        statusNuevo: 'Aprobado',
        mensaje: 'Error al aprobar afiliado',
        exitoso: false,
        error: error.message
      });
    }
  }

  return results;
}

// Cambiar status de afiliado a cualquier estado válido
export async function cambiarStatusAfiliado(
  afiliadoId: number,
  numValidacionNuevo: number,
  usuarioId: string,
  motivo?: string,
  observaciones?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<any> {
  const p = await getPool();
  const r = await p.request()
    .input('afiliadoId', sql.Int, afiliadoId)
    .input('numValidacionNuevo', sql.Int, numValidacionNuevo)
    .input('usuarioId', sql.NVarChar(50), usuarioId)
    .input('motivo', sql.NVarChar(500), motivo)
    .input('observaciones', sql.NVarChar(1000), observaciones)
    .input('ipAddress', sql.NVarChar(45), ipAddress)
    .input('userAgent', sql.NVarChar(500), userAgent)
    .execute('dbo.spCambiarStatusAfiliado');

  return r.recordset[0];
}

// Obtener historial de cambios de status de un afiliado
export async function getAfiliadoStatusHistory(afiliadoId: number): Promise<AfiliadoStatusHistory[]> {
  const p = await getPool();
  const r = await p.request()
    .input('afiliadoId', sql.Int, afiliadoId)
    .query(`
      SELECT
        id, afiliadoId, numValidacionAnterior, numValidacionNuevo,
        statusAnterior, statusNuevo, motivo, observaciones,
        usuarioId, fechaCambio, ipAddress, userAgent
      FROM afi.AfiliadoStatusHistory
      WHERE afiliadoId = @afiliadoId
      ORDER BY fechaCambio DESC
    `);

  return r.recordset.map((row: any) => ({
    id: row.id,
    afiliadoId: row.afiliadoId,
    numValidacionAnterior: row.numValidacionAnterior,
    numValidacionNuevo: row.numValidacionNuevo,
    statusAnterior: row.statusAnterior,
    statusNuevo: row.statusNuevo,
    motivo: row.motivo,
    observaciones: row.observaciones,
    usuarioId: row.usuarioId,
    fechaCambio: row.fechaCambio?.toISOString() || new Date().toISOString(),
    ipAddress: row.ipAddress,
    userAgent: row.userAgent
  }));
}

// =============================================
// FUNCIONES ESPECÍFICAS PARA ESTADO 7 (APLICAR A BDISSPEA)
// =============================================

// Marcar todos los afiliados como completos para la orgánica del usuario
export async function marcarAfiliadosCompletosParaOrganica(
  org0: string,
  org1: string,
  usuarioId: string
): Promise<{ afectados: number }> {
  const p = await getPool();
  const r = await p.request()
    .input('org0', sql.VarChar(30), org0)
    .input('org1', sql.VarChar(30), org1)
    .input('usuarioId', sql.NVarChar(50), usuarioId)
    .query(`
      UPDATE a
      SET a.afiliadosComplete = 1,
          a.updatedAt = SYSUTCDATETIME()
      OUTPUT INSERTED.id
      FROM afi.Afiliado a
      INNER JOIN afi.AfiliadoOrg ao ON a.id = ao.afiliadoId
      WHERE ao.claveOrganica0 = @org0
        AND ao.claveOrganica1 = @org1
        AND a.afiliadosComplete = 0
        AND a.estatus = 1
    `);
  
  const afectados = r.rowsAffected[0] || 0;
  console.log(`Marcados como completos ${afectados} afiliados para orgánica ${org0}/${org1}`);
  
  return { afectados };
}

// Actualizar BitacoraAfectacionOrg de "APLICAR" a "APLICAR" para la orgánica del usuario
export async function actualizarBitacoraAfectacionOrg(
  org0: string,
  org1: string,
  usuarioId: string
): Promise<{ actualizado: boolean; registrosAfectados: number }> {
  const p = await getPool();
  
  // Primero buscar el registro más reciente con accion = "Aplicar"
  const r = await p.request()
    .input('org0', sql.VarChar(30), org0)
    .input('org1', sql.VarChar(30), org1)
    .query(`
      SELECT TOP 1 Id, Entidad, Anio, Quincena, Accion, Org0, Org1
      FROM afec.BitacoraAfectacionOrg
      WHERE Org0 = @org0
        AND Org1 = @org1
        AND Accion = 'Aplicar'
        AND Entidad = 'AFILIADOS'
      ORDER BY Anio DESC, Quincena DESC, CreatedAt DESC
    `);

  if (r.recordset.length === 0) {
    console.log(`No se encontró registro "Aplicar" en BitacoraAfectacionOrg para orgánica ${org0}/${org1}`);
    return { actualizado: false, registrosAfectados: 0 };
  }

  const registro = r.recordset[0];
  
  // Actualizar el registro de "Aplicar" a "APLICAR"
  const updateResult = await p.request()
    .input('id', sql.BigInt, registro.Id)
    .input('usuarioId', sql.NVarChar(50), usuarioId)
    .query(`
      UPDATE afec.BitacoraAfectacionOrg
      SET Accion = 'APLICAR',
          ModifiedAt = SYSUTCDATETIME(),
          Usuario = @usuarioId,
          Resultado = 'OK',
          Mensaje = 'Proceso de afiliación completado - Estado aplicado a Movimientos BDIsspea'
      OUTPUT INSERTED.*
      WHERE Id = @id
    `);

  const registrosAfectados = updateResult.rowsAffected[0] || 0;
  console.log(`Actualizado BitacoraAfectacionOrg: ${registrosAfectados} registros cambiados de "APLICAR" a "APLICAR"`);
  
  return {
    actualizado: registrosAfectados > 0,
    registrosAfectados
  };
}

// Actualizar BitacoraAfectacionOrg de "APLICAR" a "TERMINADO" para la orgánica del usuario
export async function actualizarBitacoraAfectacionOrgTerminado(
  org0: string,
  org1: string,
  usuarioId: string,
  mensaje?: string
): Promise<{ actualizado: boolean; registrosAfectados: number }> {
  const logContext = {
    operation: 'actualizarBitacoraAfectacionOrgTerminado',
    org0,
    org1,
    usuarioId
  };

  logger.info(logContext, 'Buscando registro más reciente con Accion=APLICAR para actualizar a TERMINADO');
  console.log(`[BITACORA] Buscando registro más reciente con Accion='APLICAR' para orgánica ${org0}/${org1}`);

  const p = await getPool();
  
  // Buscar el registro más reciente con accion = "APLICAR"
  const r = await p.request()
    .input('org0', sql.VarChar(30), org0)
    .input('org1', sql.VarChar(30), org1)
    .query(`
      SELECT TOP 1 Id, Entidad, Anio, Quincena, Accion, Org0, Org1, CreatedAt
      FROM afec.BitacoraAfectacionOrg
      WHERE Org0 = @org0
        AND Org1 = @org1
        AND Accion = 'APLICAR'
        AND Entidad = 'AFILIADOS'
      ORDER BY Anio DESC, Quincena DESC, CreatedAt DESC
    `);

  if (r.recordset.length === 0) {
    logger.warn(logContext, 'No se encontró registro "APLICAR" en BitacoraAfectacionOrg');
    console.log(`[BITACORA] ⚠️  No se encontró registro "APLICAR" en BitacoraAfectacionOrg para orgánica ${org0}/${org1}`);
    return { actualizado: false, registrosAfectados: 0 };
  }

  const registro = r.recordset[0];
  logger.info({
    ...logContext,
    registroId: registro.Id,
    anio: registro.Anio,
    quincena: registro.Quincena,
    createdAt: registro.CreatedAt
  }, 'Registro encontrado, procediendo a actualizar a TERMINADO');
  console.log(`[BITACORA] ✅ Registro encontrado - ID: ${registro.Id}, Anio: ${registro.Anio}, Quincena: ${registro.Quincena}`);
  
  // Actualizar el registro de "APLICAR" a "TERMINADO"
  const updateResult = await p.request()
    .input('id', sql.BigInt, registro.Id)
    .input('usuarioId', sql.NVarChar(50), usuarioId)
    .input('mensaje', sql.NVarChar(4000), mensaje || 'Proceso de aplicación QNA completado - Stored procedures ejecutados exitosamente')
    .query(`
      UPDATE afec.BitacoraAfectacionOrg
      SET Accion = 'TERMINADO',
          ModifiedAt = SYSUTCDATETIME(),
          Usuario = @usuarioId,
          Resultado = 'OK',
          Mensaje = @mensaje
      OUTPUT INSERTED.*
      WHERE Id = @id
    `);

  const registrosAfectados = updateResult.rowsAffected[0] || 0;
  logger.info({
    ...logContext,
    registrosAfectados,
    registroId: registro.Id
  }, 'BitacoraAfectacionOrg actualizada exitosamente a TERMINADO');
  console.log(`[BITACORA] ✅ Actualizado BitacoraAfectacionOrg: ${registrosAfectados} registro(s) cambiados de "APLICAR" a "TERMINADO"`);
  
  return {
    actualizado: registrosAfectados > 0,
    registrosAfectados
  };
}

// Obtener el último registro de BitacoraAfectacionOrg por orgánica (sin filtrar por Accion)
export async function getUltimaBitacoraAfectacionOrgPorOrganica(
  org0: string,
  org1: string
): Promise<any | null> {
  const logContext = {
    operation: 'getUltimaBitacoraAfectacionOrgPorOrganica',
    org0,
    org1
  };

  const startTime = Date.now();
  logger.info(logContext, 'Buscando último registro de BitacoraAfectacionOrg');
  console.log(`[BITACORA] Buscando último registro de BitacoraAfectacionOrg para orgánica ${org0}/${org1}`);

  const p = await getPool();
  
  try {
    const queryStart = Date.now();
    const r = await p.request()
      .input('org0', sql.VarChar(30), org0)
      .input('org1', sql.VarChar(30), org1)
      .query(`
        SELECT TOP 1
          AfectacionId as Id,
          OrgNivel,
          Org0,
          Org1,
          Org2,
          Org3,
          Entidad,
          EntidadId,
          Anio,
          Quincena,
          Accion,
          Resultado,
          Mensaje,
          Usuario,
          UserId,
          AppName,
          Ip,
          UserAgent,
          RequestId,
          CreatedAt,
          ModifiedAt
        FROM afec.BitacoraAfectacionOrg
        WHERE Org0 = @org0
          AND Org1 = @org1
          AND Entidad = 'AFILIADOS'
        ORDER BY Anio DESC, Quincena DESC, CreatedAt DESC
      `);

    const queryTime = Date.now() - queryStart;

    if (r.recordset.length === 0) {
      logger.warn({
        ...logContext,
        queryTimeMs: queryTime,
        elapsedMs: Date.now() - startTime
      }, 'No se encontró registro en BitacoraAfectacionOrg');
      console.log(`[BITACORA] ⚠️  No se encontró registro en BitacoraAfectacionOrg para orgánica ${org0}/${org1} (${queryTime}ms)`);
      return null;
    }

    const registro = r.recordset[0];
    logger.info({
      ...logContext,
      registroId: registro.Id,
      accion: registro.Accion,
      anio: registro.Anio,
      quincena: registro.Quincena,
      resultado: registro.Resultado,
      queryTimeMs: queryTime,
      elapsedMs: Date.now() - startTime
    }, 'Registro encontrado en BitacoraAfectacionOrg');
    console.log(`[BITACORA] ✅ Registro encontrado - ID: ${registro.Id}, Accion: ${registro.Accion}, Anio: ${registro.Anio}, Quincena: ${registro.Quincena} (${queryTime}ms)`);

    // Mapear el registro a un formato consistente
    return {
      id: registro.Id,
      orgNivel: registro.OrgNivel,
      org0: registro.Org0,
      org1: registro.Org1,
      org2: registro.Org2,
      org3: registro.Org3,
      entidad: registro.Entidad,
      entidadId: registro.EntidadId,
      anio: registro.Anio,
      quincena: registro.Quincena,
      accion: registro.Accion,
      resultado: registro.Resultado,
      mensaje: registro.Mensaje,
      usuario: registro.Usuario,
      userId: registro.UserId,
      appName: registro.AppName,
      ip: registro.Ip,
      userAgent: registro.UserAgent,
      requestId: registro.RequestId,
      createdAt: registro.CreatedAt?.toISOString() || null,
      modifiedAt: registro.ModifiedAt?.toISOString() || null
    };
  } catch (error: any) {
    const queryTime = Date.now() - startTime;
    logger.error({
      ...logContext,
      error: {
        message: error.message || String(error),
        stack: error.stack,
        name: error.name,
        code: error.code
      },
      queryTimeMs: queryTime,
      elapsedMs: Date.now() - startTime
    }, 'Error consultando BitacoraAfectacionOrg');
    console.error(`[BITACORA] ❌ Error consultando BitacoraAfectacionOrg: ${error.message || String(error)} (${queryTime}ms)`);
    throw error;
  }
}

// Ejecutar stored procedure AP_P_APLICAR en Firebird
export async function ejecutarAP_P_APLICAR(
  org0: string,
  org1: string,
  quincenaC: string,
  quincenaA: string,
  tipo: string
): Promise<void> {
  const logContext = {
    operation: 'ejecutarAP_P_APLICAR',
    org0,
    org1,
    quincenaC,
    quincenaA,
    tipo
  };

  const startTime = Date.now();
  logger.info(logContext, 'Iniciando ejecución de AP_P_APLICAR');
  console.log(`[AP_P_APLICAR] Iniciando ejecución con parámetros: org0=${org0}, org1=${org1}, quincenaC=${quincenaC}, quincenaA=${quincenaA}, tipo=${tipo}`);

  return executeSerializedQuery((db) => {
    return new Promise<void>((resolve, reject) => {
      try {
        // En Firebird, los stored procedures se ejecutan usando SELECT ... FROM PROCEDURE_NAME(...)
        // AP_P_APLICAR no retorna resultados, pero aún así se ejecuta con SELECT
        const sql = `SELECT * FROM AP_P_APLICAR(?, ?, ?, ?, ?)`;

        const params = [org0, org1, quincenaC, quincenaA, tipo];

        const timeoutId = setTimeout(() => {
          logger.error({
            ...logContext,
            timeoutMs: 30000
          }, 'Timeout ejecutando AP_P_APLICAR');
          reject(new Error('Tiempo de espera agotado en ejecución de AP_P_APLICAR (30s)'));
        }, 30000); // 30 segundos de timeout

        logger.debug({
          ...logContext,
          sql,
          params
        }, 'Ejecutando AP_P_APLICAR en Firebird');

        db.query(sql, params, (err: any, result: any) => {
          clearTimeout(timeoutId);
          const duration = Date.now() - startTime;

          if (err) {
            logger.error({
              ...logContext,
              error: {
                message: err.message || String(err),
                code: err.code,
                name: err.name,
                stack: err.stack
              },
              duracionMs: duration
            }, 'Error ejecutando AP_P_APLICAR');
            console.error(`[AP_P_APLICAR] ❌ Error ejecutando stored procedure: ${err.message || String(err)}`);
            reject(new Error(`Error al ejecutar AP_P_APLICAR: ${err.message || String(err)}`));
            return;
          }

          logger.info({
            ...logContext,
            duracionMs: duration,
            resultado: result ? (Array.isArray(result) ? result.length : 1) : 0
          }, 'AP_P_APLICAR ejecutado exitosamente');
          console.log(`[AP_P_APLICAR] ✅ Ejecutado exitosamente en ${duration}ms`);
          resolve();
        });
      } catch (error: any) {
        const duration = Date.now() - startTime;
        logger.error({
          ...logContext,
          error: {
            message: error.message,
            stack: error.stack,
            name: error.name
          },
          duracionMs: duration
        }, 'Error síncrono ejecutando AP_P_APLICAR');
        console.error(`[AP_P_APLICAR] ❌ Error síncrono: ${error.message}`);
        reject(error);
      }
    });
  });
}

// Ejecutar stored procedure AP_D_ENVIO_LAYOUT en Firebird
export async function ejecutarAP_D_ENVIO_LAYOUT(
  quincena: string,
  org0: string,
  org1: string,
  org2: string,
  org3: string
): Promise<void> {
  const logContext = {
    operation: 'ejecutarAP_D_ENVIO_LAYOUT',
    quincena,
    org0,
    org1,
    org2,
    org3
  };

  const startTime = Date.now();
  logger.info(logContext, 'Iniciando ejecución de AP_D_ENVIO_LAYOUT');
  console.log(`[AP_D_ENVIO_LAYOUT] Iniciando ejecución con parámetros: quincena=${quincena}, org0=${org0}, org1=${org1}, org2=${org2}, org3=${org3}`);

  return executeSerializedQuery((db) => {
    return new Promise<void>((resolve, reject) => {
      try {
        // En Firebird, los stored procedures se ejecutan usando SELECT ... FROM PROCEDURE_NAME(...)
        // AP_D_ENVIO_LAYOUT no retorna resultados, pero aún así se ejecuta con SELECT
        const sql = `SELECT * FROM AP_D_ENVIO_LAYOUT(?, ?, ?, ?, ?)`;

        const params = [quincena, org0, org1, org2, org3];

        const timeoutId = setTimeout(() => {
          logger.error({
            ...logContext,
            timeoutMs: 30000
          }, 'Timeout ejecutando AP_D_ENVIO_LAYOUT');
          reject(new Error('Tiempo de espera agotado en ejecución de AP_D_ENVIO_LAYOUT (30s)'));
        }, 30000); // 30 segundos de timeout

        logger.debug({
          ...logContext,
          sql,
          params
        }, 'Ejecutando AP_D_ENVIO_LAYOUT en Firebird');

        db.query(sql, params, (err: any, result: any) => {
          clearTimeout(timeoutId);
          const duration = Date.now() - startTime;

          if (err) {
            logger.error({
              ...logContext,
              error: {
                message: err.message || String(err),
                code: err.code,
                name: err.name,
                stack: err.stack
              },
              duracionMs: duration
            }, 'Error ejecutando AP_D_ENVIO_LAYOUT');
            console.error(`[AP_D_ENVIO_LAYOUT] ❌ Error ejecutando stored procedure: ${err.message || String(err)}`);
            reject(new Error(`Error al ejecutar AP_D_ENVIO_LAYOUT: ${err.message || String(err)}`));
            return;
          }

          logger.info({
            ...logContext,
            duracionMs: duration,
            resultado: result ? (Array.isArray(result) ? result.length : 1) : 0
          }, 'AP_D_ENVIO_LAYOUT ejecutado exitosamente');
          console.log(`[AP_D_ENVIO_LAYOUT] ✅ Ejecutado exitosamente en ${duration}ms`);
          resolve();
        });
      } catch (error: any) {
        const duration = Date.now() - startTime;
        logger.error({
          ...logContext,
          error: {
            message: error.message,
            stack: error.stack,
            name: error.name
          },
          duracionMs: duration
        }, 'Error síncrono ejecutando AP_D_ENVIO_LAYOUT');
        console.error(`[AP_D_ENVIO_LAYOUT] ❌ Error síncrono: ${error.message}`);
        reject(error);
      }
    });
  });
}

// Función principal para aplicar BDIsspea que ejecuta todas las operaciones
export async function aplicarBDIsspea(
  afiliadoId: number,
  org0: string,
  org1: string,
  usuarioId: string,
  motivo?: string,
  observaciones?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<any> {
  const p = await getPool();
  const transaction = p.transaction();

  try {
    await transaction.begin();

    // 1. Cambiar el status del afiliado específico a estado 7
    const statusResult = await transaction.request()
      .input('afiliadoId', sql.Int, afiliadoId)
      .input('numValidacionNuevo', sql.Int, 7)
      .input('usuarioId', sql.NVarChar(50), usuarioId)
      .input('motivo', sql.NVarChar(500), motivo || 'Aplicación a BDIsspea')
      .input('observaciones', sql.NVarChar(1000), observaciones)
      .input('ipAddress', sql.NVarChar(45), ipAddress)
      .input('userAgent', sql.NVarChar(500), userAgent)
      .execute('dbo.spCambiarStatusAfiliado');

    // 2. Marcar todos los afiliados como completos para la orgánica
    const completosResult = await transaction.request()
      .input('org0', sql.VarChar(30), org0)
      .input('org1', sql.VarChar(30), org1)
      .input('usuarioId', sql.NVarChar(50), usuarioId)
      .query(`
        UPDATE a
        SET a.afiliadosComplete = 1,
            a.updatedAt = SYSUTCDATETIME()
        FROM afi.Afiliado a
        INNER JOIN afi.AfiliadoOrg ao ON a.id = ao.afiliadoId
        WHERE ao.claveOrganica0 = @org0
          AND ao.claveOrganica1 = @org1
          AND a.afiliadosComplete = 0
          AND a.estatus = 1
      `);

    // 3. Actualizar BitacoraAfectacionOrg
    const bitacoraResult = await transaction.request()
      .input('org0', sql.VarChar(30), org0)
      .input('org1', sql.VarChar(30), org1)
      .input('usuarioId', sql.NVarChar(50), usuarioId)
      .query(`
        UPDATE TOP (1) bao
        SET bao.Accion = 'APLICAR',
            bao.ModifiedAt = SYSUTCDATETIME(),
            bao.Usuario = @usuarioId,
            bao.Resultado = 'OK',
            bao.Mensaje = 'Proceso de afiliación completado - Estado aplicado a Movimientos BDIsspea'
        FROM afec.BitacoraAfectacionOrg bao
        WHERE bao.Org0 = @org0
          AND bao.Org1 = @org1
          AND bao.Accion = 'Aplicar'
          AND bao.Entidad = 'AFILIADOS'
      `);

    await transaction.commit();

    const resultado = {
      afiliadoStatus: statusResult.recordset[0],
      afiliadosCompletos: completosResult.rowsAffected[0] || 0,
      bitacoraActualizada: bitacoraResult.rowsAffected[0] || 0,
      mensaje: 'Proceso de aplicación a BDIsspea completado exitosamente'
    };

    console.log(`Proceso BDIsspea completado:`, resultado);
    return resultado;

  } catch (error) {
    await transaction.rollback();
    console.error('Error en proceso aplicarBDIsspea:', error);
    throw error;
  }
}

// Función principal para aplicar BDIsspea en LOTE a todos los afiliados en estados 2 y 3
export async function aplicarBDIsspeaLote(
  org0: string,
  org1: string,
  usuarioId: string,
  motivo?: string,
  observaciones?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<any> {
  const startTime = Date.now();
  
  logger.info({
    operation: 'aplicarBDIsspeaLote',
    step: 'inicio',
    org0,
    org1,
    usuarioId,
    timestamp: new Date().toISOString()
  }, '🚀 [INICIO] Aplicando BDIsspea en lote');
  
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🚀 [INICIO] Aplicando BDIsspea en lote`);
  console.log(`   Orgánica: ${org0}/${org1}`);
  console.log(`   Usuario: ${usuarioId}`);
  console.log(`   Timestamp: ${new Date().toISOString()}`);
  console.log(`${'='.repeat(80)}\n`);
  
  let p;
  try {
    p = await getPool();
    logger.info({ 
      operation: 'aplicarBDIsspeaLote', 
      step: 'poolObtenido',
      elapsedMs: Date.now() - startTime 
    }, '✅ Pool de conexiones obtenido');
    console.log(`✅ [${Date.now() - startTime}ms] Pool de conexiones obtenido`);
  } catch (error: any) {
    logger.error({
      operation: 'aplicarBDIsspeaLote',
      step: 'errorPoolConexion',
      error: {
        message: error.message,
        stack: error.stack,
        code: error.code
      }
    }, '❌ Error obteniendo pool de conexiones');
    console.error(`❌ Error obteniendo pool de conexiones:`, error);
    throw error;
  }

  // Importar servicio de migración Firebird
  logger.info({ 
    operation: 'aplicarBDIsspeaLote', 
    step: 'importandoServicios',
    elapsedMs: Date.now() - startTime 
  }, '⏳ Importando servicios de migración');
  console.log(`⏳ [${Date.now() - startTime}ms] Importando servicios de migración...`);
  
  let migrarMovimientoAFirebird;
  let getMovimientosByAfiliadoId;
  try {
    const firebirdModule = await import('./infrastructure/firebird/FirebirdMovimientoService.js');
    const movimientoModule = await import('../movimiento/movimiento.repo.js');
    migrarMovimientoAFirebird = firebirdModule.migrarMovimientoAFirebird;
    getMovimientosByAfiliadoId = movimientoModule.getMovimientosByAfiliadoId;
    
    logger.info({ 
      operation: 'aplicarBDIsspeaLote', 
      step: 'serviciosImportados',
      elapsedMs: Date.now() - startTime 
    }, '✅ Servicios importados correctamente');
    console.log(`✅ [${Date.now() - startTime}ms] Servicios importados correctamente`);
  } catch (error: any) {
    logger.error({
      operation: 'aplicarBDIsspeaLote',
      step: 'errorImportarServicios',
      error: {
        message: error.message,
        stack: error.stack
      }
    }, '❌ Error importando servicios');
    console.error(`❌ Error importando servicios:`, error);
    throw error;
  }

  // Variables para tracking (inicializadas antes del try para uso en catch)
  let afiliadosParaProcesar: any[] = [];
  const resultadosProcesamiento: any[] = [];
  const movimientosMigrados: any[] = [];
  const detallesMigracion: any[] = [];

  // FASE 1: Obtener afiliados elegibles (SIN transacción para evitar bloqueos)
  console.log(`\n${'─'.repeat(80)}`);
  console.log(`📋 FASE 1: Obteniendo afiliados elegibles`);
  console.log(`${'─'.repeat(80)}`);
  
  try {
    const fase1Start = Date.now();
    logger.info({ 
      operation: 'aplicarBDIsspeaLote', 
      step: 'obteniendoAfiliados',
      elapsedMs: Date.now() - startTime 
    }, '⏳ Consultando base de datos...');
    console.log(`⏳ [${Date.now() - startTime}ms] Consultando base de datos para afiliados elegibles...`);
    
    const afiliadosQuery = await p.request()
      .input('org0', sql.VarChar(30), org0)
      .input('org1', sql.VarChar(30), org1)
      .query(`
        SELECT DISTINCT a.id, a.folio, a.nombre, a.apellidoPaterno, a.apellidoMaterno,
               a.numValidacion, s.nombreStatus as statusActual
        FROM afi.Afiliado a
        INNER JOIN afi.AfiliadoOrg ao ON a.id = ao.afiliadoId
        INNER JOIN afi.AfiliadoStatusControl s ON a.numValidacion = s.numValidacion
        WHERE ao.claveOrganica0 = @org0
          AND ao.claveOrganica1 = @org1
          AND a.numValidacion IN (2, 3)  -- Solo estados 2 (Aprobado) y 3 (En Revisión)
          AND a.estatus = 1
          AND s.activo = 1
        ORDER BY a.id
      `);

    afiliadosParaProcesar = afiliadosQuery.recordset;
    const fase1Time = Date.now() - fase1Start;
    
    logger.info({
      operation: 'aplicarBDIsspeaLote',
      step: 'afiliadosObtenidos',
      org0,
      org1,
      cantidadAfiliados: afiliadosParaProcesar.length,
      queryTimeMs: fase1Time,
      elapsedMs: Date.now() - startTime,
      timestamp: new Date().toISOString()
    }, `✅ Afiliados elegibles obtenidos: ${afiliadosParaProcesar.length}`);
    
    console.log(`✅ [${Date.now() - startTime}ms] Consulta completada en ${fase1Time}ms`);
    console.log(`   📊 Afiliados encontrados: ${afiliadosParaProcesar.length}`);
    
    if (afiliadosParaProcesar.length > 0) {
      console.log(`   👥 Primeros afiliados:`);
      afiliadosParaProcesar.slice(0, 5).forEach((a, i) => {
        console.log(`      ${i + 1}. ID: ${a.id}, Folio: ${a.folio || 'N/A'}, Nombre: ${a.nombre || ''} ${a.apellidoPaterno || ''}, Estado: ${a.statusActual}`);
      });
      if (afiliadosParaProcesar.length > 5) {
        console.log(`      ... y ${afiliadosParaProcesar.length - 5} más`);
      }
    }
    

  if (afiliadosParaProcesar.length === 0) {
    console.log(`\n⚠️  No hay afiliados para procesar. Finalizando...`);
    logger.warn({
      operation: 'aplicarBDIsspeaLote',
      step: 'sinAfiliadosParaProcesar',
      org0,
      org1,
      elapsedMs: Date.now() - startTime
    }, 'No hay afiliados para procesar');
    
    return {
      afiliadosProcesados: [],
      afiliadosCambiadosEstado: 0,
      afiliadosFallidos: 0,
      afiliadosCompletos: 0,
      bitacoraActualizada: 0,
      movimientosMigrados: [],
      afiliadosConMigracionExitosa: 0,
      afiliadosConMigracionFallida: 0,
      detallesMigracion: [],
      resumen: {
        totalEncontrados: 0,
        procesadosExitosamente: 0,
        procesadosConError: 0,
        movimientosMigradosExitosos: 0,
        movimientosMigradosFallidos: 0,
        organica: `${org0}/${org1}`
      }
    };
  }

  // FASE 2: Migrar movimientos a Firebird (SIN transacción para evitar bloqueos)
  console.log(`\n${'─'.repeat(80)}`);
  console.log(`🔄 FASE 2: Migración de movimientos a Firebird`);
  console.log(`   Total afiliados a procesar: ${afiliadosParaProcesar.length}`);
  console.log(`${'─'.repeat(80)}\n`);
  
  logger.info({
    operation: 'aplicarBDIsspeaLote',
    step: 'iniciandoFase2',
    cantidadAfiliados: afiliadosParaProcesar.length,
    org0,
    org1,
    elapsedMs: Date.now() - startTime,
    timestamp: new Date().toISOString()
  }, `🔄 FASE 2: Procesando ${afiliadosParaProcesar.length} afiliados`);

  let contadorAfiliados = 0;
  const fase2Start = Date.now();

  for (const afiliado of afiliadosParaProcesar) {
      contadorAfiliados++;
      const afiliadoStart = Date.now();
      try {
        const progresoStr = `[${contadorAfiliados}/${afiliadosParaProcesar.length}]`;
        const nombreCompleto = `${afiliado.nombre || ''} ${afiliado.apellidoPaterno || ''} ${afiliado.apellidoMaterno || ''}`.trim();
        
        console.log(`\n${'·'.repeat(60)}`);
        console.log(`👤 ${progresoStr} Procesando afiliado`);
        console.log(`   ID: ${afiliado.id}`);
        console.log(`   Folio: ${afiliado.folio || 'N/A'}`);
        console.log(`   Nombre: ${nombreCompleto}`);
        console.log(`   Estado actual: ${afiliado.statusActual}`);
        console.log(`   Tiempo transcurrido: ${Math.round((Date.now() - startTime) / 1000)}s`);
        
        logger.info({
          operation: 'aplicarBDIsspeaLote',
          step: 'procesandoAfiliado',
          progreso: `${contadorAfiliados}/${afiliadosParaProcesar.length}`,
          afiliadoId: afiliado.id,
          folio: afiliado.folio,
          nombreCompleto,
          elapsedMs: Date.now() - startTime,
          timestamp: new Date().toISOString()
        }, `👤 Procesando afiliado ${contadorAfiliados}/${afiliadosParaProcesar.length}`);

        // 2.1. Obtener todos los movimientos del afiliado con estatus = 'A'
        let movimientos;
        let movimientosActivos;
        try {
          console.log(`   ⏳ Obteniendo movimientos...`);
          const movStart = Date.now();
          
          logger.debug({
            operation: 'aplicarBDIsspeaLote',
            step: 'obteniendoMovimientos',
            afiliadoId: afiliado.id,
            elapsedMs: Date.now() - startTime
          }, 'Obteniendo movimientos del afiliado');
          
          movimientos = await getMovimientosByAfiliadoId(afiliado.id);
          movimientosActivos = movimientos.filter(m => m.estatus === 'A');
          
          const movTime = Date.now() - movStart;
          console.log(`   ✅ Movimientos obtenidos en ${movTime}ms`);
          console.log(`      Total: ${movimientos.length}, Activos: ${movimientosActivos.length}`);
          
          logger.debug({
            operation: 'aplicarBDIsspeaLote',
            step: 'movimientosObtenidos',
            afiliadoId: afiliado.id,
            totalMovimientos: movimientos.length,
            movimientosActivos: movimientosActivos.length,
            queryTimeMs: movTime,
            elapsedMs: Date.now() - startTime
          }, `Movimientos obtenidos: ${movimientosActivos.length} activos`);
        } catch (error: any) {
          const afiliadoCompleto = await getAfiliadoById(afiliado.id);
          logger.error({
            operation: 'aplicarBDIsspeaLote',
            step: 'obtenerMovimientos',
            afiliadoId: afiliado.id,
            folio: afiliado.folio,
            nombreCompleto: `${afiliado.nombre || ''} ${afiliado.apellidoPaterno || ''} ${afiliado.apellidoMaterno || ''}`.trim(),
            datosAfiliado: afiliadoCompleto ? {
              id: afiliadoCompleto.id,
              folio: afiliadoCompleto.folio,
              nombre: afiliadoCompleto.nombre,
              apellidoPaterno: afiliadoCompleto.apellidoPaterno,
              apellidoMaterno: afiliadoCompleto.apellidoMaterno,
              curp: afiliadoCompleto.curp,
              rfc: afiliadoCompleto.rfc,
              numeroSeguroSocial: afiliadoCompleto.numeroSeguroSocial,
              interno: afiliadoCompleto.interno,
              numValidacion: afiliadoCompleto.numValidacion
            } : null,
            error: {
              message: error.message,
              stack: error.stack,
              name: error.name,
              code: error.code
            },
            timestamp: new Date().toISOString()
          }, 'Error detallado al obtener movimientos del afiliado');
          console.error(`[APLICAR_BDISSPEA_LOTE] Error al obtener movimientos del afiliado ${afiliado.id}:`, error);
          throw error;
        }

        if (movimientosActivos.length === 0) {
          console.log(`   ⚠️  Sin movimientos activos - omitiendo afiliado`);
          logger.warn({
            operation: 'aplicarBDIsspeaLote',
            step: 'sinMovimientosActivos',
            afiliadoId: afiliado.id,
            elapsedMs: Date.now() - startTime
          }, 'Afiliado sin movimientos activos');
          
          resultadosProcesamiento.push({
            afiliadoId: afiliado.id,
            folio: afiliado.folio,
            nombreCompleto,
            estadoAnterior: afiliado.statusActual,
            estadoNuevo: null,
            exito: false,
            mensaje: 'No tiene movimientos activos para migrar',
            movimientos: []
          });
          continue;
        }

        // 2.2. Migrar cada movimiento a Firebird
        console.log(`\n   🔄 Migrando ${movimientosActivos.length} movimiento(s) a Firebird:`);
        let todosLosMovimientosExitosos = true;
        const resultadosMovimientos = [];
        let movimientoContador = 0;

        for (const movimiento of movimientosActivos) {
          movimientoContador++;
          const migStart = Date.now();
          
          console.log(`      ⏳ [${movimientoContador}/${movimientosActivos.length}] Movimiento ID ${movimiento.id} (Tipo: ${movimiento.tipoMovimientoId})`);
          
          logger.info({
            operation: 'aplicarBDIsspeaLote',
            step: 'migrandoMovimiento',
            afiliadoId: afiliado.id,
            movimientoId: movimiento.id,
            tipoMovimientoId: movimiento.tipoMovimientoId,
            progreso: `${movimientoContador}/${movimientosActivos.length}`,
            elapsedMs: Date.now() - startTime
          }, `Migrando movimiento ${movimientoContador}/${movimientosActivos.length}`);
          
          let resultadoMigracion;
          try {
            resultadoMigracion = await migrarMovimientoAFirebird(movimiento, org0, org1);
            const migTime = Date.now() - migStart;
            
            if (resultadoMigracion.exito) {
              console.log(`      ✅ [${migTime}ms] Migrado exitosamente (Código: ${resultadoMigracion.codigoMovimiento || 'N/A'})`);
            } else {
              console.log(`      ❌ [${migTime}ms] Falló: ${resultadoMigracion.nomError || 'Error desconocido'}`);
            }
          } catch (error: any) {
            const migTime = Date.now() - migStart;
            console.error(`      ❌ [${migTime}ms] EXCEPCIÓN durante migración`);
            console.error(`         Error: ${error.message}`);
            console.error(`         Código: ${error.code || 'N/A'}`);
            
            const afiliadoCompleto = await getAfiliadoById(afiliado.id).catch(() => null);
            
            logger.error({
              operation: 'aplicarBDIsspeaLote',
              step: 'migrarMovimientoAFirebird',
              afiliadoId: afiliado.id,
              movimientoId: movimiento.id,
              tipoMovimientoId: movimiento.tipoMovimientoId,
              folio: afiliado.folio,
              nombreCompleto,
              migrationTimeMs: migTime,
              datosMovimiento: {
                id: movimiento.id,
                tipoMovimientoId: movimiento.tipoMovimientoId,
                fecha: movimiento.fecha,
                estatus: movimiento.estatus,
                observaciones: movimiento.observaciones,
                folio: movimiento.folio
              },
              datosAfiliado: afiliadoCompleto ? {
                id: afiliadoCompleto.id,
                folio: afiliadoCompleto.folio,
                nombre: afiliadoCompleto.nombre,
                apellidoPaterno: afiliadoCompleto.apellidoPaterno,
                apellidoMaterno: afiliadoCompleto.apellidoMaterno,
                curp: afiliadoCompleto.curp,
                rfc: afiliadoCompleto.rfc,
                numeroSeguroSocial: afiliadoCompleto.numeroSeguroSocial,
                interno: afiliadoCompleto.interno,
                numValidacion: afiliadoCompleto.numValidacion
              } : null,
              org0,
              org1,
              error: {
                message: error.message,
                stack: error.stack,
                name: error.name,
                code: error.code
              },
              elapsedMs: Date.now() - startTime,
              timestamp: new Date().toISOString()
            }, '❌ EXCEPCIÓN durante migración de movimiento');
            
            resultadoMigracion = {
              exito: false,
              cveError: -1,
              nomError: `Error inesperado: ${error.message}`,
              movimientoId: movimiento.id,
              tipoMovimientoId: movimiento.tipoMovimientoId,
              codigoMovimiento: null
            };
          }
          
          resultadosMovimientos.push(resultadoMigracion);
          detallesMigracion.push({
            afiliadoId: afiliado.id,
            movimientoId: movimiento.id,
            tipoMovimientoId: movimiento.tipoMovimientoId,
            codigoMovimiento: resultadoMigracion.codigoMovimiento,
            exito: resultadoMigracion.exito,
            cveError: resultadoMigracion.cveError,
            nomError: resultadoMigracion.nomError
          });

          if (!resultadoMigracion.exito) {
            todosLosMovimientosExitosos = false;
            const afiliadoCompleto = await getAfiliadoById(afiliado.id).catch(() => null);
            logger.error({
              operation: 'aplicarBDIsspeaLote',
              step: 'migracionMovimientoFallida',
              afiliadoId: afiliado.id,
              movimientoId: movimiento.id,
              tipoMovimientoId: movimiento.tipoMovimientoId,
              codigoMovimiento: resultadoMigracion.codigoMovimiento,
              cveError: resultadoMigracion.cveError,
              nomError: resultadoMigracion.nomError,
              datosMovimiento: {
                id: movimiento.id,
                tipoMovimientoId: movimiento.tipoMovimientoId,
                fecha: movimiento.fecha,
                estatus: movimiento.estatus
              },
              datosAfiliado: afiliadoCompleto ? {
                id: afiliadoCompleto.id,
                folio: afiliadoCompleto.folio,
                nombre: afiliadoCompleto.nombre,
                curp: afiliadoCompleto.curp,
                rfc: afiliadoCompleto.rfc,
                interno: afiliadoCompleto.interno
              } : null,
              org0,
              org1,
              timestamp: new Date().toISOString()
            }, 'Error detallado: Movimiento falló en migración a Firebird');
            console.error(`[APLICAR_BDISSPEA_LOTE] Movimiento ${movimiento.id} falló: ${resultadoMigracion.nomError}`);
          } else {
            console.log(`[APLICAR_BDISSPEA_LOTE] Movimiento ${movimiento.id} migrado exitosamente`);
          }
        }

        // 2.3. Solo cambiar estado si TODOS los movimientos fueron exitosos
        const afiliadoTime = Date.now() - afiliadoStart;
        
        if (!todosLosMovimientosExitosos) {
          const movimientosFallidos = resultadosMovimientos.filter(r => !r.exito).length;
          console.log(`\n   ❌ Resultado: FALLIDO (${movimientosFallidos} movimiento(s) fallaron)`);
          console.log(`      Tiempo procesamiento: ${afiliadoTime}ms`);
          
          logger.warn({
            operation: 'aplicarBDIsspeaLote',
            step: 'afiliadoConMovimientosFallidos',
            afiliadoId: afiliado.id,
            movimientosFallidos,
            processingTimeMs: afiliadoTime,
            elapsedMs: Date.now() - startTime
          }, `Afiliado con movimientos fallidos - no se cambiará estado`);
          
          resultadosProcesamiento.push({
            afiliadoId: afiliado.id,
            folio: afiliado.folio,
            nombreCompleto,
            estadoAnterior: afiliado.statusActual,
            estadoNuevo: null,
            exito: false,
            mensaje: 'Algunos movimientos fallaron en la migración a Firebird',
            movimientos: resultadosMovimientos
          });
          continue;
        }

        // 2.4. Si todos los movimientos fueron exitosos, actualizar inmediatamente en SQL Server
        console.log(`\n   ✅ Resultado: EXITOSO - Todos los movimientos migrados`);
        console.log(`      Movimientos migrados: ${resultadosMovimientos.length}`);
        console.log(`      Tiempo procesamiento: ${afiliadoTime}ms`);
        console.log(`      🔄 Actualizando estado en SQL Server...`);

        logger.info({
          operation: 'aplicarBDIsspeaLote',
          step: 'afiliadoProcesadoExitosamente',
          afiliadoId: afiliado.id,
          movimientosMigrados: resultadosMovimientos.length,
          processingTimeMs: afiliadoTime,
          elapsedMs: Date.now() - startTime
        }, `✅ Afiliado procesado exitosamente - Iniciando actualización SQL`);

        // Actualizar estado inmediatamente en transacción individual
        let transaction;
        let estadoActualizado = false;
        try {
          const updateStart = Date.now();
          transaction = p.transaction();
          await transaction.begin();
          
          logger.info({
            operation: 'aplicarBDIsspeaLote',
            step: 'actualizandoAfiliadoInmediato',
            afiliadoId: afiliado.id,
            elapsedMs: Date.now() - startTime
          }, 'Transacción iniciada para actualizar afiliado');

          // 1. Cambiar estado a 7 (Aplicado a BDIsspea)
          const sqlCambioEstado = `
            EXEC dbo.spCambiarStatusAfiliado 
              @afiliadoId = ${afiliado.id}, 
              @numValidacionNuevo = 7,
              @usuarioId = '${usuarioId}',
              @motivo = 'Aplicación masiva a BDIsspea',
              @observaciones = 'Cambio automático después de migración exitosa a Firebird',
              @ipAddress = '${ipAddress || 'N/A'}',
              @userAgent = '${userAgent || 'N/A'}'
          `;
          
          await transaction.request()
            .input('afiliadoId', sql.Int, afiliado.id)
            .input('numValidacionNuevo', sql.Int, 7)
            .input('usuarioId', sql.NVarChar(50), usuarioId)
            .input('motivo', sql.NVarChar(500), 'Aplicación masiva a BDIsspea')
            .input('observaciones', sql.NVarChar(1000), 'Cambio automático después de migración exitosa a Firebird')
            .input('ipAddress', sql.NVarChar(45), ipAddress)
            .input('userAgent', sql.NVarChar(500), userAgent)
            .execute('dbo.spCambiarStatusAfiliado');

          logger.debug({
            operation: 'aplicarBDIsspeaLote',
            step: 'spCambiarStatusAfiliadoEjecutado',
            afiliadoId: afiliado.id,
            sqlExecuted: sqlCambioEstado
          }, 'SP ejecutado: spCambiarStatusAfiliado');

          // 2. Marcar como completo
          const sqlMarcarCompleto = `
            UPDATE afi.Afiliado 
            SET afiliadosComplete = 1, 
                updatedAt = SYSUTCDATETIME()
            WHERE id = ${afiliado.id}
          `;
          
          await transaction.request()
            .input('afiliadoId', sql.Int, afiliado.id)
            .query(`
              UPDATE afi.Afiliado 
              SET afiliadosComplete = 1, 
                  updatedAt = SYSUTCDATETIME()
              WHERE id = @afiliadoId
            `);

          logger.debug({
            operation: 'aplicarBDIsspeaLote',
            step: 'afiliadoMarcadoCompleto',
            afiliadoId: afiliado.id,
            sqlExecuted: sqlMarcarCompleto
          }, 'Afiliado marcado como completo');

          // Commit de la transacción
          await transaction.commit();
          estadoActualizado = true;
          
          const updateTime = Date.now() - updateStart;
          console.log(`      ✅ Estado actualizado en SQL Server (${updateTime}ms)`);
          console.log(`         Estado: ${afiliado.statusActual} → Aplicado a la BDIsspea (7)`);
          console.log(`         afiliadosComplete: 0 → 1`);
          
          logger.info({
            operation: 'aplicarBDIsspeaLote',
            step: 'afiliadoActualizadoExitosamente',
            afiliadoId: afiliado.id,
            updateTimeMs: updateTime,
            elapsedMs: Date.now() - startTime
          }, 'Afiliado actualizado exitosamente en SQL Server');

        } catch (errorSQL: any) {
          console.error(`      ❌ Error actualizando SQL Server: ${errorSQL.message}`);
          
          logger.error({
            operation: 'aplicarBDIsspeaLote',
            step: 'errorActualizarAfiliadoInmediato',
            afiliadoId: afiliado.id,
            error: {
              message: errorSQL.message,
              stack: errorSQL.stack,
              code: errorSQL.code,
              number: errorSQL.number
            },
            elapsedMs: Date.now() - startTime
          }, '❌ Error crítico: Afiliado migrado a Firebird pero falló actualización SQL Server');

          // Rollback si la transacción está activa
          if (transaction) {
            try {
              await transaction.rollback();
              logger.info({
                operation: 'aplicarBDIsspeaLote',
                step: 'rollbackAfiliadoExitoso',
                afiliadoId: afiliado.id
              }, 'Rollback exitoso de transacción del afiliado');
            } catch (rollbackError: any) {
              logger.error({
                operation: 'aplicarBDIsspeaLote',
                step: 'errorRollbackAfiliado',
                afiliadoId: afiliado.id,
                error: rollbackError.message
              }, 'Error en rollback de transacción del afiliado');
            }
          }

          // Marcar como fallido por error en SQL Server (aunque Firebird fue exitoso)
          resultadosProcesamiento.push({
            afiliadoId: afiliado.id,
            folio: afiliado.folio,
            nombreCompleto,
            estadoAnterior: afiliado.statusActual,
            estadoNuevo: null,
            exito: false,
            mensaje: `⚠️ INCONSISTENCIA: Movimientos migrados a Firebird exitosamente pero falló actualización SQL Server: ${errorSQL.message}`,
            movimientos: resultadosMovimientos,
            inconsistenciaDetectada: true
          });
          continue;
        }

        // Si llegamos aquí, todo fue exitoso
        movimientosMigrados.push(...resultadosMovimientos);

        resultadosProcesamiento.push({
          afiliadoId: afiliado.id,
          folio: afiliado.folio,
          nombreCompleto,
          estadoAnterior: afiliado.statusActual,
          estadoNuevo: 'Aplicado a la BDIsspea',
          exito: true,
          mensaje: 'Afiliado procesado exitosamente: movimientos migrados a Firebird y estado actualizado a 7',
          movimientos: resultadosMovimientos
        });

      } catch (error: any) {
        const afiliadoTime = Date.now() - afiliadoStart;
        const nombreCompleto = `${afiliado.nombre || ''} ${afiliado.apellidoPaterno || ''} ${afiliado.apellidoMaterno || ''}`.trim();
        
        console.error(`\n   ❌ ERROR al procesar afiliado [${afiliadoTime}ms]`);
        console.error(`      Error: ${error.message}`);
        console.error(`      Código: ${error.code || 'N/A'}`);
        
        const afiliadoCompleto = await getAfiliadoById(afiliado.id).catch(() => null);
        
        logger.error({
          operation: 'aplicarBDIsspeaLote',
          step: 'procesarAfiliado',
          afiliadoId: afiliado.id,
          folio: afiliado.folio,
          nombreCompleto,
          estadoAnterior: afiliado.statusActual,
          estadoNuevo: 'Aplicado a la BDIsspea',
          processingTimeMs: afiliadoTime,
          datosAfiliado: afiliadoCompleto ? {
            id: afiliadoCompleto.id,
            folio: afiliadoCompleto.folio,
            nombre: afiliadoCompleto.nombre,
            apellidoPaterno: afiliadoCompleto.apellidoPaterno,
            apellidoMaterno: afiliadoCompleto.apellidoMaterno,
            curp: afiliadoCompleto.curp,
            rfc: afiliadoCompleto.rfc,
            numeroSeguroSocial: afiliadoCompleto.numeroSeguroSocial,
            interno: afiliadoCompleto.interno,
            numValidacion: afiliadoCompleto.numValidacion,
            fechaNacimiento: afiliadoCompleto.fechaNacimiento,
            fechaAlta: afiliadoCompleto.fechaAlta,
            estatus: afiliadoCompleto.estatus
          } : null,
          movimientosIntentados: [],
          error: {
            message: error.message,
            stack: error.stack,
            name: error.name,
            code: error.code
          },
          elapsedMs: Date.now() - startTime,
          timestamp: new Date().toISOString()
        }, '❌ ERROR al procesar afiliado');
        
        resultadosProcesamiento.push({
          afiliadoId: afiliado.id,
          folio: afiliado.folio,
          nombreCompleto,
          estadoAnterior: afiliado.statusActual,
          estadoNuevo: null,
          exito: false,
          mensaje: `Error al procesar afiliado: ${error.message}`,
          movimientos: []
        });
      }
    }

  // Resumen de FASE 2
  const fase2Time = Date.now() - fase2Start;
  const afiliadosExitososFase2 = resultadosProcesamiento.filter(r => r.exito).length;
  const afiliadosFallidosFase2 = resultadosProcesamiento.filter(r => !r.exito).length;
  
  console.log(`\n${'─'.repeat(80)}`);
  console.log(`📊 Resumen FASE 2 - Completada en ${Math.round(fase2Time / 1000)}s`);
  console.log(`   ✅ Exitosos: ${afiliadosExitososFase2}`);
  console.log(`   ❌ Fallidos: ${afiliadosFallidosFase2}`);
  console.log(`   🔄 Movimientos migrados: ${movimientosMigrados.length}`);
  console.log(`${'─'.repeat(80)}\n`);
  
  logger.info({
    operation: 'aplicarBDIsspeaLote',
    step: 'fase2Completada',
    afiliadosExitosos: afiliadosExitososFase2,
    afiliadosFallidos: afiliadosFallidosFase2,
    movimientosMigrados: movimientosMigrados.length,
    fase2TimeMs: fase2Time,
    elapsedMs: Date.now() - startTime
  }, `📊 FASE 2 completada: ${afiliadosExitososFase2} exitosos, ${afiliadosFallidosFase2} fallidos`);

  // FASE 3: Actualizar BitacoraAfectacionOrg (solo si TODOS los afiliados fueron exitosos)
  console.log(`\n${'─'.repeat(80)}`);
  console.log(`💾 FASE 3: Verificando estado final y actualizando bitácora`);
  console.log(`${'─'.repeat(80)}`);
  
  const fase3Start = Date.now();
  const afiliadosExitosos = resultadosProcesamiento.filter(r => r.exito).length;
  const afiliadosFallidos = resultadosProcesamiento.filter(r => !r.exito).length;
  const todosExitosos = afiliadosFallidos === 0 && afiliadosExitosos > 0;
  
  console.log(`   Afiliados exitosos: ${afiliadosExitosos}`);
  console.log(`   Afiliados fallidos: ${afiliadosFallidos}`);
  console.log(`   ¿Todos exitosos?: ${todosExitosos ? '✅ SÍ' : '❌ NO'}`);
  
  logger.info({
    operation: 'aplicarBDIsspeaLote',
    step: 'iniciandoFase3',
    afiliadosExitosos,
    afiliadosFallidos,
    todosExitosos,
    org0,
    org1,
    elapsedMs: Date.now() - startTime,
    timestamp: new Date().toISOString()
  }, `💾 FASE 3: ${todosExitosos ? 'Actualizando bitácora' : 'No se actualizará bitácora (hay afiliados fallidos)'}`);
  
  let bitacoraActualizada = 0;
  
  if (todosExitosos) {
    console.log(`\n   🔄 Actualizando BitacoraAfectacionOrg como "APLICAR"...`);
    
    let transaction: any = null;
    
    try {
      const txStart = Date.now();
      transaction = p.transaction();
      
      logger.info({
        operation: 'aplicarBDIsspeaLote',
        step: 'iniciandoTransaccionBitacora',
        elapsedMs: Date.now() - startTime,
        timestamp: new Date().toISOString()
      }, 'Iniciando transacción para actualizar bitácora');
      
      await transaction.begin();
      
      const txTime = Date.now() - txStart;
      console.log(`      Transacción iniciada en ${txTime}ms`);

      // Actualizar BitacoraAfectacionOrg como "APLICAR"
      const bitacoraStart = Date.now();
      const sqlBitacora = `
        UPDATE TOP (1) bao
        SET bao.Accion = 'APLICAR',
            bao.ModifiedAt = SYSUTCDATETIME(),
            bao.Usuario = '${usuarioId}',
            bao.Resultado = 'OK',
            bao.Mensaje = 'Todos los afiliados procesados exitosamente - ${afiliadosExitosos} afiliados aplicados a Movimientos BDIsspea'
        FROM afec.BitacoraAfectacionOrg bao
        WHERE bao.Org0 = '${org0}'
          AND bao.Org1 = '${org1}'
          AND bao.Accion = 'Aplicar'
          AND bao.Entidad = 'AFILIADOS'
      `;
      
      const bitacoraResult = await transaction.request()
        .input('org0', sql.VarChar(30), org0)
        .input('org1', sql.VarChar(30), org1)
        .input('usuarioId', sql.NVarChar(50), usuarioId)
        .input('mensaje', sql.NVarChar(4000), `Todos los afiliados procesados exitosamente - ${afiliadosExitosos} afiliados aplicados a BDIsspea`)
        .query(`
          UPDATE TOP (1) bao
          SET bao.Accion = 'APLICAR',
              bao.ModifiedAt = SYSUTCDATETIME(),
              bao.Usuario = @usuarioId,
              bao.Resultado = 'OK',
              bao.Mensaje = @mensaje
          FROM afec.BitacoraAfectacionOrg bao
          WHERE bao.Org0 = @org0
            AND bao.Org1 = @org1
            AND bao.Accion = 'Aplicar'
            AND bao.Entidad = 'AFILIADOS'
        `);
      
      const bitacoraTime = Date.now() - bitacoraStart;
      bitacoraActualizada = bitacoraResult.rowsAffected[0] || 0;
      
      console.log(`      ✅ Bitácora actualizada (${bitacoraActualizada} registro(s)) en ${bitacoraTime}ms`);
      
      logger.info({
        operation: 'aplicarBDIsspeaLote',
        step: 'bitacoraActualizada',
        registrosActualizados: bitacoraActualizada,
        sqlExecuted: sqlBitacora,
        elapsedMs: Date.now() - startTime
      }, 'BitacoraAfectacionOrg actualizada como APLICAR para Movimientos BDIsspea');

      // Hacer commit de la transacción
      console.log(`\n      💾 Haciendo commit...`);
      const commitStart = Date.now();
      
      await transaction.commit();
      
      const commitTime = Date.now() - commitStart;
      console.log(`      ✅ Commit exitoso en ${commitTime}ms`);
      
      logger.info({
        operation: 'aplicarBDIsspeaLote',
        step: 'commitBitacoraExitoso',
        commitTimeMs: commitTime,
        elapsedMs: Date.now() - startTime
      }, 'Commit de bitácora exitoso');
      
    } catch (error: any) {
      console.error(`      ❌ Error al actualizar bitácora: ${error.message}`);
      
      logger.error({
        operation: 'aplicarBDIsspeaLote',
        step: 'errorActualizarBitacora',
        org0,
        org1,
        error: {
          message: error.message,
          stack: error.stack,
          code: error.code,
          number: error.number
        },
        elapsedMs: Date.now() - startTime
      }, '❌ Error al actualizar BitacoraAfectacionOrg');
      
      // Hacer rollback si la transacción está activa
      if (transaction) {
        try {
          await transaction.rollback();
          logger.info({
            operation: 'aplicarBDIsspeaLote',
            step: 'rollbackBitacoraExitoso'
          }, 'Rollback de transacción bitácora exitoso');
        } catch (rollbackError: any) {
          logger.error({
            operation: 'aplicarBDIsspeaLote',
            step: 'errorRollbackBitacora',
            error: rollbackError.message
          }, 'Error en rollback de transacción bitácora');
        }
      }
      
      // No lanzar error, solo registrar. Los afiliados ya fueron procesados
      console.warn(`      ⚠️  Bitácora no actualizada, pero afiliados ya fueron procesados`);
      bitacoraActualizada = 0;
    }
    
    const fase3Time = Date.now() - fase3Start;
    console.log(`\n${'─'.repeat(80)}`);
    console.log(`📊 FASE 3 completada en ${Math.round(fase3Time / 1000)}s`);
    console.log(`${'─'.repeat(80)}\n`);
    
  } else {
    console.log(`\n   ⚠️  NO se actualizará BitacoraAfectacionOrg porque hay afiliados fallidos`);
    console.log(`      Para marcarla como "APLICAR", TODOS los afiliados deben procesarse exitosamente`);
    
    logger.warn({
      operation: 'aplicarBDIsspeaLote',
      step: 'bitacoraNoActualizada',
      razon: 'Hay afiliados fallidos',
      afiliadosExitosos,
      afiliadosFallidos,
      org0,
      org1,
      elapsedMs: Date.now() - startTime
    }, 'BitacoraAfectacionOrg NO actualizada - hay afiliados fallidos');
  }

  // Resumen final
  const movimientosExitosos = movimientosMigrados.filter(m => m.exito).length;
  const movimientosFallidos = detallesMigracion.filter(m => !m.exito).length;
  const tiempoTotal = Date.now() - startTime;

  const resultado = {
    afiliadosProcesados: resultadosProcesamiento,
    afiliadosCambiadosEstado: afiliadosExitosos,
    afiliadosFallidos,
    afiliadosCompletos: afiliadosExitosos, // Los afiliados exitosos ya fueron marcados como completos individualmente
    bitacoraActualizada: todosExitosos ? bitacoraActualizada : 0,
    movimientosMigrados: movimientosMigrados,
    afiliadosConMigracionExitosa: afiliadosExitosos,
    afiliadosConMigracionFallida: afiliadosFallidos,
    detallesMigracion: detallesMigracion,
    resumen: {
      totalEncontrados: afiliadosParaProcesar.length,
      procesadosExitosamente: afiliadosExitosos,
      procesadosConError: afiliadosFallidos,
      movimientosTotales: detallesMigracion.length,
      movimientosExitosos,
      movimientosFallidos,
      bitacoraActualizada: todosExitosos && bitacoraActualizada > 0,
      mensaje: todosExitosos 
        ? `Todos los ${afiliadosExitosos} afiliados procesados exitosamente`
        : `${afiliadosExitosos} de ${afiliadosParaProcesar.length} afiliados procesados exitosamente`,
      organica: `${org0}/${org1}`
    }
  };

  // Resumen final
  const estadoFinal = todosExitosos ? '✅ COMPLETADO' : afiliadosExitosos > 0 ? '⚠️ COMPLETADO CON ERRORES' : '❌ FALLIDO';
  
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🎉 PROCESO ${estadoFinal}`);
  console.log(`${'='.repeat(80)}`);
  console.log(`⏱️  Tiempo total: ${Math.round(tiempoTotal / 1000)}s (${tiempoTotal}ms)`);
  console.log(`📊 Resumen:`);
  console.log(`   🔍 Afiliados encontrados: ${afiliadosParaProcesar.length}`);
  console.log(`   ✅ Procesados exitosamente: ${afiliadosExitosos}`);
  console.log(`   ❌ Procesados con error: ${afiliadosFallidos}`);
  console.log(`   🔄 Movimientos totales: ${detallesMigracion.length}`);
  console.log(`   ✅ Movimientos migrados: ${movimientosExitosos}`);
  console.log(`   ❌ Movimientos fallidos: ${movimientosFallidos}`);
  console.log(`   💾 Afiliados marcados completos: ${afiliadosExitosos}`);
  console.log(`   📋 Bitácora actualizada: ${todosExitosos && bitacoraActualizada > 0 ? 'SÍ' : 'NO'}`);
  console.log(`   🏢 Orgánica: ${org0}/${org1}`);
  console.log(`${'='.repeat(80)}\n`);
  
  logger.info({
    operation: 'aplicarBDIsspeaLote',
    step: 'procesoCompletado',
    resumen: resultado.resumen,
    totalTimeMs: tiempoTotal,
    totalTimeSec: Math.round(tiempoTotal / 1000),
    timestamp: new Date().toISOString()
  }, `Proceso completado en ${Math.round(tiempoTotal / 1000)}s: ${resultado.resumen.mensaje}`);
  
  return resultado;
  } catch (error: any) {
    const tiempoTotalError = Date.now() - startTime;
    const afiliadosExitososError = resultadosProcesamiento.filter(r => r.exito).length;
    const movimientosExitososError = detallesMigracion.filter(m => m.exito).length;
    
    // Error general del proceso (probablemente en FASE 1)
    console.error(`\n${'='.repeat(80)}`);
    console.error(`🔴 ERROR DURANTE EL PROCESO`);
    console.error(`${'='.repeat(80)}`);
    console.error(`❌ Error: ${error.message}`);
    console.error(`   Código: ${error.code || 'N/A'}`);
    console.error(`   Tiempo transcurrido: ${Math.round(tiempoTotalError / 1000)}s`);
    console.error(`   Afiliados procesados antes del error: ${afiliadosExitososError}`);
    console.error(`${'='.repeat(80)}\n`);
    
    logger.error({
      operation: 'aplicarBDIsspeaLote',
      step: 'errorGeneral',
      org0,
      org1,
      usuarioId,
      estadoAlError: {
        afiliadosProcesados: resultadosProcesamiento?.length || 0,
        afiliadosExitosos: afiliadosExitososError,
        movimientosIntentados: detallesMigracion?.length || 0,
        movimientosExitosos: movimientosExitososError
      },
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code,
        number: error.number
      },
      elapsedMs: tiempoTotalError,
      timestamp: new Date().toISOString()
    }, 'Error durante proceso aplicarBDIsspeaLote');
    
    throw error;
  }
}

export async function createAfiliadoAfiliadoOrgMovimiento(data: {
  afiliado: Omit<Afiliado, 'id' | 'createdAt' | 'updatedAt'>;
  afiliadoOrg: Omit<AfiliadoOrg, 'id' | 'afiliadoId' | 'createdAt' | 'updatedAt'>;
  movimiento: Omit<Movimiento, 'id' | 'afiliadoId' | 'createdAt'>;
}): Promise<{ afiliado: Afiliado; afiliadoOrg: AfiliadoOrg; movimiento: Movimiento }> {
  const p = await getPool();
  
  // Validar que no exista ya un afiliado activo (estatus = 1) con el mismo CURP, RFC o NSS
  // Si numeroSeguroSocial es 0, vacío o null, no se incluye en la búsqueda
  const request = p.request();
  const conditions: string[] = [];
  
  // Agregar CURP si tiene valor
  if (data.afiliado.curp) {
    request.input('curp', sql.VarChar(18), data.afiliado.curp);
    conditions.push('(curp = @curp AND curp IS NOT NULL)');
  }
  
  // Agregar RFC si tiene valor
  if (data.afiliado.rfc) {
    request.input('rfc', sql.VarChar(13), data.afiliado.rfc);
    conditions.push('(rfc = @rfc AND rfc IS NOT NULL)');
  }
  
  // Agregar numeroSeguroSocial solo si tiene valor válido (no 0, no vacío, no null, no undefined)
  const nss = data.afiliado.numeroSeguroSocial;
  const nssIsValid = nss !== null && 
                     nss !== undefined && 
                     nss !== '' && 
                     nss !== '0' && 
                     String(nss).trim() !== '' && 
                     String(nss).trim() !== '0';
  
  if (nssIsValid) {
    request.input('numeroSeguroSocial', sql.VarChar(50), nss);
    conditions.push('(numeroSeguroSocial = @numeroSeguroSocial AND numeroSeguroSocial IS NOT NULL)');
  }
  
  // Si no hay condiciones válidas, no hacer la validación
  if (conditions.length === 0) {
    // No hay campos para validar, continuar sin validación
  } else {
    const whereClause = conditions.join(' OR ');
    const query = `
      SELECT id, curp, rfc, numeroSeguroSocial, estatus
      FROM afi.Afiliado
      WHERE (${whereClause})
        AND estatus = 1
    `;
    
    const validationResult = await request.query(query);

    if (validationResult.recordset.length > 0) {
      const existing = validationResult.recordset[0];
      let duplicateField = '';
      let duplicateValue = '';
      if (data.afiliado.curp && existing.curp === data.afiliado.curp) {
        duplicateField = 'CURP';
        duplicateValue = existing.curp;
      } else if (data.afiliado.rfc && existing.rfc === data.afiliado.rfc) {
        duplicateField = 'RFC';
        duplicateValue = existing.rfc;
      } else if (nssIsValid && existing.numeroSeguroSocial === data.afiliado.numeroSeguroSocial) {
        duplicateField = 'Número de Seguro Social';
        duplicateValue = existing.numeroSeguroSocial;
      }
      
      const error = new AfiliadoAlreadyExistsError({
        field: duplicateField,
        value: duplicateValue
      });
      // Sobrescribir el mensaje con uno más específico
      error.message = `Ya existe un afiliado activo registrado con el mismo ${duplicateField}: ${duplicateValue}`;
      throw error;
    }
  }

  const transaction = p.transaction();

  try {
    await transaction.begin();

    // Generar folio automático si no se proporciona
    let folio = data.afiliado.folio;
    if (!folio || folio === 0) {
      const folioResult = await p.request().query(`
        SELECT ISNULL(MAX(folio), 0) + 1 AS nextFolio
        FROM afi.Afiliado
      `);
      folio = folioResult.recordset[0].nextFolio;
      console.log(`Folio auto-generado: ${folio}`);
    }

    // Calcular quincenaAplicacion y anioAplicacion basado en la orgánica si no se proporcionan
    let quincenaAplicacion = data.afiliado.quincenaAplicacion;
    let anioAplicacion = data.afiliado.anioAplicacion;
    
    if (quincenaAplicacion === null || quincenaAplicacion === undefined || 
        anioAplicacion === null || anioAplicacion === undefined) {
      // Usar los datos de orgánica para consultar la quincena específica
      const calculatedValues = await getQuincenaAplicacion(
        data.afiliadoOrg.claveOrganica0 || '',
        data.afiliadoOrg.claveOrganica1,
        data.afiliadoOrg.claveOrganica2,
        data.afiliadoOrg.claveOrganica3,
        data.movimiento.creadoPor ?? undefined
      );
      quincenaAplicacion = calculatedValues.quincena;
      anioAplicacion = calculatedValues.anio;
      
      console.log(`Quincena calculada para orgánica ${data.afiliadoOrg.claveOrganica0}/${data.afiliadoOrg.claveOrganica1}/${data.afiliadoOrg.claveOrganica2}/${data.afiliadoOrg.claveOrganica3}: ${quincenaAplicacion}, Año: ${anioAplicacion}`);
    }

    // Create Afiliado con las nuevas columnas
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
      .input('anioAplicacion', sql.SmallInt, anioAplicacion)
      .input('codigoPostal', sql.Int, data.afiliado.codigoPostal)
      .input('numValidacion', sql.Int, data.afiliado.numValidacion || 1)
      .input('afiliadosComplete', sql.Int, data.afiliado.afiliadosComplete || 0);

    const afiliadoResult = await afiliadoRequest.query(`
      INSERT INTO afi.Afiliado (
        folio, apellidoPaterno, apellidoMaterno, nombre, curp, rfc,
        numeroSeguroSocial, fechaNacimiento, entidadFederativaNacId,
        domicilioCalle, domicilioNumeroExterior, domicilioNumeroInterior,
        domicilioEntreCalle1, domicilioEntreCalle2,
        domicilioColonia, domicilioCodigoPostal, telefono, estadoCivilId,
        sexo, correoElectronico, estatus, interno, noEmpleado, localidad,
        municipio, estado, pais, dependientes, poseeInmuebles, fechaCarta,
        nacionalidad, fechaAlta, celular, expediente, quincenaAplicacion, anioAplicacion,
        codigoPostal, numValidacion, afiliadosComplete
      )
      OUTPUT INSERTED.*
      VALUES (
        @folio, @apellidoPaterno, @apellidoMaterno, @nombre, @curp, @rfc,
        @numeroSeguroSocial, @fechaNacimiento, @entidadFederativaNacId,
        @domicilioCalle, @domicilioNumeroExterior, @domicilioNumeroInterior,
        @domicilioEntreCalle1, @domicilioEntreCalle2,
        @domicilioColonia, @domicilioCodigoPostal, @telefono, @estadoCivilId,
        @sexo, @correoElectronico, @estatus, @interno, @noEmpleado, @localidad,
        @municipio, @estado, @pais, @dependientes, @poseeInmuebles, @fechaCarta,
        @nacionalidad, @fechaAlta, @celular, @expediente, @quincenaAplicacion, @anioAplicacion,
        @codigoPostal, @numValidacion, @afiliadosComplete
      )
    `);

    const afiliadoRow = afiliadoResult.recordset[0];
    const afiliadoId = afiliadoRow.id;
    
    console.log(`Afiliado creado - ID: ${afiliadoId}, Folio: ${afiliadoRow.folio}, QuincenaAplicacion: ${afiliadoRow.quincenaAplicacion}, AnioAplicacion: ${afiliadoRow.anioAplicacion}`);

    // Create AfiliadoOrg
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

    // Create Movimiento
    const movimientoRequest = transaction.request()
      .input('quincenaId', sql.VarChar(30), data.movimiento.quincenaId)
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

    await transaction.commit();

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
        codigoPostal: afiliadoRow.codigoPostal,
        numValidacion: afiliadoRow.numValidacion || 1,
        afiliadosComplete: afiliadoRow.afiliadosComplete || 0,
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
        creadoPorUid: movimientoRow.creadoPorUid || null,
        createdAt: movimientoRow.createdAt?.toISOString() || new Date().toISOString()
      }
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}