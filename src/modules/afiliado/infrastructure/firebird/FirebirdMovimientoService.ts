import { getPool, sql } from '../../../../db/mssql.js';
import { executeSerializedQuery } from '../../../../db/firebird.js';
import { getTipoMovimientoById } from '../../../tipoMovimiento/tipoMovimiento.repo.js';
import { getAfiliadoOrgByAfiliadoId } from '../../../afiliadoOrg/afiliadoOrg.repo.js';
import { getAfiliadoById, actualizarInternoAfiliado } from '../../afiliado.repo.js';
import type { Movimiento } from '../../../movimiento/movimiento.repo.js';
import type { Afiliado } from '../../domain/entities/Afiliado.js';
import pino from 'pino';

const logger = pino({
  name: 'firebirdMovimientoService',
  level: process.env.LOG_LEVEL || 'info'
});

export interface DatosMovimientoFirebird {
  interno: number;
  org0: string;
  org1: string;
  org2: string | null;
  org3: string | null;
  sueldo: number;
  op: number; // Siempre 0
  q: number; // Quinquenio
  retroactivas: number; // Siempre 0
  periodo: string; // formato '1925'
  movimiento: string; // AL, BA, LI, LT, CS, LB
  fecha: string; // formato mm/dd/yy
  bc: string; // Base/Confianza: 'C' o 'B'
  porc: number; // Porcentaje
}

export interface ResultadoMigracionFirebird {
  exito: boolean;
  cveError: number;
  nomError: string | null;
  movimientoId: number;
  tipoMovimientoId: number;
  codigoMovimiento: string | null;
  retryAttempts?: number;
  executionTimeMs?: number;
  sqlExecuted?: string;
  parametersUsed?: Record<string, any>;
  mensajeAdicional?: string;
}

export interface LogEjecucionDPEditaEntidad {
  movimientoId: number;
  afiliadoId: number;
  tipoMovimientoId: number;
  codigoMovimiento: string | null;
  datosPreparados: DatosMovimientoFirebird | null;
  sqlQuery: string | null;
  parametros: Array<{ nombre: string; valor: any; tipo: string }> | null;
  validaciones: {
    codigoMovimiento: { valido: boolean; mensaje?: string };
    datosMovimiento: { valido: boolean; mensaje?: string };
    periodo: { valido: boolean; mensaje?: string; periodo?: string };
    fecha: { valido: boolean; mensaje?: string; fechaFormateada?: string };
    porcentaje: { valido: boolean; mensaje?: string; valor?: number };
    baseConfianza: { valido: boolean; mensaje?: string; valor?: string };
  };
  errores: string[];
  listoParaEjecutar: boolean;
}

export interface LogEjecucionDPEditaPersonal {
  afiliadoId: number;
  datosPreparados: Array<any> | null;
  sqlQuery: string | null;
  parametros: Array<{ nombre: string; valor: any; tipo: string }> | null;
  comandoEjecutable: string | null;
  validaciones: {
    datosAfiliado: { valido: boolean; mensaje?: string };
    camposRequeridos: { valido: boolean; mensaje?: string };
  };
  errores: string[];
  listoParaEjecutar: boolean;
}

/**
 * Obtiene el INTERNO para un afiliado
 * 1. Busca en tabla Afiliado (SQL Server)
 * 2. Si no existe o es 0, ejecuta DP_EDITA_PERSONAL en Firebird para crear el registro y obtener el INTERNO
 */
export async function obtenerInterno(afiliadoId: number): Promise<number> {
  const logContext = {
    operation: 'obtenerInterno',
    afiliadoId
  };

  try {
    // 1. Buscar interno en tabla Afiliado (SQL Server)
    let afiliado;
    try {
      afiliado = await getAfiliadoById(afiliadoId);
    } catch (error: any) {
      logger.error({
        operation: 'obtenerInterno',
        step: 'obtenerAfiliado',
        afiliadoId,
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name,
          code: error.code
        },
        timestamp: new Date().toISOString()
      }, 'Error detallado al obtener afiliado para INTERNO');
      throw error;
    }
    
    if (afiliado && afiliado.interno && afiliado.interno > 0) {
      logger.debug({ ...logContext, interno: afiliado.interno }, 'Interno encontrado en tabla Afiliado');
      return afiliado.interno;
    }

    // 2. Si no tiene INTERNO, buscar en Firebird por CURP o RFC
    logger.info(logContext, 'Buscando INTERNO en Firebird por CURP/RFC antes de ejecutar DP_EDITA_PERSONAL');
    
    if (!afiliado) {
      logger.error({
        operation: 'obtenerInterno',
        step: 'afiliadoNoEncontrado',
        afiliadoId,
        timestamp: new Date().toISOString()
      }, 'Afiliado no encontrado');
      throw new Error(`Afiliado con ID ${afiliadoId} no encontrado`);
    }

    const internoEnFirebird = await buscarInternoEnFirebird(afiliado.curp, afiliado.rfc);

    if (internoEnFirebird && internoEnFirebird > 0) {
      logger.info({
        ...logContext,
        internoEncontrado: internoEnFirebird,
        curp: afiliado.curp,
        rfc: afiliado.rfc
      }, 'INTERNO encontrado en Firebird - Guardando en SQL Server');
      
      // Guardar INTERNO en SQL Server
      try {
        await actualizarInternoAfiliado(afiliadoId, internoEnFirebird);
      } catch (errorUpdate: any) {
        // Log el error pero no fallar - el INTERNO se obtuvo exitosamente
        logger.error({
          ...logContext,
          internoEncontrado: internoEnFirebird,
          error: errorUpdate.message
        }, 'Error al guardar INTERNO en SQL Server, pero se retornará el INTERNO de Firebird');
      }
      
      return internoEnFirebird;
    }

    logger.info(logContext, 'INTERNO no encontrado en Firebird - Procederá a ejecutar DP_EDITA_PERSONAL');

    // 3. Ejecutar DP_EDITA_PERSONAL para crear el registro y obtener el INTERNO
    let interno;
    try {
      interno = await ejecutarDPEditaPersonal(afiliado);
    } catch (error: any) {
      logger.error({
        operation: 'obtenerInterno',
        step: 'ejecutarDPEditaPersonal',
        afiliadoId,
        datosAfiliado: {
          id: afiliado.id,
          folio: afiliado.folio,
          nombre: afiliado.nombre,
          apellidoPaterno: afiliado.apellidoPaterno,
          apellidoMaterno: afiliado.apellidoMaterno,
          curp: afiliado.curp,
          rfc: afiliado.rfc,
          numeroSeguroSocial: afiliado.numeroSeguroSocial,
          fechaNacimiento: afiliado.fechaNacimiento,
          fechaAlta: afiliado.fechaAlta,
          nacionalidad: afiliado.nacionalidad,
          estadoCivilId: afiliado.estadoCivilId,
          interno: afiliado.interno
        },
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name,
          code: error.code
        },
        timestamp: new Date().toISOString()
      }, 'Error detallado al ejecutar DP_EDITA_PERSONAL para obtener INTERNO');
      throw error;
    }
    
    logger.info({ ...logContext, interno }, 'INTERNO generado desde DP_EDITA_PERSONAL');
    return interno;
  } catch (error: any) {
    logger.error({
      operation: 'obtenerInterno',
      step: 'errorGeneral',
      afiliadoId,
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code
      },
      timestamp: new Date().toISOString()
    }, 'Error detallado general al obtener INTERNO');
    throw error;
  }
}

/**
 * Mapea el texto de nacionalidad a un carácter
 * MEXICANA → 'M', EXTRANJERA → 'E'
 */
export function mapearNacionalidad(nacionalidad: string | null | undefined): string {
  if (!nacionalidad) {
    return 'M'; // Por defecto mexicana
  }

  const nacionalidadUpper = nacionalidad.toUpperCase();
  if (nacionalidadUpper.includes('MEXICANA')) {
    return 'M';
  }
  if (nacionalidadUpper.includes('EXTRANJERA')) {
    return 'E';
  }

  // Por defecto mexicana
  return 'M';
}

/**
 * Mapea el estadoCivilId (número) a un carácter
 * 1 → 'S' (Soltero), 2 → 'C' (Casado), 3 → 'D' (Divorciado), 4 → 'V' (Viudo), 5 → 'U' (Unión Libre)
 */
export function mapearEstadoCivilId(estadoCivilId: number | null | undefined): string {
  if (!estadoCivilId) {
    return 'S'; // Por defecto soltero
  }

  const mapeo: Record<number, string> = {
    1: 'S', // Soltero
    2: 'C', // Casado
    3: 'D', // Divorciado
    4: 'V', // Viudo
    5: 'U'  // Unión Libre
  };

  return mapeo[estadoCivilId] || 'S';
}

/**
 * Mapea los datos del afiliado a los parámetros del stored procedure DP_EDITA_PERSONAL
 */
export function mapearDatosAfiliadoParaDPEditaPersonal(afiliado: Afiliado): Array<any> {
  // Helper para truncar strings
  const truncar = (str: string | null | undefined, maxLength: number): string => {
    if (!str) return '';
    return str.substring(0, maxLength);
  };

  // Helper para formatear fecha a formato mm/dd/yy (para DP_EDITA_PERSONAL)
  const formatearFechaParaFirebird = (fecha: string | null | undefined): string | null => {
    if (!fecha) return null;
    try {
      const date = new Date(fecha);
      if (isNaN(date.getTime())) return null;
      // Formato mm/dd/yy
      const mes = String(date.getMonth() + 1).padStart(2, '0');
      const dia = String(date.getDate()).padStart(2, '0');
      const anio = String(date.getFullYear()).slice(-2);
      return `${mes}/${dia}/${anio}`;
    } catch {
      return null;
    }
  };

  // Helper para formatear fecha de nacimiento (date) - formato mm/dd/yy
  const formatearFechaNacimiento = (fecha: string | null | undefined): string | null => {
    if (!fecha) return null;
    try {
      const date = new Date(fecha);
      if (isNaN(date.getTime())) return null;
      // Formato mm/dd/yy
      const mes = String(date.getMonth() + 1).padStart(2, '0');
      const dia = String(date.getDate()).padStart(2, '0');
      const anio = String(date.getFullYear()).slice(-2);
      return `${mes}/${dia}/${anio}`;
    } catch {
      return null;
    }
  };

  // Construir CALLE_NUMERO
  const calleNumero = `${afiliado.domicilioCalle || ''} ${afiliado.domicilioNumeroExterior || ''}`.trim();
  
  // Obtener código postal
  const codigoPostal = String(afiliado.domicilioCodigoPostal || afiliado.codigoPostal || '').substring(0, 5);

  // Obtener sexo (primer carácter)
  const sexo = afiliado.sexo ? truncar(afiliado.sexo, 1) : '';

  // Mapear estado civil
  const estadoCivil = mapearEstadoCivilId(afiliado.estadoCivilId);

  // Mapear nacionalidad
  const nacionalidad = mapearNacionalidad(afiliado.nacionalidad);

  // POSEE_INMUEBLES: 'S' o 'N'
  const poseeInmuebles = afiliado.poseeInmuebles === true ? 'S' : (afiliado.poseeInmuebles === false ? 'N' : 'N');

  // Retornar array de parámetros en el orden correcto
  return [
    0, // PASO (integer) - siempre 0
    truncar(afiliado.curp, 18), // CURP (varchar 18)
    truncar(afiliado.rfc, 13), // RFC (varchar 13)
    truncar(afiliado.noEmpleado, 10), // NOEMPLEADO (varchar 10)
    truncar(afiliado.nombre, 30), // NOMBRE (varchar 30)
    truncar(afiliado.apellidoPaterno, 20), // APELLIDO_PATERNO (varchar 20)
    truncar(afiliado.apellidoMaterno, 20), // APELLIDO_MATERNO (varchar 20)
    formatearFechaNacimiento(afiliado.fechaNacimiento), // FECHA_NACIMIENTO (date)
    truncar(afiliado.numeroSeguroSocial, 11), // SEGURO_SOCIAL (varchar 11)
    truncar(calleNumero, 40), // CALLE_NUMERO (varchar 40)
    truncar(afiliado.domicilioColonia, 40), // FRACCIONAMIENTO (varchar 40)
    codigoPostal, // CODIGO_POSTAL (varchar 5)
    truncar(afiliado.telefono, 15), // TELEFONO (varchar 15)
    sexo, // SEXO (char 1)
    estadoCivil, // ESTADO_CIVIL (char 1)
    formatearFechaParaFirebird(afiliado.fechaAlta), // FECHA_ALTA (timestamp)
    'AGUASCALIENTES', // LOCALIDAD (varchar 25) - fijo
    1, // MUNICIPIO (smallint) - fijo
    1, // ESTADO (smallint) - fijo
    1, // PAIS (smallint) - fijo
    afiliado.dependientes || 0, // DEPENDIENTES (smallint)
    poseeInmuebles, // POSEE_INMUEBLES (char 1) - 'S' o 'N'
    truncar(afiliado.correoElectronico, 30), // EMAIL (varchar 30)
    nacionalidad // NACIONALIDAD (char 1) - 'M' o 'E'
  ];
}

/**
 * Prepara los datos y genera el log de ejecución para DP_EDITA_PERSONAL sin ejecutarlo
 * Útil para pruebas y validación antes de ejecutar el stored procedure
 */
export async function prepararLogEjecucionDPEditaPersonal(
  afiliado: Afiliado
): Promise<LogEjecucionDPEditaPersonal> {
  const logContext = {
    operation: 'prepararLogEjecucionDPEditaPersonal',
    afiliadoId: afiliado.id
  };

  const log: LogEjecucionDPEditaPersonal = {
    afiliadoId: afiliado.id,
    datosPreparados: null,
    sqlQuery: null,
    parametros: null,
    comandoEjecutable: null,
    validaciones: {
      datosAfiliado: { valido: false },
      camposRequeridos: { valido: false }
    },
    errores: [],
    listoParaEjecutar: false
  };

  try {
    // Validar que el afiliado tenga datos básicos
    if (!afiliado) {
      log.validaciones.datosAfiliado = {
        valido: false,
        mensaje: 'Afiliado no proporcionado'
      };
      log.errores.push('Afiliado no proporcionado');
      return log;
    }
    log.validaciones.datosAfiliado = { valido: true };

    // Validar campos requeridos básicos
    const camposRequeridos = ['curp', 'nombre', 'apellidoPaterno'];
    const camposFaltantes = camposRequeridos.filter(campo => !afiliado[campo as keyof Afiliado]);
    
    if (camposFaltantes.length > 0) {
      log.validaciones.camposRequeridos = {
        valido: false,
        mensaje: `Campos requeridos faltantes: ${camposFaltantes.join(', ')}`
      };
      log.errores.push(`Campos requeridos faltantes: ${camposFaltantes.join(', ')}`);
      return log;
    }
    log.validaciones.camposRequeridos = { valido: true };

    // Mapear datos del afiliado
    const datosMapeados = mapearDatosAfiliadoParaDPEditaPersonal(afiliado);
    log.datosPreparados = datosMapeados;

    // Generar SQL query con placeholders
    const sql = `
      SELECT p.INTERNO
      FROM DP_EDITA_PERSONAL(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) p
    `;
    log.sqlQuery = sql;

    // Generar array de parámetros con nombres
    const nombresParametros = [
      'PASO', 'CURP', 'RFC', 'NOEMPLEADO', 'NOMBRE', 'APELLIDO_PATERNO', 'APELLIDO_MATERNO',
      'FECHA_NACIMIENTO', 'SEGURO_SOCIAL', 'CALLE_NUMERO', 'FRACCIONAMIENTO', 'CODIGO_POSTAL',
      'TELEFONO', 'SEXO', 'ESTADO_CIVIL', 'FECHA_ALTA', 'LOCALIDAD', 'MUNICIPIO', 'ESTADO',
      'PAIS', 'DEPENDIENTES', 'POSEE_INMUEBLES', 'EMAIL', 'NACIONALIDAD'
    ];

    const parametros = datosMapeados.map((valor, index) => {
      let tipo = 'string';
      if (index === 0 || index === 17 || index === 18 || index === 19 || index === 20) {
        tipo = 'number';
      } else if (valor === null || valor === undefined) {
        tipo = 'null';
      }
      return {
        nombre: nombresParametros[index],
        valor: valor,
        tipo: tipo
      };
    });
    log.parametros = parametros;

    // Generar comando ejecutable
    const formatearValor = (valor: any, tipo: string): string => {
      if (valor === null || valor === undefined) {
        return 'NULL';
      }
      
      if (tipo === 'string' || tipo === 'null') {
        // Escapar comillas simples en strings
        const valorStr = String(valor).replace(/'/g, "''");
        return `'${valorStr}'`;
      }
      
      if (tipo === 'number') {
        return String(valor);
      }
      
      // Por defecto, tratar como string
      const valorStr = String(valor).replace(/'/g, "''");
      return `'${valorStr}'`;
    };

    const parametrosFormateados = parametros.map(param => formatearValor(param.valor, param.tipo));
    const comandoEjecutable = `SELECT p.INTERNO FROM DP_EDITA_PERSONAL(${parametrosFormateados.join(', ')}) p`;
    log.comandoEjecutable = comandoEjecutable;

    log.listoParaEjecutar = true;

    logger.debug({ ...logContext, parametrosCount: parametros.length }, 'Log de ejecución DP_EDITA_PERSONAL preparado');
    return log;
  } catch (error: any) {
    log.errores.push(`Error inesperado: ${error.message}`);
    logger.error({
      ...logContext,
      error: error.message,
      stack: error.stack
    }, 'Error al preparar log de ejecución DP_EDITA_PERSONAL');
    return log;
  }
}

/**
 * Ejecuta el stored procedure DP_EDITA_PERSONAL en Firebird
 * Retorna el INTERNO generado
 */
export async function ejecutarDPEditaPersonal(afiliado: Afiliado): Promise<number> {
  const logContext = {
    operation: 'ejecutarDPEditaPersonal',
    afiliadoId: afiliado.id
  };

  try {
    // Mapear datos del afiliado
    let datosMapeados;
    try {
      datosMapeados = mapearDatosAfiliadoParaDPEditaPersonal(afiliado);
    } catch (error: any) {
      logger.error({
        operation: 'ejecutarDPEditaPersonal',
        step: 'mapearDatos',
        afiliadoId: afiliado.id,
        datosAfiliado: {
          id: afiliado.id,
          folio: afiliado.folio,
          nombre: afiliado.nombre,
          apellidoPaterno: afiliado.apellidoPaterno,
          apellidoMaterno: afiliado.apellidoMaterno,
          curp: afiliado.curp,
          rfc: afiliado.rfc,
          numeroSeguroSocial: afiliado.numeroSeguroSocial,
          fechaNacimiento: afiliado.fechaNacimiento,
          fechaAlta: afiliado.fechaAlta,
          nacionalidad: afiliado.nacionalidad,
          estadoCivilId: afiliado.estadoCivilId
        },
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name
        },
        timestamp: new Date().toISOString()
      }, 'Error detallado al mapear datos del afiliado para DP_EDITA_PERSONAL');
      throw error;
    }

    logger.info(logContext, 'Ejecutando DP_EDITA_PERSONAL en Firebird');
    
    return await executeSerializedQuery((db) => {
      return new Promise<number>((resolve, reject) => {
        try {
          const sql = `
            SELECT p.INTERNO
            FROM DP_EDITA_PERSONAL(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) p
          `;

          logger.debug({
            ...logContext,
            parametrosCount: datosMapeados.length
          }, 'Ejecutando DP_EDITA_PERSONAL con parámetros');

          const timeoutId = setTimeout(() => {
            const timeoutError = new Error('Tiempo de espera agotado en consulta Firebird DP_EDITA_PERSONAL');
            logger.error({
              operation: 'ejecutarDPEditaPersonal',
              step: 'timeout',
              afiliadoId: afiliado.id,
              timeoutConfigurado: 30000,
              datosAfiliado: {
                id: afiliado.id,
                folio: afiliado.folio,
                nombre: afiliado.nombre,
                curp: afiliado.curp,
                rfc: afiliado.rfc
              },
              parametrosEnviados: datosMapeados,
              timestamp: new Date().toISOString()
            }, 'Error detallado: Timeout al ejecutar DP_EDITA_PERSONAL');
            reject(timeoutError);
          }, 30000); // 30 segundos de timeout

          db.query(sql, datosMapeados, (err: any, result: any) => {
            clearTimeout(timeoutId);

          if (err) {
            logger.error({
              operation: 'ejecutarDPEditaPersonal',
              step: 'ejecutarQuery',
              afiliadoId: afiliado.id,
              datosAfiliado: {
                id: afiliado.id,
                folio: afiliado.folio,
                nombre: afiliado.nombre,
                apellidoPaterno: afiliado.apellidoPaterno,
                apellidoMaterno: afiliado.apellidoMaterno,
                curp: afiliado.curp,
                rfc: afiliado.rfc,
                numeroSeguroSocial: afiliado.numeroSeguroSocial,
                fechaNacimiento: afiliado.fechaNacimiento,
                fechaAlta: afiliado.fechaAlta,
                nacionalidad: afiliado.nacionalidad,
                estadoCivilId: afiliado.estadoCivilId,
                sexo: afiliado.sexo,
                telefono: afiliado.telefono,
                correoElectronico: afiliado.correoElectronico,
                domicilioCalle: afiliado.domicilioCalle,
                domicilioNumeroExterior: afiliado.domicilioNumeroExterior,
                domicilioColonia: afiliado.domicilioColonia,
                domicilioCodigoPostal: afiliado.domicilioCodigoPostal,
                dependientes: afiliado.dependientes,
                poseeInmuebles: afiliado.poseeInmuebles
              },
              parametrosEnviados: datosMapeados,
              error: {
                message: err.message,
                code: err.code,
                name: err.name,
                stack: err.stack
              },
              timestamp: new Date().toISOString()
            }, 'Error detallado al ejecutar DP_EDITA_PERSONAL en Firebird');
            reject(err);
            return;
          }

            // El stored procedure retorna INTERNO
            let interno = 0;

          if (result && Array.isArray(result) && result.length > 0) {
            const row = result[0];
              interno = row.INTERNO !== undefined ? row.INTERNO : (row.interno !== undefined ? row.interno : 0);
          } else if (result && typeof result === 'object' && !Array.isArray(result)) {
              interno = result.INTERNO !== undefined ? result.INTERNO : (result.interno !== undefined ? result.interno : 0);
            } else {
              logger.warn({
                ...logContext,
                result
              }, 'DP_EDITA_PERSONAL retornó formato inesperado');
            }

            if (interno === 0) {
              // Analizar posibles causas
              const posiblesCausas = [];
              
              // Validar formato de CURP
              if (!afiliado.curp || afiliado.curp.length !== 18) {
                posiblesCausas.push(`CURP inválido: "${afiliado.curp || 'vacío'}" (debe tener 18 caracteres)`);
              }
              
              // Validar formato de RFC
              if (!afiliado.rfc || (afiliado.rfc.length !== 12 && afiliado.rfc.length !== 13)) {
                posiblesCausas.push(`RFC inválido: "${afiliado.rfc || 'vacío'}" (debe tener 12 o 13 caracteres)`);
              }
              
              // Validar NSS
              if (!afiliado.numeroSeguroSocial || afiliado.numeroSeguroSocial === '0') {
                posiblesCausas.push(`NSS inválido: "${afiliado.numeroSeguroSocial || 'vacío'}"`);
              }
              
              // Validar fechas
              if (!afiliado.fechaNacimiento) {
                posiblesCausas.push('Fecha de nacimiento faltante');
              }
              
              // Validar nombres
              if (!afiliado.nombre || !afiliado.apellidoPaterno) {
                posiblesCausas.push('Nombre o apellido paterno faltante');
              }
              
              const mensajeError = posiblesCausas.length > 0
                ? `DP_EDITA_PERSONAL retornó INTERNO = 0. Posibles causas: ${posiblesCausas.join('; ')}`
                : 'DP_EDITA_PERSONAL retornó INTERNO = 0 - Datos enviados no cumplen validaciones de Firebird o registro duplicado';
              
              logger.error({
                operation: 'ejecutarDPEditaPersonal',
                step: 'internoCero',
                afiliadoId: afiliado.id,
                datosAfiliado: {
                  id: afiliado.id,
                  folio: afiliado.folio,
                  nombre: afiliado.nombre,
                  apellidoPaterno: afiliado.apellidoPaterno,
                  apellidoMaterno: afiliado.apellidoMaterno,
                  curp: afiliado.curp,
                  rfc: afiliado.rfc,
                  numeroSeguroSocial: afiliado.numeroSeguroSocial,
                  fechaNacimiento: afiliado.fechaNacimiento,
                  fechaAlta: afiliado.fechaAlta,
                  nacionalidad: afiliado.nacionalidad,
                  estadoCivilId: afiliado.estadoCivilId
                },
                parametrosEnviados: datosMapeados,
                resultadoCompleto: result,
                posiblesCausas,
                timestamp: new Date().toISOString()
              }, mensajeError);
              
              reject(new Error(mensajeError));
              return;
            }

            logger.info({
              ...logContext,
              interno
            }, 'DP_EDITA_PERSONAL ejecutado exitosamente');

            resolve(interno);
          });
        } catch (error: any) {
          logger.error({
            operation: 'ejecutarDPEditaPersonal',
            step: 'errorInesperado',
            afiliadoId: afiliado.id,
            datosAfiliado: {
              id: afiliado.id,
              folio: afiliado.folio,
              nombre: afiliado.nombre,
              apellidoPaterno: afiliado.apellidoPaterno,
              apellidoMaterno: afiliado.apellidoMaterno,
              curp: afiliado.curp,
              rfc: afiliado.rfc,
              numeroSeguroSocial: afiliado.numeroSeguroSocial
            },
            parametrosEnviados: datosMapeados,
            error: {
              message: error.message,
              stack: error.stack,
              name: error.name,
              code: error.code
            },
            timestamp: new Date().toISOString()
          }, 'Error detallado inesperado al ejecutar DP_EDITA_PERSONAL');
          reject(error);
        }
      });
    });
  } catch (error: any) {
    logger.error({
      operation: 'ejecutarDPEditaPersonal',
      step: 'errorGeneral',
      afiliadoId: afiliado.id,
      datosAfiliado: {
        id: afiliado.id,
        folio: afiliado.folio,
        nombre: afiliado.nombre,
        apellidoPaterno: afiliado.apellidoPaterno,
        apellidoMaterno: afiliado.apellidoMaterno,
        curp: afiliado.curp,
        rfc: afiliado.rfc,
        numeroSeguroSocial: afiliado.numeroSeguroSocial,
        fechaNacimiento: afiliado.fechaNacimiento,
        fechaAlta: afiliado.fechaAlta,
        nacionalidad: afiliado.nacionalidad,
        estadoCivilId: afiliado.estadoCivilId
      },
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code
      },
      timestamp: new Date().toISOString()
    }, 'Error detallado general al ejecutar DP_EDITA_PERSONAL');
    throw error;
  }
}

/**
 * Busca el INTERNO de un afiliado en Firebird por CURP o RFC
 * Esta función previene errores de duplicados al buscar registros existentes
 * antes de intentar crear nuevos con DP_EDITA_PERSONAL
 * 
 * @param curp CURP del afiliado
 * @param rfc RFC del afiliado
 * @returns INTERNO si encuentra el registro, null si no encuentra o hay error
 */
async function buscarInternoEnFirebird(
  curp: string | null,
  rfc: string | null
): Promise<number | null> {
  const logContext = {
    operation: 'buscarInternoEnFirebird',
    curp,
    rfc
  };

  try {
    // Validar que al menos uno de los parámetros esté presente
    if (!curp && !rfc) {
      logger.warn(logContext, 'No se proporcionó CURP ni RFC para buscar en Firebird');
      return null;
    }

    logger.info(logContext, 'Buscando INTERNO en tabla personal de Firebird');

    return await executeSerializedQuery((db) => {
      return new Promise<number | null>((resolve, reject) => {
        try {
          // Construir query dinámicamente según los parámetros disponibles
          let sql: string;
          let params: any[];

          if (curp && rfc) {
            sql = 'SELECT FIRST 1 INTERNO FROM PERSONAL WHERE CURP = ? OR RFC = ?';
            params = [curp, rfc];
          } else if (curp) {
            sql = 'SELECT FIRST 1 INTERNO FROM PERSONAL WHERE CURP = ?';
            params = [curp];
          } else {
            sql = 'SELECT FIRST 1 INTERNO FROM PERSONAL WHERE RFC = ?';
            params = [rfc];
          }

          logger.debug({
            ...logContext,
            sql,
            parametersCount: params.length
          }, 'Ejecutando búsqueda en Firebird');

          // Timeout de 10 segundos para búsqueda rápida
          const timeoutId = setTimeout(() => {
            reject(new Error('Timeout de búsqueda en Firebird (10s)'));
          }, 10000);

          const queryStart = Date.now();

          db.query(sql, params, (err: any, result: any) => {
            clearTimeout(timeoutId);
            const queryTime = Date.now() - queryStart;

            if (err) {
              logger.error({
                ...logContext,
                error: {
                  message: err.message,
                  code: err.code,
                  name: err.name
                },
                queryTimeMs: queryTime
              }, 'Error al buscar INTERNO en Firebird');
              resolve(null); // No lanzar error, retornar null para continuar flujo
              return;
            }

            // Procesar resultado
            let interno: number | null = null;

            if (result && Array.isArray(result) && result.length > 0) {
              const row = result[0];
              interno = row.INTERNO !== undefined ? row.INTERNO : (row.interno !== undefined ? row.interno : null);
            } else if (result && typeof result === 'object' && !Array.isArray(result)) {
              interno = result.INTERNO !== undefined ? result.INTERNO : (result.interno !== undefined ? result.interno : null);
            }

            if (interno && interno > 0) {
              logger.info({
                ...logContext,
                interno,
                queryTimeMs: queryTime
              }, `INTERNO encontrado en Firebird: ${interno}`);
            } else {
              logger.info({
                ...logContext,
                queryTimeMs: queryTime
              }, 'INTERNO no encontrado en Firebird');
            }

            resolve(interno);
          });
        } catch (error: any) {
          logger.error({
            ...logContext,
            error: {
              message: error.message,
              stack: error.stack,
              name: error.name
            }
          }, 'Error inesperado al buscar INTERNO en Firebird');
          resolve(null); // No lanzar error, retornar null para continuar flujo
        }
      });
    });
  } catch (error: any) {
    logger.error({
      ...logContext,
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      }
    }, 'Error general al buscar INTERNO en Firebird');
    return null; // Failsafe: si hay error, continuar con flujo normal
  }
}

/**
 * Obtiene el INTERNO para preview (sin ejecutar)
 * Retorna el interno si existe, o el log de ejecución si necesita crear uno
 */
export async function obtenerInternoParaPreview(
  afiliadoId: number
): Promise<{ interno: number | null; logDPEditaPersonal: LogEjecucionDPEditaPersonal | null }> {
  const logContext = {
    operation: 'obtenerInternoParaPreview',
    afiliadoId
  };

  try {
    // 1. Buscar interno en tabla Afiliado (SQL Server)
    const afiliado = await getAfiliadoById(afiliadoId);
    if (afiliado && afiliado.interno && afiliado.interno > 0) {
      logger.debug({ ...logContext, interno: afiliado.interno }, 'Interno encontrado en tabla Afiliado');
      return { interno: afiliado.interno, logDPEditaPersonal: null };
    }

    // 2. Si no existe o es 0, generar log de ejecución sin ejecutar
    logger.info(logContext, 'Interno no encontrado en Afiliado, generando log de DP_EDITA_PERSONAL para preview');
    
    if (!afiliado) {
      logger.warn(logContext, 'Afiliado no encontrado');
      const logError: LogEjecucionDPEditaPersonal = {
        afiliadoId,
        datosPreparados: null,
        sqlQuery: null,
        parametros: null,
        comandoEjecutable: null,
        validaciones: {
          datosAfiliado: { valido: false, mensaje: 'Afiliado no encontrado' },
          camposRequeridos: { valido: false }
        },
        errores: ['Afiliado no encontrado'],
        listoParaEjecutar: false
      };
      return { interno: null, logDPEditaPersonal: logError };
    }

    const log = await prepararLogEjecucionDPEditaPersonal(afiliado);
    return { interno: null, logDPEditaPersonal: log };
  } catch (error: any) {
    logger.error({
      ...logContext,
      error: error.message,
      stack: error.stack
    }, 'Error al obtener INTERNO para preview');
    const logError: LogEjecucionDPEditaPersonal = {
      afiliadoId,
      datosPreparados: null,
      sqlQuery: null,
      parametros: null,
      comandoEjecutable: null,
      validaciones: {
        datosAfiliado: { valido: false },
        camposRequeridos: { valido: false }
      },
      errores: [`Error inesperado: ${error.message}`],
      listoParaEjecutar: false
    };
    return { interno: null, logDPEditaPersonal: logError };
  }
}

/**
 * Obtiene el código de movimiento (AL, BA, LI, LT, CS, LB) desde tipoMovimientoId
 */
export async function obtenerCodigoMovimiento(tipoMovimientoId: number): Promise<string | null> {
  try {
    const tipoMovimiento = await getTipoMovimientoById(tipoMovimientoId);
    if (!tipoMovimiento || !tipoMovimiento.abreviatura) {
      logger.warn({ tipoMovimientoId }, 'No se encontró abreviatura para tipoMovimientoId');
      return null;
    }
    return tipoMovimiento.abreviatura.toUpperCase();
  } catch (error: any) {
    logger.error({ tipoMovimientoId, error: error.message }, 'Error al obtener código de movimiento');
    return null;
  }
}

/**
 * Obtiene datos del movimiento según su tipo
 * AL, CS: datos de AfiliadoOrg
 * BA, LI, LT, LB: datos de Movimiento (aunque según el plan, estos también vienen de Movimiento y TipoMovimiento)
 */
export async function obtenerDatosMovimiento(
  movimiento: Movimiento,
  codigoMovimiento: string
): Promise<Partial<DatosMovimientoFirebird> | null> {
  try {
    const esAltaOCambioSueldo = codigoMovimiento === 'AL' || codigoMovimiento === 'CS';
    
    if (esAltaOCambioSueldo) {
      // Obtener datos de AfiliadoOrg
      const afiliadosOrg = await getAfiliadoOrgByAfiliadoId(movimiento.afiliadoId);
      if (!afiliadosOrg || afiliadosOrg.length === 0) {
        logger.warn({ afiliadoId: movimiento.afiliadoId }, 'No se encontró AfiliadoOrg para AL/CS');
        return null;
      }
      
      const afiliadoOrg = afiliadosOrg[0]; // Tomar el primero
      
      return {
        sueldo: afiliadoOrg.sueldo || 0,
        q: afiliadoOrg.quinquenios || 0,
        org0: afiliadoOrg.claveOrganica0 || '',
        org1: afiliadoOrg.claveOrganica1 || '',
        org2: afiliadoOrg.claveOrganica2 || null,
        org3: afiliadoOrg.claveOrganica3 || null,
        bc: afiliadoOrg.bc || 'C',
        porc: afiliadoOrg.porcentaje || 0
      };
    } else {
      // BA, LI, LT, LB: datos de Movimiento
      // Según el plan, estos también necesitan datos de AfiliadoOrg para obtener orgánicas y otros datos
      const afiliadosOrg = await getAfiliadoOrgByAfiliadoId(movimiento.afiliadoId);
      if (!afiliadosOrg || afiliadosOrg.length === 0) {
        logger.warn({ afiliadoId: movimiento.afiliadoId }, 'No se encontró AfiliadoOrg para BA/LI/LT/LB');
        return null;
      }
      
      const afiliadoOrg = afiliadosOrg[0];
      
      return {
        sueldo: afiliadoOrg.sueldo || 0,
        q: afiliadoOrg.quinquenios || 0,
        org0: afiliadoOrg.claveOrganica0 || '',
        org1: afiliadoOrg.claveOrganica1 || '',
        org2: afiliadoOrg.claveOrganica2 || null,
        org3: afiliadoOrg.claveOrganica3 || null,
        bc: afiliadoOrg.bc || 'C',
        porc: afiliadoOrg.porcentaje || 0
      };
    }
  } catch (error: any) {
    logger.error({ movimientoId: movimiento.id, error: error.message }, 'Error al obtener datos del movimiento');
    return null;
  }
}


/**
 * Obtiene y formatea el PERIODO desde BitacoraAfectacionOrg
 * Formato: '1925' (quincena 2 dígitos + año 2 últimos dígitos)
 */
export async function obtenerPeriodo(org0: string, org1: string): Promise<string | null> {
  try {
    const p = await getPool();
    const result = await p.request()
      .input('org0', sql.VarChar(30), org0)
      .input('org1', sql.VarChar(30), org1)
      .query(`
        SELECT TOP 1 Quincena, Anio
        FROM afec.BitacoraAfectacionOrg
        WHERE Org0 = @org0
          AND Org1 = @org1
          AND Accion = 'APLICAR'
          AND Entidad = 'AFILIADOS'
        ORDER BY Anio DESC, Quincena DESC, CreatedAt DESC
      `);

    if (result.recordset.length === 0) {
      logger.warn({ org0, org1 }, 'No se encontró PERIODO en BitacoraAfectacionOrg');
      return null;
    }

    const registro = result.recordset[0];
    const quincena = registro.Quincena;
    const anio = registro.Anio;

    // Formatear: quincena (2 dígitos) + año (2 últimos dígitos)
    const quincenaStr = String(quincena).padStart(2, '0');
    const anioStr = String(anio).slice(-2);
    const periodo = quincenaStr + anioStr;

    logger.debug({ org0, org1, quincena, anio, periodo }, 'PERIODO obtenido');
    return periodo;
  } catch (error: any) {
    logger.error({ org0, org1, error: error.message }, 'Error al obtener PERIODO');
    return null;
  }
}

/**
 * Formatea fecha a formato mm/dd/yy
 */
export function formatearFecha(fecha: string | null | undefined): string | null {
  if (!fecha || fecha === 'null' || fecha === 'undefined') {
    logger.debug({ fecha }, 'Fecha es null, undefined o string vacío');
    return null;
  }

  try {
    // Si la fecha ya está en formato ISO (YYYY-MM-DD), parsearla directamente
    let date: Date;
    
    if (typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      // Formato ISO: YYYY-MM-DD
      const [year, month, day] = fecha.split('-').map(Number);
      date = new Date(year, month - 1, day);
      logger.debug({ fecha, parsed: { year, month, day } }, 'Fecha parseada desde formato ISO');
    } else if (typeof fecha === 'string' && fecha.includes('T')) {
      // Formato ISO con tiempo: YYYY-MM-DDTHH:mm:ss
      date = new Date(fecha);
      logger.debug({ fecha }, 'Fecha parseada desde formato ISO con tiempo');
    } else {
      // Intentar parsear con Date constructor
      date = new Date(fecha);
      logger.debug({ fecha, parsed: date.toISOString() }, 'Fecha parseada con Date constructor');
    }

    // Validar que la fecha sea válida
    if (isNaN(date.getTime())) {
      logger.error({ fecha, dateString: date.toString() }, 'Fecha inválida después del parseo');
      return null;
    }

    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const dia = String(date.getDate()).padStart(2, '0');
    const anio = String(date.getFullYear()).slice(-2);
    const fechaFormateada = `${mes}/${dia}/${anio}`;
    logger.debug({ fecha, fechaFormateada }, 'Fecha formateada exitosamente');
    return fechaFormateada;
  } catch (error: any) {
    logger.error({ fecha, error: error.message, stack: error.stack }, 'Error al formatear fecha');
    return null;
  }
}

// Constantes para detección de deadlock en Firebird
const DEADLOCK_ERROR_CODE = 335544336;
const DEADLOCK_SQL_CODE = -913;

// Parámetros de configuración para retry
const MAX_RETRIES_TIMEOUT = 1;        // 1 retry para timeouts (2 intentos totales)
const MAX_RETRIES_DEADLOCK = 3;       // 3 retries para deadlocks (4 intentos totales)
const BASE_TIMEOUT_MS = 60000;        // 60 segundos de timeout
const BASE_BACKOFF_MS = 1000;         // Backoff base: 1 segundo
const MAX_JITTER_MS = 500;            // Jitter máximo: 500ms
const MIN_JITTER_MS = 100;            // Jitter mínimo: 100ms

/**
 * Detecta si un error es un deadlock de Firebird
 * Los deadlocks ocurren cuando hay transacciones concurrentes actualizando el mismo registro
 */
function isDeadlockError(error: any): boolean {
  const errorMessage = (error?.message || '').toLowerCase();
  const errorCode = error?.code;
  const sqlCode = error?.sqlCode;
  
  return (
    errorCode === DEADLOCK_ERROR_CODE ||
    sqlCode === DEADLOCK_SQL_CODE ||
    errorMessage.includes('deadlock') ||
    errorMessage.includes('concurrent update') ||
    errorMessage.includes('update conflicts') ||
    errorMessage.includes('lock conflict')
  );
}

/**
 * Genera un jitter aleatorio para reducir colisiones entre transacciones concurrentes
 */
function getRandomJitter(): number {
  return Math.floor(Math.random() * (MAX_JITTER_MS - MIN_JITTER_MS + 1)) + MIN_JITTER_MS;
}

/**
 * Ejecuta el stored procedure DP_EDITA_ENTIDAD en Firebird con retry automático
 * En Firebird, los stored procedures que retornan valores se pueden llamar como funciones en SELECT
 * 
 * Maneja específicamente:
 * - Timeouts: Reintentos con backoff lineal
 * - Deadlocks: Reintentos con backoff exponencial y jitter aleatorio
 */
export async function ejecutarDPEditaEntidad(
  datos: DatosMovimientoFirebird
): Promise<{ cveError: number; nomError: string | null; retryAttempts?: number; executionTimeMs?: number }> {
  const timeoutMs = BASE_TIMEOUT_MS;
  let lastError: any;
  let deadlockRetries = 0;
  let timeoutRetries = 0;
  let totalAttempts = 0;
  
  // Calcular máximo de intentos (el mayor entre timeout y deadlock retries)
  const maxTotalAttempts = Math.max(MAX_RETRIES_TIMEOUT, MAX_RETRIES_DEADLOCK) + 1;
  
  for (let attempt = 0; attempt < maxTotalAttempts; attempt++) {
    totalAttempts = attempt + 1;
    
    try {
      const startTime = Date.now();
      
      // Agregar jitter aleatorio antes de cada intento para reducir colisiones
      if (attempt > 0) {
        const jitter = getRandomJitter();
        
        // Determinar tipo de backoff según el último error
        let backoffMs: number;
        let backoffType: string;
        
        if (lastError && isDeadlockError(lastError)) {
          // Backoff exponencial para deadlocks: 1s, 2s, 4s, 8s...
          backoffMs = BASE_BACKOFF_MS * Math.pow(2, deadlockRetries - 1) + jitter;
          backoffType = 'deadlock (exponencial)';
        } else {
          // Backoff lineal para timeouts: 2s, 4s, 6s...
          backoffMs = 2000 * timeoutRetries + jitter;
          backoffType = 'timeout (lineal)';
        }
        
        logger.info({
          interno: datos.interno,
          movimiento: datos.movimiento,
          attempt: totalAttempts,
          deadlockRetries,
          timeoutRetries,
          backoffMs,
          jitterMs: jitter,
          backoffType
        }, `Reintentando DP_EDITA_ENTIDAD después de ${backoffMs}ms (${backoffType})`);
        
        await new Promise(resolve => setTimeout(resolve, backoffMs));
      } else {
        // Primer intento: agregar solo jitter pequeño para evitar colisiones iniciales
        const initialJitter = getRandomJitter();
        if (initialJitter > 0) {
          await new Promise(resolve => setTimeout(resolve, initialJitter));
        }
      }
      
      const result = await executeSerializedQuery((db) => {
        return new Promise<{ cveError: number; nomError: string | null }>((resolve, reject) => {
          try {
            // En Firebird, los stored procedures que retornan valores se llaman como funciones en SELECT
            // Nuevo orden: INTERNO, ORG0, ORG1, ORG2, ORG3, SUELDO, OP, Q, RETROACTIVAS, PERIODO, MOVIMIENTO, FECHA, BC, PORC
            const sql = `
              SELECT CVE_ERROR, NOM_ERROR
              FROM DP_EDITA_ENTIDAD(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const params = [
              datos.interno, // INTERNO
              datos.org0, // ORG0
              datos.org1, // ORG1
              datos.org2 || '', // ORG2
              datos.org3 || '', // ORG3
              datos.sueldo, // SUELDO
              datos.op, // OP (siempre 0)
              datos.q, // Q (quinquenio)
              datos.retroactivas, // RETROACTIVAS (siempre 0)
              datos.periodo, // PERIODO
              datos.movimiento, // MOVIMIENTO
              datos.fecha, // FECHA
              datos.bc, // BC (Base/Confianza)
              datos.porc // PORC (Porcentaje)
            ];

            logger.debug({
              interno: datos.interno,
              movimiento: datos.movimiento,
              periodo: datos.periodo,
              org0: datos.org0,
              org1: datos.org1,
              attempt: totalAttempts,
              timeoutMs
            }, 'Ejecutando DP_EDITA_ENTIDAD en Firebird');

            const timeoutId = setTimeout(() => {
              reject(new Error(`Tiempo de espera agotado en consulta Firebird (${timeoutMs}ms)`));
            }, timeoutMs);

            db.query(sql, params, (err: any, result: any) => {
              clearTimeout(timeoutId);

              if (err) {
                // Agregar información adicional para diagnóstico
                const enhancedError = Object.assign(new Error(err.message), {
                  code: err.code,
                  sqlCode: err.sqlCode,
                  engineCode: err.engineCode,
                  engineMessage: err.engineMessage,
                  name: err.name,
                  stack: err.stack
                });
                
                logger.error({
                  error: err.message,
                  movimiento: datos.movimiento,
                  periodo: datos.periodo,
                  errorCode: err.code,
                  sqlCode: err.sqlCode,
                  engineCode: err.engineCode,
                  errorName: err.name,
                  isDeadlock: isDeadlockError(err),
                  attempt: totalAttempts
                }, 'Error al ejecutar DP_EDITA_ENTIDAD');
                
                reject(enhancedError);
                return;
              }

              // El stored procedure retorna CVE_ERROR y NOM_ERROR
              let cveError = 0;
              let nomError: string | null = null;

              if (result && Array.isArray(result) && result.length > 0) {
                const row = result[0];
                cveError = row.CVE_ERROR !== undefined ? row.CVE_ERROR : (row.cve_error !== undefined ? row.cve_error : 0);
                nomError = row.NOM_ERROR !== undefined ? row.NOM_ERROR : (row.nom_error !== undefined ? row.nom_error : null);
              } else if (result && typeof result === 'object' && !Array.isArray(result)) {
                cveError = result.CVE_ERROR !== undefined ? result.CVE_ERROR : (result.cve_error !== undefined ? result.cve_error : 0);
                nomError = result.NOM_ERROR !== undefined ? result.NOM_ERROR : (result.nom_error !== undefined ? result.nom_error : null);
              } else {
                logger.warn({
                  movimiento: datos.movimiento,
                  periodo: datos.periodo,
                  result,
                  attempt: totalAttempts
                }, 'DP_EDITA_ENTIDAD retornó formato inesperado');
              }

              logger.info({
                movimiento: datos.movimiento,
                periodo: datos.periodo,
                cveError,
                nomError,
                attempt: totalAttempts
              }, 'DP_EDITA_ENTIDAD ejecutado');

              resolve({ cveError, nomError });
            });
          } catch (error: any) {
            logger.error({
              error: error.message,
              movimiento: datos.movimiento,
              stack: error.stack,
              attempt: totalAttempts
            }, 'Error al ejecutar DP_EDITA_ENTIDAD');
            reject(error);
          }
        });
      });
      
      const executionTimeMs = Date.now() - startTime;
      
      // Exitoso
      return {
        ...result,
        retryAttempts: attempt,
        executionTimeMs
      };
      
    } catch (error: any) {
      lastError = error;
      const isTimeout = error.message.includes('Tiempo de espera agotado');
      const isDeadlock = isDeadlockError(error);
      
      // Manejar deadlock
      if (isDeadlock) {
        deadlockRetries++;
        
        if (deadlockRetries <= MAX_RETRIES_DEADLOCK) {
          logger.warn({
            interno: datos.interno,
            movimiento: datos.movimiento,
            attempt: totalAttempts,
            deadlockRetries,
            maxDeadlockRetries: MAX_RETRIES_DEADLOCK,
            errorCode: error.code,
            sqlCode: error.sqlCode,
            error: error.message
          }, 'Deadlock detectado en DP_EDITA_ENTIDAD - se reintentará con backoff exponencial');
          continue;
        }
        
        // Se agotaron los reintentos de deadlock
        throw new Error(`Deadlock persistente en Firebird después de ${deadlockRetries} intento(s): ${error.message}. Puede haber transacciones concurrentes bloqueando el registro.`);
      }
      
      // Manejar timeout
      if (isTimeout) {
        timeoutRetries++;
        
        if (timeoutRetries <= MAX_RETRIES_TIMEOUT) {
          logger.warn({
            interno: datos.interno,
            movimiento: datos.movimiento,
            attempt: totalAttempts,
            timeoutRetries,
            maxTimeoutRetries: MAX_RETRIES_TIMEOUT,
            error: error.message
          }, 'Timeout en DP_EDITA_ENTIDAD - se reintentará');
          continue;
        }
        
        // Se agotaron los reintentos de timeout
        throw new Error(`Timeout en Firebird después de ${timeoutRetries} intento(s) (${timeoutMs}ms cada uno): ${error.message}`);
      }
      
      // Otro tipo de error - no reintentar
      throw error;
    }
  }
  
  // Si llegamos aquí, todos los intentos fallaron
  throw lastError;
}

/**
 * Prepara los datos y genera el log de ejecución para DP_EDITA_ENTIDAD sin ejecutarlo
 * Útil para pruebas y validación antes de ejecutar el stored procedure
 */
export async function prepararLogEjecucionDPEditaEntidad(
  movimiento: Movimiento,
  org0: string,
  org1: string
): Promise<LogEjecucionDPEditaEntidad> {
  const logContext = {
    movimientoId: movimiento.id,
    afiliadoId: movimiento.afiliadoId,
    tipoMovimientoId: movimiento.tipoMovimientoId,
    org0,
    org1
  };

  const log: LogEjecucionDPEditaEntidad = {
    movimientoId: movimiento.id,
    afiliadoId: movimiento.afiliadoId,
    tipoMovimientoId: movimiento.tipoMovimientoId,
    codigoMovimiento: null,
    datosPreparados: null,
    sqlQuery: null,
    parametros: null,
    validaciones: {
      codigoMovimiento: { valido: false },
      datosMovimiento: { valido: false },
      periodo: { valido: false },
      fecha: { valido: false },
      porcentaje: { valido: false },
      baseConfianza: { valido: false }
    },
    errores: [],
    listoParaEjecutar: false
  };

  try {
    // 1. Obtener código de movimiento
    const codigoMovimiento = await obtenerCodigoMovimiento(movimiento.tipoMovimientoId);
    if (!codigoMovimiento) {
      log.validaciones.codigoMovimiento = {
        valido: false,
        mensaje: 'No se pudo obtener código de movimiento'
      };
      log.errores.push('No se pudo obtener código de movimiento');
      return log;
    }
    log.codigoMovimiento = codigoMovimiento;
    log.validaciones.codigoMovimiento = { valido: true };

    // 2. Obtener datos del movimiento
    const datosParciales = await obtenerDatosMovimiento(movimiento, codigoMovimiento);
    if (!datosParciales) {
      log.validaciones.datosMovimiento = {
        valido: false,
        mensaje: 'No se pudieron obtener datos del movimiento'
      };
      log.errores.push('No se pudieron obtener datos del movimiento');
      return log;
    }
    log.validaciones.datosMovimiento = { valido: true };

    // 3. Obtener PERIODO
    const periodo = await obtenerPeriodo(org0, org1);
    if (!periodo) {
      log.validaciones.periodo = {
        valido: false,
        mensaje: 'No se pudo obtener PERIODO de BitacoraAfectacionOrg'
      };
      log.errores.push('No se pudo obtener PERIODO');
      return log;
    }
    log.validaciones.periodo = { valido: true, periodo };

    // 3. Obtener INTERNO
    const interno = await obtenerInterno(movimiento.afiliadoId);

    // 4. Formatear fecha - usar fecha del movimiento o createdAt como fallback
    logger.debug({ movimientoId: movimiento.id, fecha: movimiento.fecha, createdAt: movimiento.createdAt, tipoFecha: typeof movimiento.fecha }, 'Intentando formatear fecha');
    let fechaAFormatear = movimiento.fecha;
    
    // Si la fecha es null, usar createdAt como fallback
    if (!fechaAFormatear && movimiento.createdAt) {
      logger.debug({ movimientoId: movimiento.id }, 'Fecha es null, usando createdAt como fallback');
      fechaAFormatear = movimiento.createdAt;
    }
    
    const fecha = formatearFecha(fechaAFormatear);
    if (!fecha) {
      log.validaciones.fecha = {
        valido: false,
        mensaje: `No se pudo formatear fecha del movimiento. Fecha recibida: ${movimiento.fecha}, createdAt: ${movimiento.createdAt}`
      };
      log.errores.push(`No se pudo formatear fecha. Valor: ${movimiento.fecha}, createdAt: ${movimiento.createdAt}`);
      return log;
    }
    log.validaciones.fecha = { valido: true, fechaFormateada: fecha };

    // 5. Validar porcentaje
    const porc = datosParciales.porc ?? 0;
    if (porc < 60 || porc > 100) {
      log.validaciones.porcentaje = {
        valido: false,
        mensaje: `Porcentaje inválido: ${porc}. Debe estar entre 60 y 100`,
        valor: porc
      };
      log.errores.push(`Porcentaje inválido: ${porc}`);
      return log;
    }
    log.validaciones.porcentaje = { valido: true, valor: porc };

    // 6. Validar base/confianza
    const bc = datosParciales.bc ?? 'C';
    if (bc !== 'C' && bc !== 'B') {
      log.validaciones.baseConfianza = {
        valido: false,
        mensaje: `Base/Confianza inválido: ${bc}. Debe ser 'C' o 'B'`,
        valor: bc
      };
      log.errores.push(`Base/Confianza inválido: ${bc}`);
      return log;
    }
    log.validaciones.baseConfianza = { valido: true, valor: bc };

    // 7. Construir datos completos con nuevo formato
    const datosCompletos: DatosMovimientoFirebird = {
      interno,
      org0: datosParciales.org0 ?? '',
      org1: datosParciales.org1 ?? '',
      org2: datosParciales.org2 || null,
      org3: datosParciales.org3 || null,
      sueldo: datosParciales.sueldo ?? 0,
      op: 0, // Siempre 0
      q: datosParciales.q ?? 0,
      retroactivas: 0, // Siempre 0
      periodo,
      movimiento: codigoMovimiento,
      fecha,
      bc,
      porc
    };

    log.datosPreparados = datosCompletos;

    // 8. Generar SQL y parámetros con nuevo orden
    const sql = `
      SELECT CVE_ERROR, NOM_ERROR
      FROM DP_EDITA_ENTIDAD(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const parametros = [
      { nombre: 'INTERNO', valor: datosCompletos.interno, tipo: 'number' },
      { nombre: 'ORG0', valor: datosCompletos.org0, tipo: 'string' },
      { nombre: 'ORG1', valor: datosCompletos.org1, tipo: 'string' },
      { nombre: 'ORG2', valor: datosCompletos.org2 || '', tipo: 'string' },
      { nombre: 'ORG3', valor: datosCompletos.org3 || '', tipo: 'string' },
      { nombre: 'SUELDO', valor: datosCompletos.sueldo, tipo: 'number' },
      { nombre: 'OP', valor: datosCompletos.op, tipo: 'number' },
      { nombre: 'Q', valor: datosCompletos.q, tipo: 'number' },
      { nombre: 'RETROACTIVAS', valor: datosCompletos.retroactivas, tipo: 'number' },
      { nombre: 'PERIODO', valor: datosCompletos.periodo, tipo: 'string' },
      { nombre: 'MOVIMIENTO', valor: datosCompletos.movimiento, tipo: 'string' },
      { nombre: 'FECHA', valor: datosCompletos.fecha, tipo: 'string' },
      { nombre: 'BC', valor: datosCompletos.bc, tipo: 'string' },
      { nombre: 'PORC', valor: datosCompletos.porc, tipo: 'number' }
    ];

    log.sqlQuery = sql;
    log.parametros = parametros;
    log.listoParaEjecutar = true;

    return log;
  } catch (error: any) {
    log.errores.push(`Error inesperado: ${error.message}`);
    logger.error({
      ...logContext,
      error: error.message,
      stack: error.stack
    }, 'Error al preparar log de ejecución');
    return log;
  }
}

/**
 * Migra un movimiento a Firebird usando DP_EDITA_ENTIDAD
 */
export async function migrarMovimientoAFirebird(
  movimiento: Movimiento,
  org0: string,
  org1: string
): Promise<ResultadoMigracionFirebird> {
  const logContext = {
    movimientoId: movimiento.id,
    afiliadoId: movimiento.afiliadoId,
    tipoMovimientoId: movimiento.tipoMovimientoId,
    org0,
    org1
  };

  logger.info(logContext, 'Iniciando migración de movimiento a Firebird');

  let codigoMovimiento: string | null = null;

  try {
    // 1. Obtener código de movimiento
    try {
      codigoMovimiento = await obtenerCodigoMovimiento(movimiento.tipoMovimientoId);
    } catch (error: any) {
      logger.error({
        operation: 'migrarMovimientoAFirebird',
        step: 'obtenerCodigoMovimiento',
        movimientoId: movimiento.id,
        tipoMovimientoId: movimiento.tipoMovimientoId,
        afiliadoId: movimiento.afiliadoId,
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name,
          code: error.code
        },
        timestamp: new Date().toISOString()
      }, 'Error detallado al obtener código de movimiento');
      return {
        exito: false,
        cveError: -1,
        nomError: `Error al obtener código de movimiento: ${error.message}`,
        movimientoId: movimiento.id,
        tipoMovimientoId: movimiento.tipoMovimientoId,
        codigoMovimiento: null
      };
    }
    if (!codigoMovimiento) {
      logger.error({
        operation: 'migrarMovimientoAFirebird',
        step: 'obtenerCodigoMovimiento',
        movimientoId: movimiento.id,
        tipoMovimientoId: movimiento.tipoMovimientoId,
        afiliadoId: movimiento.afiliadoId,
        timestamp: new Date().toISOString()
      }, 'No se pudo obtener código de movimiento');
      return {
        exito: false,
        cveError: -1,
        nomError: 'No se pudo obtener código de movimiento',
        movimientoId: movimiento.id,
        tipoMovimientoId: movimiento.tipoMovimientoId,
        codigoMovimiento: null
      };
    }

    // 2. Obtener datos del movimiento
    let datosParciales;
    try {
      datosParciales = await obtenerDatosMovimiento(movimiento, codigoMovimiento);
    } catch (error: any) {
      logger.error({
        operation: 'migrarMovimientoAFirebird',
        step: 'obtenerDatosMovimiento',
        movimientoId: movimiento.id,
        afiliadoId: movimiento.afiliadoId,
        tipoMovimientoId: movimiento.tipoMovimientoId,
        codigoMovimiento,
        datosMovimiento: {
          id: movimiento.id,
          tipoMovimientoId: movimiento.tipoMovimientoId,
          fecha: movimiento.fecha,
          estatus: movimiento.estatus,
          observaciones: movimiento.observaciones
        },
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name,
          code: error.code
        },
        timestamp: new Date().toISOString()
      }, 'Error detallado al obtener datos del movimiento');
      return {
        exito: false,
        cveError: -1,
        nomError: `Error al obtener datos del movimiento: ${error.message}`,
        movimientoId: movimiento.id,
        tipoMovimientoId: movimiento.tipoMovimientoId,
        codigoMovimiento
      };
    }
    if (!datosParciales) {
      logger.error({
        operation: 'migrarMovimientoAFirebird',
        step: 'obtenerDatosMovimiento',
        movimientoId: movimiento.id,
        afiliadoId: movimiento.afiliadoId,
        tipoMovimientoId: movimiento.tipoMovimientoId,
        codigoMovimiento,
        datosMovimiento: {
          id: movimiento.id,
          tipoMovimientoId: movimiento.tipoMovimientoId,
          fecha: movimiento.fecha,
          estatus: movimiento.estatus
        },
        timestamp: new Date().toISOString()
      }, 'No se pudieron obtener datos del movimiento');
      return {
        exito: false,
        cveError: -1,
        nomError: 'No se pudieron obtener datos del movimiento',
        movimientoId: movimiento.id,
        tipoMovimientoId: movimiento.tipoMovimientoId,
        codigoMovimiento
      };
    }

    // 3. Obtener PERIODO
    let periodo;
    try {
      periodo = await obtenerPeriodo(org0, org1);
    } catch (error: any) {
      logger.error({
        operation: 'migrarMovimientoAFirebird',
        step: 'obtenerPeriodo',
        movimientoId: movimiento.id,
        afiliadoId: movimiento.afiliadoId,
        org0,
        org1,
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name,
          code: error.code
        },
        timestamp: new Date().toISOString()
      }, 'Error detallado al obtener PERIODO');
      return {
        exito: false,
        cveError: -1,
        nomError: `Error al obtener PERIODO: ${error.message}`,
        movimientoId: movimiento.id,
        tipoMovimientoId: movimiento.tipoMovimientoId,
        codigoMovimiento
      };
    }
    if (!periodo) {
      logger.error({
        operation: 'migrarMovimientoAFirebird',
        step: 'obtenerPeriodo',
        movimientoId: movimiento.id,
        afiliadoId: movimiento.afiliadoId,
        org0,
        org1,
        timestamp: new Date().toISOString()
      }, 'No se pudo obtener PERIODO');
      return {
        exito: false,
        cveError: -1,
        nomError: 'No se pudo obtener PERIODO de BitacoraAfectacionOrg',
        movimientoId: movimiento.id,
        tipoMovimientoId: movimiento.tipoMovimientoId,
        codigoMovimiento
      };
    }

    // 4. Obtener INTERNO
    let interno;
    try {
      interno = await obtenerInterno(movimiento.afiliadoId);
    } catch (error: any) {
      const afiliado = await getAfiliadoById(movimiento.afiliadoId).catch(() => null);
      logger.error({
        operation: 'migrarMovimientoAFirebird',
        step: 'obtenerInterno',
        movimientoId: movimiento.id,
        afiliadoId: movimiento.afiliadoId,
        datosAfiliado: afiliado ? {
          id: afiliado.id,
          folio: afiliado.folio,
          nombre: afiliado.nombre,
          apellidoPaterno: afiliado.apellidoPaterno,
          apellidoMaterno: afiliado.apellidoMaterno,
          curp: afiliado.curp,
          rfc: afiliado.rfc,
          numeroSeguroSocial: afiliado.numeroSeguroSocial,
          interno: afiliado.interno,
          fechaNacimiento: afiliado.fechaNacimiento,
          fechaAlta: afiliado.fechaAlta
        } : null,
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name,
          code: error.code
        },
        timestamp: new Date().toISOString()
      }, 'Error detallado al obtener INTERNO (puede incluir error de DP_EDITA_PERSONAL)');
      return {
        exito: false,
        cveError: -1,
        nomError: `Error al obtener INTERNO: ${error.message}`,
        movimientoId: movimiento.id,
        tipoMovimientoId: movimiento.tipoMovimientoId,
        codigoMovimiento
      };
    }

    // 4. Formatear fecha - usar fecha del movimiento o createdAt como fallback
    let fechaAFormatear = movimiento.fecha;
    
    // Si la fecha es null, usar createdAt como fallback
    if (!fechaAFormatear && movimiento.createdAt) {
      logger.debug(logContext, 'Fecha es null, usando createdAt como fallback');
      fechaAFormatear = movimiento.createdAt;
    }
    
    let fecha;
    try {
      fecha = formatearFecha(fechaAFormatear);
    } catch (error: any) {
      logger.error({
        operation: 'migrarMovimientoAFirebird',
        step: 'formatearFecha',
        movimientoId: movimiento.id,
        afiliadoId: movimiento.afiliadoId,
        fechaOriginal: fechaAFormatear,
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name
        },
        timestamp: new Date().toISOString()
      }, 'Error detallado al formatear fecha');
      return {
        exito: false,
        cveError: -1,
        nomError: `Error al formatear fecha: ${error.message}`,
        movimientoId: movimiento.id,
        tipoMovimientoId: movimiento.tipoMovimientoId,
        codigoMovimiento
      };
    }
    if (!fecha) {
      logger.error({
        operation: 'migrarMovimientoAFirebird',
        step: 'formatearFecha',
        movimientoId: movimiento.id,
        afiliadoId: movimiento.afiliadoId,
        fechaOriginal: fechaAFormatear,
        timestamp: new Date().toISOString()
      }, 'No se pudo formatear fecha');
      return {
        exito: false,
        cveError: -1,
        nomError: 'No se pudo formatear fecha del movimiento',
        movimientoId: movimiento.id,
        tipoMovimientoId: movimiento.tipoMovimientoId,
        codigoMovimiento
      };
    }

    // 5. Validar porcentaje (debe estar entre 60 y 100)
    const porc = datosParciales.porc ?? 0;
    if (porc < 60 || porc > 100) {
      logger.error({
        operation: 'migrarMovimientoAFirebird',
        step: 'validarPorcentaje',
        movimientoId: movimiento.id,
        afiliadoId: movimiento.afiliadoId,
        tipoMovimientoId: movimiento.tipoMovimientoId,
        codigoMovimiento,
        valorInvalido: porc,
        rangoEsperado: '60-100',
        timestamp: new Date().toISOString()
      }, 'Porcentaje fuera de rango válido');
      return {
        exito: false,
        cveError: -1,
        nomError: `Porcentaje inválido: ${porc}. Debe estar entre 60 y 100`,
        movimientoId: movimiento.id,
        tipoMovimientoId: movimiento.tipoMovimientoId,
        codigoMovimiento
      };
    }

    // 6. Validar base/confianza (debe ser 'C' o 'B')
    const bc = datosParciales.bc ?? 'C';
    if (bc !== 'C' && bc !== 'B') {
      logger.error({
        operation: 'migrarMovimientoAFirebird',
        step: 'validarBaseConfianza',
        movimientoId: movimiento.id,
        afiliadoId: movimiento.afiliadoId,
        tipoMovimientoId: movimiento.tipoMovimientoId,
        codigoMovimiento,
        valorInvalido: bc,
        valoresEsperados: ['C', 'B'],
        timestamp: new Date().toISOString()
      }, 'Base/Confianza inválido');
      return {
        exito: false,
        cveError: -1,
        nomError: `Base/Confianza inválido: ${bc}. Debe ser 'C' o 'B'`,
        movimientoId: movimiento.id,
        tipoMovimientoId: movimiento.tipoMovimientoId,
        codigoMovimiento
      };
    }

    // 7. Construir datos completos con nuevo formato
    const datosCompletos: DatosMovimientoFirebird = {
      interno,
      org0: datosParciales.org0 ?? '',
      org1: datosParciales.org1 ?? '',
      org2: datosParciales.org2 || null,
      org3: datosParciales.org3 || null,
      sueldo: datosParciales.sueldo ?? 0,
      op: 0, // Siempre 0
      q: datosParciales.q ?? 0,
      retroactivas: 0, // Siempre 0
      periodo,
      movimiento: codigoMovimiento,
      fecha,
      bc,
      porc
    };

    // 8. Ejecutar stored procedure
    let resultado;
    try {
      resultado = await ejecutarDPEditaEntidad(datosCompletos);
    } catch (error: any) {
      const afiliado = await getAfiliadoById(movimiento.afiliadoId).catch(() => null);
      logger.error({
        operation: 'migrarMovimientoAFirebird',
        step: 'ejecutarDPEditaEntidad',
        movimientoId: movimiento.id,
        afiliadoId: movimiento.afiliadoId,
        tipoMovimientoId: movimiento.tipoMovimientoId,
        codigoMovimiento,
        org0,
        org1,
        periodo,
        interno,
        fecha,
        datosEnviados: {
          interno: datosCompletos.interno,
          org0: datosCompletos.org0,
          org1: datosCompletos.org1,
          org2: datosCompletos.org2,
          org3: datosCompletos.org3,
          sueldo: datosCompletos.sueldo,
          op: datosCompletos.op,
          q: datosCompletos.q,
          retroactivas: datosCompletos.retroactivas,
          periodo: datosCompletos.periodo,
          movimiento: datosCompletos.movimiento,
          fecha: datosCompletos.fecha,
          bc: datosCompletos.bc,
          porc: datosCompletos.porc
        },
        datosAfiliado: afiliado ? {
          id: afiliado.id,
          folio: afiliado.folio,
          nombre: afiliado.nombre,
          curp: afiliado.curp,
          rfc: afiliado.rfc
        } : null,
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name,
          code: error.code
        },
        timestamp: new Date().toISOString()
      }, 'Error detallado al ejecutar DP_EDITA_ENTIDAD');
      return {
        exito: false,
        cveError: -1,
        nomError: `Error al ejecutar DP_EDITA_ENTIDAD: ${error.message}`,
        movimientoId: movimiento.id,
        tipoMovimientoId: movimiento.tipoMovimientoId,
        codigoMovimiento
      };
    }

    // 9. Validar respuesta
    if (resultado.cveError > 0) {
      // Detectar error 23: movimiento duplicado / servidor ya activo
      const esDuplicado = resultado.cveError === 23 || 
                          (resultado.nomError && resultado.nomError.toLowerCase().includes('ya está activo'));
      
      const afiliado = await getAfiliadoById(movimiento.afiliadoId).catch(() => null);
      
      if (esDuplicado) {
        logger.info({
          operation: 'migrarMovimientoAFirebird',
          step: 'movimientoDuplicadoTratadoComoExito',
          movimientoId: movimiento.id,
          afiliadoId: movimiento.afiliadoId,
          tipoMovimientoId: movimiento.tipoMovimientoId,
          codigoMovimiento,
          cveError: resultado.cveError,
          nomError: resultado.nomError,
          org0,
          org1,
          periodo,
          interno
        }, 'Movimiento duplicado detectado - Tratado como éxito (ya existe en Firebird)');
        
        // Retornar como ÉXITO porque el movimiento ya existe en Firebird
        return {
          exito: true,
          cveError: 0,
          nomError: null,
          movimientoId: movimiento.id,
          tipoMovimientoId: movimiento.tipoMovimientoId,
          codigoMovimiento,
          retryAttempts: resultado.retryAttempts || 0,
          executionTimeMs: resultado.executionTimeMs,
          sqlExecuted: `SELECT CVE_ERROR, NOM_ERROR FROM DP_EDITA_ENTIDAD(${datosCompletos.interno}, '${datosCompletos.org0}', '${datosCompletos.org1}', '${datosCompletos.org2 || ''}', '${datosCompletos.org3 || ''}', ${datosCompletos.sueldo}, ${datosCompletos.op}, ${datosCompletos.q}, ${datosCompletos.retroactivas}, '${datosCompletos.periodo}', '${datosCompletos.movimiento}', '${datosCompletos.fecha}', '${datosCompletos.bc}', ${datosCompletos.porc})`,
          parametersUsed: {
            interno: datosCompletos.interno,
            org0: datosCompletos.org0,
            org1: datosCompletos.org1,
            org2: datosCompletos.org2,
            org3: datosCompletos.org3,
            sueldo: datosCompletos.sueldo,
            op: datosCompletos.op,
            q: datosCompletos.q,
            retroactivas: datosCompletos.retroactivas,
            periodo: datosCompletos.periodo,
            movimiento: datosCompletos.movimiento,
            fecha: datosCompletos.fecha,
            bc: datosCompletos.bc,
            porc: datosCompletos.porc
          },
          mensajeAdicional: `Movimiento ya existe en Firebird (duplicado detectado - tratado como éxito)`
        };
      }
      
      logger.error({
        operation: 'migrarMovimientoAFirebird',
        step: 'validarRespuestaDPEditaEntidad',
        movimientoId: movimiento.id,
        afiliadoId: movimiento.afiliadoId,
        tipoMovimientoId: movimiento.tipoMovimientoId,
        codigoMovimiento,
        org0,
        org1,
        periodo,
        interno,
        fecha,
        datosEnviados: {
          interno: datosCompletos.interno,
          org0: datosCompletos.org0,
          org1: datosCompletos.org1,
          sueldo: datosCompletos.sueldo,
          q: datosCompletos.q,
          periodo: datosCompletos.periodo,
          movimiento: datosCompletos.movimiento,
          fecha: datosCompletos.fecha,
          bc: datosCompletos.bc,
          porc: datosCompletos.porc
        },
        datosAfiliado: afiliado ? {
          id: afiliado.id,
          folio: afiliado.folio,
          nombre: afiliado.nombre,
          curp: afiliado.curp,
          rfc: afiliado.rfc
        } : null,
        cveError: resultado.cveError,
        nomError: resultado.nomError,
        timestamp: new Date().toISOString()
      }, 'Error detallado: DP_EDITA_ENTIDAD retornó error');
      return {
        exito: false,
        cveError: resultado.cveError,
        nomError: resultado.nomError,
        movimientoId: movimiento.id,
        tipoMovimientoId: movimiento.tipoMovimientoId,
        codigoMovimiento,
        retryAttempts: resultado.retryAttempts || 0,
        executionTimeMs: resultado.executionTimeMs,
        sqlExecuted: `SELECT CVE_ERROR, NOM_ERROR FROM DP_EDITA_ENTIDAD(${datosCompletos.interno}, '${datosCompletos.org0}', '${datosCompletos.org1}', '${datosCompletos.org2 || ''}', '${datosCompletos.org3 || ''}', ${datosCompletos.sueldo}, ${datosCompletos.op}, ${datosCompletos.q}, ${datosCompletos.retroactivas}, '${datosCompletos.periodo}', '${datosCompletos.movimiento}', '${datosCompletos.fecha}', '${datosCompletos.bc}', ${datosCompletos.porc})`,
        parametersUsed: {
          interno: datosCompletos.interno,
          org0: datosCompletos.org0,
          org1: datosCompletos.org1,
          org2: datosCompletos.org2,
          org3: datosCompletos.org3,
          sueldo: datosCompletos.sueldo,
          op: datosCompletos.op,
          q: datosCompletos.q,
          retroactivas: datosCompletos.retroactivas,
          periodo: datosCompletos.periodo,
          movimiento: datosCompletos.movimiento,
          fecha: datosCompletos.fecha,
          bc: datosCompletos.bc,
          porc: datosCompletos.porc
        }
      };
    }

    logger.info(logContext, 'Movimiento migrado exitosamente a Firebird');
    return {
      exito: true,
      cveError: 0,
      nomError: null,
      movimientoId: movimiento.id,
      tipoMovimientoId: movimiento.tipoMovimientoId,
      codigoMovimiento,
      retryAttempts: resultado.retryAttempts || 0,
      executionTimeMs: resultado.executionTimeMs,
      sqlExecuted: `SELECT CVE_ERROR, NOM_ERROR FROM DP_EDITA_ENTIDAD(${datosCompletos.interno}, '${datosCompletos.org0}', '${datosCompletos.org1}', '${datosCompletos.org2 || ''}', '${datosCompletos.org3 || ''}', ${datosCompletos.sueldo}, ${datosCompletos.op}, ${datosCompletos.q}, ${datosCompletos.retroactivas}, '${datosCompletos.periodo}', '${datosCompletos.movimiento}', '${datosCompletos.fecha}', '${datosCompletos.bc}', ${datosCompletos.porc})`,
      parametersUsed: {
        interno: datosCompletos.interno,
        org0: datosCompletos.org0,
        org1: datosCompletos.org1,
        org2: datosCompletos.org2,
        org3: datosCompletos.org3,
        sueldo: datosCompletos.sueldo,
        op: datosCompletos.op,
        q: datosCompletos.q,
        retroactivas: datosCompletos.retroactivas,
        periodo: datosCompletos.periodo,
        movimiento: datosCompletos.movimiento,
        fecha: datosCompletos.fecha,
        bc: datosCompletos.bc,
        porc: datosCompletos.porc
      }
    };
  } catch (error: any) {
    const afiliado = await getAfiliadoById(movimiento.afiliadoId).catch(() => null);
    logger.error({
      operation: 'migrarMovimientoAFirebird',
      step: 'errorGeneral',
      movimientoId: movimiento.id,
      afiliadoId: movimiento.afiliadoId,
      tipoMovimientoId: movimiento.tipoMovimientoId,
      codigoMovimiento: codigoMovimiento || null,
      org0,
      org1,
      datosMovimiento: {
        id: movimiento.id,
        tipoMovimientoId: movimiento.tipoMovimientoId,
        fecha: movimiento.fecha,
        estatus: movimiento.estatus,
        observaciones: movimiento.observaciones
      },
      datosAfiliado: afiliado ? {
        id: afiliado.id,
        folio: afiliado.folio,
        nombre: afiliado.nombre,
        apellidoPaterno: afiliado.apellidoPaterno,
        apellidoMaterno: afiliado.apellidoMaterno,
        curp: afiliado.curp,
        rfc: afiliado.rfc,
        interno: afiliado.interno
      } : null,
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code
      },
      timestamp: new Date().toISOString()
    }, 'Error detallado inesperado al migrar movimiento a Firebird');
    return {
      exito: false,
      cveError: -1,
      nomError: `Error inesperado: ${error.message}`,
      movimientoId: movimiento.id,
      tipoMovimientoId: movimiento.tipoMovimientoId,
      codigoMovimiento: null
    };
  }
}

