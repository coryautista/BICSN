import { Database } from 'node-firebird';
import { AfiliadoPersonal } from '../../domain/entities/AfiliadoPersonal.js';
import { IAfiliadoPersonalRepository } from '../../domain/repositories/IAfiliadoPersonalRepository.js';
import { executeSerializedQuery, decodeFirebirdObject } from '../../../../db/firebird.js';
import pino from 'pino';

const logger = pino({
  name: 'afiliadoPersonal-repository',
  level: process.env.LOG_LEVEL || 'info'
});

/**
 * Firebird implementation of AfiliadoPersonalRepository
 */
export class AfiliadoPersonalRepository implements IAfiliadoPersonalRepository {
  constructor(private firebirdDb: Database) {}

  /**
   * Get employee roster by organic keys
   * Returns employees with their latest active ORG_PERSONAL record
   */
  /**
   * Get employee roster by organic keys
   * Returns employees with their latest active ORG_PERSONAL record
   */
  async obtenerPlantilla(claveOrganica0: string, claveOrganica1: string): Promise<AfiliadoPersonal[]> {
    const logContext = {
      operation: 'obtenerPlantilla',
      claveOrganica0,
      claveOrganica1
    };

    logger.debug(logContext, 'Iniciando consulta obtenerPlantilla');

    const sql = `
      SELECT
        p.INTERNO,
        p.CURP,
        p.RFC,
        p.NOEMPLEADO,
        p.NOMBRE,
        p.APELLIDO_PATERNO,
        p.APELLIDO_MATERNO,
        p.FECHA_NACIMIENTO,
        p.SEGURO_SOCIAL,
        p.CALLE_NUMERO,
        p.FRACCIONAMIENTO,
        p.CODIGO_POSTAL,
        p.TELEFONO,
        p.SEXO,
        p.ESTADO_CIVIL,
        p.LOCALIDAD,
        p.MUNICIPIO,
        p.ESTADO,
        p.PAIS,
        p.DEPENDIENTES,
        p.POSEE_INMUEBLES,
        p.FULLNAME,
        p.FECHA_CARTA,
        p.EMAIL,
        p.NACIONALIDAD,
        p.FECHA_ALTA,
        p.CELULAR,
        p.EXPEDIENTE,
        p.F_EXPEDIENTE,
        o.CLAVE_ORGANICA_0,
        o.CLAVE_ORGANICA_1,
        o.CLAVE_ORGANICA_2,
        o.CLAVE_ORGANICA_3,
        o.SUELDO,
        o.OTRAS_PRESTACIONES,
        o.QUINQUENIOS,
        o.ACTIVO,
        o.FECHA_MOV_ALT,
        o.ORGS1,
        o.ORGS2,
        o.ORGS3,
        o.ORGS,
        o.DSUELDO,
        o.DOTRAS_PRESTACIONES,
        o.DQUINQUENIOS,
        o.APLICAR,
        o.BC,
        o.PORCENTAJE
      FROM PERSONAL p
      INNER JOIN ORG_PERSONAL o
        ON o.INTERNO = p.INTERNO
       AND o.ACTIVO IN ('A', 'L')
       AND o.CLAVE_ORGANICA_0 = ?
       AND o.CLAVE_ORGANICA_1 = ?
       AND o.FECHA_MOV_ALT = (
             SELECT MAX(x.FECHA_MOV_ALT)
             FROM ORG_PERSONAL x
             WHERE x.INTERNO = p.INTERNO
               AND x.CLAVE_ORGANICA_0 = ?
               AND x.CLAVE_ORGANICA_1 = ?
           )
       AND o.ORGS = (
             SELECT MAX(x2.ORGS)
             FROM ORG_PERSONAL x2
             WHERE x2.INTERNO = p.INTERNO
               AND x2.CLAVE_ORGANICA_0 = ?
               AND x2.CLAVE_ORGANICA_1 = ?
               AND x2.FECHA_MOV_ALT = o.FECHA_MOV_ALT
           )
    `;

    const params = [claveOrganica0, claveOrganica1, claveOrganica0, claveOrganica1, claveOrganica0, claveOrganica1];

    logger.debug({ ...logContext, sql, params }, 'Ejecutando consulta SQL');

    return executeSerializedQuery((db) => {
      return new Promise<AfiliadoPersonal[]>((resolve, reject) => {
        // Validar que la conexión esté disponible
        if (!db || typeof db.query !== 'function') {
          logger.error(logContext, 'Conexión Firebird no disponible');
          reject(new Error('Firebird connection not available'));
          return;
        }

        // Timeout para prevenir consultas colgadas
        const timeoutId = setTimeout(() => {
          logger.error({ ...logContext, timeout: true }, 'Timeout en consulta Firebird');
          reject(new Error('Firebird query timeout'));
        }, 30000); // 30 segundos

        db.query(sql, params, (err: any, result: any) => {
          clearTimeout(timeoutId);

          if (err) {
            logger.error({ ...logContext, error: err.message, stack: err.stack }, 'Error en consulta Firebird');
            reject(err);
            return;
          }

          if (!result) {
            logger.warn(logContext, 'Consulta Firebird retornó resultado nulo');
            resolve([]);
            return;
          }

          try {
            // Validar que result sea un array
            const records = Array.isArray(result) ? result : [];
            logger.debug({ ...logContext, recordCount: records.length }, 'Registros obtenidos de Firebird');

            // Aplicar decodificación de caracteres especiales (WIN1252 -> UTF-8) antes de mapear
            const decodedRecords = records.map((row: any) => decodeFirebirdObject(row));
            
            const mappedRecords = decodedRecords.map((row: any) => this.mapRowToEntity(row));
            logger.info({ ...logContext, recordCount: mappedRecords.length }, 'Consulta obtenerPlantilla completada exitosamente');
            resolve(mappedRecords);
          } catch (mapError: any) {
            logger.error({ ...logContext, error: mapError.message, stack: mapError.stack }, 'Error al mapear registros');
            reject(new Error(`Error mapping records: ${mapError.message}`));
          }
        });
      });
    });
  }

  /**
   * Search employees in historical data
   * Searches by RFC, CURP, INTERNO, NOEMPLEADO, or FULLNAME
   * Returns employees with their latest ORG_PERSONAL record regardless of ACTIVO status
   */
  async busquedaHistorico(searchTerm?: string): Promise<AfiliadoPersonal[]> {
    const logContext = {
      operation: 'busquedaHistorico',
      searchTerm
    };

    logger.debug(logContext, 'Iniciando búsqueda histórica');

    let sql = `
      SELECT
        p.INTERNO,
        p.CURP,
        p.RFC,
        p.NOEMPLEADO,
        p.NOMBRE,
        p.APELLIDO_PATERNO,
        p.APELLIDO_MATERNO,
        p.FECHA_NACIMIENTO,
        p.SEGURO_SOCIAL,
        p.CALLE_NUMERO,
        p.FRACCIONAMIENTO,
        p.CODIGO_POSTAL,
        p.TELEFONO,
        p.SEXO,
        p.ESTADO_CIVIL,
        p.LOCALIDAD,
        p.MUNICIPIO,
        p.ESTADO,
        p.PAIS,
        p.DEPENDIENTES,
        p.POSEE_INMUEBLES,
        p.FULLNAME,
        p.FECHA_CARTA,
        p.EMAIL,
        p.NACIONALIDAD,
        p.FECHA_ALTA,
        p.CELULAR,
        p.EXPEDIENTE,
        p.F_EXPEDIENTE,
        o.CLAVE_ORGANICA_0,
        o.CLAVE_ORGANICA_1,
        o.CLAVE_ORGANICA_2,
        o.CLAVE_ORGANICA_3,
        o.SUELDO,
        o.OTRAS_PRESTACIONES,
        o.QUINQUENIOS,
        o.ACTIVO,
        o.FECHA_MOV_ALT,
        o.ORGS1,
        o.ORGS2,
        o.ORGS3,
        o.ORGS,
        o.DSUELDO,
        o.DOTRAS_PRESTACIONES,
        o.DQUINQUENIOS,
        o.APLICAR,
        o.BC,
        o.PORCENTAJE
      FROM PERSONAL p
      INNER JOIN ORG_PERSONAL o
        ON o.INTERNO = p.INTERNO
       AND o.FECHA_MOV_ALT = (
             SELECT MAX(x.FECHA_MOV_ALT)
             FROM ORG_PERSONAL x
             WHERE x.INTERNO = p.INTERNO
           )
       AND o.ORGS = (
             SELECT MAX(x2.ORGS)
             FROM ORG_PERSONAL x2
             WHERE x2.INTERNO = p.INTERNO
               AND x2.FECHA_MOV_ALT = o.FECHA_MOV_ALT
           )
    `;

    const params: any[] = [];

    if (searchTerm && searchTerm.trim()) {
      const searchValue = searchTerm.trim().toUpperCase();
      const escapedSearch = searchValue.replace(/'/g, "''");
      sql += `
        WHERE (UPPER(p.RFC) CONTAINING '${escapedSearch}'
            OR UPPER(p.CURP) CONTAINING '${escapedSearch}'
            OR UPPER(p.INTERNO) CONTAINING '${escapedSearch}'
            OR UPPER(p.NOEMPLEADO) CONTAINING '${escapedSearch}'
            OR UPPER(p.FULLNAME) CONTAINING '${escapedSearch}')
      `;
    }

    logger.debug({ ...logContext, sql, params }, 'Ejecutando consulta SQL');

    return executeSerializedQuery((db) => {
      return new Promise<AfiliadoPersonal[]>((resolve, reject) => {
        // Validar que la conexión esté disponible
        if (!db || typeof db.query !== 'function') {
          logger.error(logContext, 'Conexión Firebird no disponible');
          reject(new Error('Firebird connection not available'));
          return;
        }

        // Timeout para prevenir consultas colgadas
        const timeoutId = setTimeout(() => {
          logger.error({ ...logContext, timeout: true }, 'Timeout en consulta Firebird');
          reject(new Error('Firebird query timeout'));
        }, 30000); // 30 segundos

        db.query(sql, params, (err: any, result: any) => {
          clearTimeout(timeoutId);

          if (err) {
            logger.error({ ...logContext, error: err.message, stack: err.stack }, 'Error en consulta Firebird');
            reject(err);
            return;
          }

          if (!result) {
            logger.warn(logContext, 'Consulta Firebird retornó resultado nulo');
            resolve([]);
            return;
          }

          try {
            // Validar que result sea un array
            const records = Array.isArray(result) ? result : [];
            logger.debug({ ...logContext, recordCount: records.length }, 'Registros obtenidos de Firebird');

            // Aplicar decodificación de caracteres especiales (WIN1252 -> UTF-8) antes de mapear
            const decodedRecords = records.map((row: any) => decodeFirebirdObject(row));
            
            const mappedRecords = decodedRecords.map((row: any) => this.mapRowToEntity(row));
            logger.info({ ...logContext, recordCount: mappedRecords.length }, 'Búsqueda histórica completada exitosamente');
            resolve(mappedRecords);
          } catch (mapError: any) {
            logger.error({ ...logContext, error: mapError.message, stack: mapError.stack }, 'Error al mapear registros');
            reject(new Error(`Error mapping records: ${mapError.message}`));
          }
        });
      });
    });
  }

  /**
   * Map database row to AfiliadoPersonal entity
   */
  private mapRowToEntity(row: any): AfiliadoPersonal {
    return {
      INTERNO: row.INTERNO,
      CURP: row.CURP,
      RFC: row.RFC,
      NOEMPLEADO: row.NOEMPLEADO,
      NOMBRE: row.NOMBRE,
      APELLIDO_PATERNO: row.APELLIDO_PATERNO,
      APELLIDO_MATERNO: row.APELLIDO_MATERNO,
      FECHA_NACIMIENTO: row.FECHA_NACIMIENTO ? row.FECHA_NACIMIENTO.toISOString() : null,
      SEGURO_SOCIAL: row.SEGURO_SOCIAL,
      CALLE_NUMERO: row.CALLE_NUMERO,
      FRACCIONAMIENTO: row.FRACCIONAMIENTO,
      CODIGO_POSTAL: row.CODIGO_POSTAL,
      TELEFONO: row.TELEFONO,
      SEXO: row.SEXO,
      ESTADO_CIVIL: row.ESTADO_CIVIL,
      LOCALIDAD: row.LOCALIDAD,
      MUNICIPIO: row.MUNICIPIO,
      ESTADO: row.ESTADO,
      PAIS: row.PAIS,
      DEPENDIENTES: row.DEPENDIENTES,
      POSEE_INMUEBLES: row.POSEE_INMUEBLES,
      FULLNAME: row.FULLNAME,
      FECHA_CARTA: row.FECHA_CARTA ? row.FECHA_CARTA.toISOString() : null,
      EMAIL: row.EMAIL,
      NACIONALIDAD: row.NACIONALIDAD,
      FECHA_ALTA: row.FECHA_ALTA ? row.FECHA_ALTA.toISOString() : null,
      CELULAR: row.CELULAR,
      EXPEDIENTE: row.EXPEDIENTE,
      F_EXPEDIENTE: row.F_EXPEDIENTE ? row.F_EXPEDIENTE.toISOString() : null,
      CLAVE_ORGANICA_0: row.CLAVE_ORGANICA_0,
      CLAVE_ORGANICA_1: row.CLAVE_ORGANICA_1,
      CLAVE_ORGANICA_2: row.CLAVE_ORGANICA_2,
      CLAVE_ORGANICA_3: row.CLAVE_ORGANICA_3,
      SUELDO: row.SUELDO,
      OTRAS_PRESTACIONES: row.OTRAS_PRESTACIONES,
      QUINQUENIOS: row.QUINQUENIOS,
      ACTIVO: row.ACTIVO,
      FECHA_MOV_ALT: row.FECHA_MOV_ALT ? row.FECHA_MOV_ALT.toISOString() : null,
      ORGS1: row.ORGS1,
      ORGS2: row.ORGS2,
      ORGS3: row.ORGS3,
      ORGS: row.ORGS,
      DSUELDO: row.DSUELDO,
      DOTRAS_PRESTACIONES: row.DOTRAS_PRESTACIONES,
      DQUINQUENIOS: row.DQUINQUENIOS,
      APLICAR: row.APLICAR,
      BC: row.BC,
      PORCENTAJE: row.PORCENTAJE
    };
  }
}
