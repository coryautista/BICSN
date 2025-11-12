import { Database } from 'node-firebird';
import { AfiliadoPersonal } from '../../domain/entities/AfiliadoPersonal.js';
import { IAfiliadoPersonalRepository } from '../../domain/repositories/IAfiliadoPersonalRepository.js';

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
    console.log('🔍 [DEBUG] Iniciando consulta obtenerPlantilla con parámetros:', { claveOrganica0, claveOrganica1 });
    return new Promise((resolve, reject) => {
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

      console.log('🔍 [DEBUG] SQL Query:', sql);
      console.log('🔍 [DEBUG] SQL Parameters:', [claveOrganica0, claveOrganica1, claveOrganica0, claveOrganica1, claveOrganica0, claveOrganica1]);

      this.firebirdDb.query(
        sql,
        [claveOrganica0, claveOrganica1, claveOrganica0, claveOrganica1, claveOrganica0, claveOrganica1],
        (err: any, result: any) => {
          console.log('🔍 [DEBUG] Firebird query callback ejecutado');
          if (err) {
            console.error('🔍 [DEBUG] Error en consulta Firebird:', err);
            reject(err);
            return;
          }

          console.log('🔍 [DEBUG] Resultado de consulta:', result ? result.length : 'undefined', 'registros');
          const records = result.map((row: any) => this.mapRowToEntity(row));
          console.log('🔍 [DEBUG] Registros mapeados:', records.length);
          resolve(records);
        }
      );
    });
  }

  /**
   * Search employees in historical data
   * Searches by RFC, CURP, INTERNO, NOEMPLEADO, or FULLNAME
   * Returns employees with their latest ORG_PERSONAL record regardless of ACTIVO status
   */
  async busquedaHistorico(searchTerm?: string): Promise<AfiliadoPersonal[]> {
    return new Promise((resolve, reject) => {
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

      this.firebirdDb.query(sql, [], (err: any, result: any) => {
        if (err) {
          reject(err);
          return;
        }

        const records = result.map((row: any) => this.mapRowToEntity(row));
        resolve(records);
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
