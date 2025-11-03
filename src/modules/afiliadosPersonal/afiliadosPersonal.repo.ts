import { getFirebirdDb } from '../../db/firebird.js';
import { ObtenerPlantillaResponse } from './afiliadosPersonal.schemas.js';

export async function obtenerPlantilla(claveOrganica0: string, claveOrganica1: string): Promise<ObtenerPlantillaResponse[]> {
  const db = getFirebirdDb();

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
       AND o.ACTIVO = 'A'
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

    db.query(sql, [claveOrganica0, claveOrganica1, claveOrganica0, claveOrganica1, claveOrganica0, claveOrganica1], (err: any, result: any) => {
      if (err) {
        reject(err);
        return;
      }

      const records = result.map((row: any) => ({
        INTERNO: row.INTERNO,
        CURP: row.CURP,
        RFC: row.RFC,
        NOEMPLEADO: row.NOEMPLEADO,
        NOMBRE: row.NOMBRE,
        APELLIDO_PATERNO: row.APELLIDO_PATERNO,
        APELLIDO_MATERNO: row.APELLIDO_MATERNO,
        FECHA_NACIMIENTO: row.FECHA_NACIMIENTO ? row.FECHA_NACIMIENTO.toISOString() : null,
        SEXO: row.SEXO,
        ESTADO_CIVIL: row.ESTADO_CIVIL,
        NACIONALIDAD: row.NACIONALIDAD,
        FECHA_ALTA: row.FECHA_ALTA ? row.FECHA_ALTA.toISOString() : null,
        CELULAR: row.CELULAR,
        EMAIL: row.EMAIL,
        CALLE_NUMERO: row.CALLE_NUMERO,
        FRACCIONAMIENTO: row.FRACCIONAMIENTO,
        CODIGO_POSTAL: row.CODIGO_POSTAL,
        LOCALIDAD: row.LOCALIDAD,
        MUNICIPIO: row.MUNICIPIO,
        ESTADO: row.ESTADO,
        PAIS: row.PAIS,
        DEPENDIENTES: row.DEPENDIENTES,
        POSEE_INMUEBLES: row.POSEE_INMUEBLES,
        FULLNAME: row.FULLNAME,
        FECHA_CARTA: row.FECHA_CARTA ? row.FECHA_CARTA.toISOString() : null,
        TELEFONO: row.TELEFONO,
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
      }));

      resolve(records);
    });
  });
}

export async function busquedaHistorico(searchTerm?: string): Promise<ObtenerPlantillaResponse[]> {
  const db = getFirebirdDb();

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

    const params: any[] = [];

    if (searchTerm && searchTerm.trim()) {
      const searchValue = searchTerm.trim().toUpperCase();
      sql += `
        WHERE (UPPER(p.RFC) CONTAINING '${searchValue.replace(/'/g, "''")}'
            OR UPPER(p.CURP) CONTAINING '${searchValue.replace(/'/g, "''")}'
            OR UPPER(p.INTERNO) CONTAINING '${searchValue.replace(/'/g, "''")}'
            OR UPPER(p.NOEMPLEADO) CONTAINING '${searchValue.replace(/'/g, "''")}'
            OR UPPER(p.FULLNAME) CONTAINING '${searchValue.replace(/'/g, "''")}')
      `;
    }

    db.query(sql, params, (err: any, result: any) => {
      if (err) {
        reject(err);
        return;
      }

      const records = result.map((row: any) => ({
        INTERNO: row.INTERNO,
        CURP: row.CURP,
        RFC: row.RFC,
        NOEMPLEADO: row.NOEMPLEADO,
        NOMBRE: row.NOMBRE,
        APELLIDO_PATERNO: row.APELLIDO_PATERNO,
        APELLIDO_MATERNO: row.APELLIDO_MATERNO,
        FECHA_NACIMIENTO: row.FECHA_NACIMIENTO ? row.FECHA_NACIMIENTO.toISOString() : null,
        SEXO: row.SEXO,
        ESTADO_CIVIL: row.ESTADO_CIVIL,
        NACIONALIDAD: row.NACIONALIDAD,
        FECHA_ALTA: row.FECHA_ALTA ? row.FECHA_ALTA.toISOString() : null,
        CELULAR: row.CELULAR,
        EMAIL: row.EMAIL,
        CALLE_NUMERO: row.CALLE_NUMERO,
        FRACCIONAMIENTO: row.FRACCIONAMIENTO,
        CODIGO_POSTAL: row.CODIGO_POSTAL,
        LOCALIDAD: row.LOCALIDAD,
        MUNICIPIO: row.MUNICIPIO,
        ESTADO: row.ESTADO,
        PAIS: row.PAIS,
        DEPENDIENTES: row.DEPENDIENTES,
        POSEE_INMUEBLES: row.POSEE_INMUEBLES,
        FULLNAME: row.FULLNAME,
        FECHA_CARTA: row.FECHA_CARTA ? row.FECHA_CARTA.toISOString() : null,
        TELEFONO: row.TELEFONO,
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
      }));

      resolve(records);
    });
  });
}