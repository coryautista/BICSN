import { DomainError } from '../../../utils/errors.js';

/**
 * Error base para operaciones del módulo orgPersonal
 */
export class OrgPersonalError extends DomainError {
  constructor(message: string, code: string, statusCode: number = 500) {
    super(message, code, statusCode);
  }
}

/**
 * Error cuando un registro orgPersonal no es encontrado por interno
 */
export class OrgPersonalNotFoundError extends OrgPersonalError {
  constructor(interno: number) {
    super(
      `Registro orgPersonal con interno ${interno} no encontrado`,
      'ORG_PERSONAL_NOT_FOUND',
      404
    );
  }
}

/**
 * Error cuando no se encuentra un registro por CURP/RFC/Nombre
 */
export class OrgPersonalSearchNotFoundError extends OrgPersonalError {
  constructor(searchTerm: string, searchType: 'CURP' | 'RFC' | 'NOMBRE' = 'CURP') {
    const typeLabel = searchType === 'CURP' ? 'CURP' : searchType === 'RFC' ? 'RFC' : 'nombre';
    super(
      `No se encontró ningún registro con ${typeLabel}: ${searchTerm}`,
      'ORG_PERSONAL_SEARCH_NOT_FOUND',
      404
    );
  }
}

/**
 * Error cuando ya existe un registro orgPersonal con el mismo interno
 */
export class OrgPersonalAlreadyExistsError extends OrgPersonalError {
  constructor(interno: number) {
    super(
      `Ya existe un registro orgPersonal con interno ${interno}`,
      'ORG_PERSONAL_ALREADY_EXISTS',
      409
    );
  }
}

/**
 * Error cuando el interno no es válido
 */
export class OrgPersonalInvalidInternoError extends OrgPersonalError {
  constructor(interno: any) {
    super(
      `El interno '${interno}' no es válido. Debe ser un número entero positivo.`,
      'ORG_PERSONAL_INVALID_INTERNO',
      400
    );
  }
}

/**
 * Error cuando una clave orgánica no es válida
 */
export class OrgPersonalInvalidClaveOrganicaError extends OrgPersonalError {
  constructor(clave: string, nivel: number) {
    super(
      `La clave orgánica ${nivel} '${clave}' no es válida. Debe ser una cadena de 1-2 caracteres alfanuméricos o null.`,
      'ORG_PERSONAL_INVALID_CLAVE_ORGANICA',
      400
    );
  }
}

/**
 * Error cuando el sueldo no es válido
 */
export class OrgPersonalInvalidSueldoError extends OrgPersonalError {
  constructor(sueldo: any) {
    super(
      `El sueldo '${sueldo}' no es válido. Debe ser un número positivo o null.`,
      'ORG_PERSONAL_INVALID_SUELDO',
      400
    );
  }
}

/**
 * Error cuando otras prestaciones no es válido
 */
export class OrgPersonalInvalidOtrasPrestacionesError extends OrgPersonalError {
  constructor(otrasPrestaciones: any) {
    super(
      `Otras prestaciones '${otrasPrestaciones}' no es válido. Debe ser un número positivo o null.`,
      'ORG_PERSONAL_INVALID_OTRAS_PRESTACIONES',
      400
    );
  }
}

/**
 * Error cuando quinquenios no es válido
 */
export class OrgPersonalInvalidQuinqueniosError extends OrgPersonalError {
  constructor(quinquenios: any) {
    super(
      `Quinquenios '${quinquenios}' no es válido. Debe ser un número positivo o null.`,
      'ORG_PERSONAL_INVALID_QUINQUENIOS',
      400
    );
  }
}

/**
 * Error cuando el estado activo no es válido
 */
export class OrgPersonalInvalidActivoError extends OrgPersonalError {
  constructor(activo: any) {
    super(
      `El estado activo '${activo}' no es válido. Debe ser 'S', 'N' o null.`,
      'ORG_PERSONAL_INVALID_ACTIVO',
      400
    );
  }
}

/**
 * Error cuando la fecha de movimiento no es válida
 */
export class OrgPersonalInvalidFechaError extends OrgPersonalError {
  constructor(fecha: any) {
    super(
      `La fecha de movimiento '${fecha}' no es válida. Debe ser una fecha ISO válida o null.`,
      'ORG_PERSONAL_INVALID_FECHA',
      400
    );
  }
}

/**
 * Error cuando el porcentaje no es válido
 */
export class OrgPersonalInvalidPorcentajeError extends OrgPersonalError {
  constructor(porcentaje: any) {
    super(
      `El porcentaje '${porcentaje}' no es válido. Debe ser un número entre 0 y 100 o null.`,
      'ORG_PERSONAL_INVALID_PORCENTAJE',
      400
    );
  }
}

/**
 * Error cuando el registro está en uso y no puede ser eliminado
 */
export class OrgPersonalInUseError extends OrgPersonalError {
  constructor(interno: number) {
    super(
      `El registro orgPersonal con interno ${interno} está en uso y no puede ser eliminado`,
      'ORG_PERSONAL_IN_USE',
      409
    );
  }
}

/**
 * Error de permisos para acceder a información orgPersonal
 */
export class OrgPersonalPermissionError extends OrgPersonalError {
  constructor(userId: string) {
    super(
      `El usuario '${userId}' no tiene permisos para acceder a esta información orgPersonal.`,
      'ORG_PERSONAL_PERMISSION_DENIED',
      403
    );
  }
}