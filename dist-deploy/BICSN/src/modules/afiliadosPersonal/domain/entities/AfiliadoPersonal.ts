/**
 * AfiliadoPersonal Entity
 * Represents a combination of PERSONAL and ORG_PERSONAL data from Firebird
 */
export interface AfiliadoPersonal {
  // PERSONAL fields
  INTERNO: string;
  CURP: string | null;
  RFC: string | null;
  NOEMPLEADO: string | null;
  NOMBRE: string | null;
  APELLIDO_PATERNO: string | null;
  APELLIDO_MATERNO: string | null;
  FECHA_NACIMIENTO: string | null;
  SEGURO_SOCIAL: string | null;
  CALLE_NUMERO: string | null;
  FRACCIONAMIENTO: string | null;
  CODIGO_POSTAL: string | null;
  TELEFONO: string | null;
  SEXO: string | null;
  ESTADO_CIVIL: string | null;
  LOCALIDAD: string | null;
  MUNICIPIO: string | null;
  ESTADO: string | null;
  PAIS: string | null;
  DEPENDIENTES: number | null;
  POSEE_INMUEBLES: string | null;
  FULLNAME: string | null;
  FECHA_CARTA: string | null;
  EMAIL: string | null;
  NACIONALIDAD: string | null;
  FECHA_ALTA: string | null;
  CELULAR: string | null;
  EXPEDIENTE: string | null;
  F_EXPEDIENTE: string | null;

  // ORG_PERSONAL fields
  CLAVE_ORGANICA_0: string | null;
  CLAVE_ORGANICA_1: string | null;
  CLAVE_ORGANICA_2: string | null;
  CLAVE_ORGANICA_3: string | null;
  SUELDO: number | null;
  OTRAS_PRESTACIONES: number | null;
  QUINQUENIOS: number | null;
  ACTIVO: string | null;
  FECHA_MOV_ALT: string | null;
  ORGS1: string | null;
  ORGS2: string | null;
  ORGS3: string | null;
  ORGS: string | null;
  DSUELDO: number | null;
  DOTRAS_PRESTACIONES: number | null;
  DQUINQUENIOS: number | null;
  APLICAR: string | null;
  BC: number | null;
  PORCENTAJE: number | null;
}

/**
 * Filters for querying AfiliadoPersonal
 */
export interface AfiliadoPersonalFilters {
  claveOrganica0?: string;
  claveOrganica1?: string;
  searchTerm?: string;
}
