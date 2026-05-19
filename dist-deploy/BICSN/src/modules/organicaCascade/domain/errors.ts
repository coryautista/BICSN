import { DomainError } from '../../../utils/errors.js';

/**
 * Error base para operaciones del módulo organicaCascade
 */
export class OrganicaCascadeError extends DomainError {
  constructor(message: string, code: string, statusCode: number = 500) {
    super(message, code, statusCode);
  }
}

/**
 * Error cuando una clave orgánica 0 no es válida
 */
export class OrganicaCascadeInvalidClaveOrganica0Error extends OrganicaCascadeError {
  constructor(claveOrganica0: string) {
    super(
      `La clave orgánica 0 '${claveOrganica0}' no es válida. Debe ser una cadena de 1-2 caracteres alfanuméricos.`,
      'ORGANICA_CASCADE_INVALID_CLAVE_0',
      400
    );
  }
}

/**
 * Error cuando una clave orgánica 1 no es válida
 */
export class OrganicaCascadeInvalidClaveOrganica1Error extends OrganicaCascadeError {
  constructor(claveOrganica1: string) {
    super(
      `La clave orgánica 1 '${claveOrganica1}' no es válida. Debe ser una cadena de 1-2 caracteres alfanuméricos.`,
      'ORGANICA_CASCADE_INVALID_CLAVE_1',
      400
    );
  }
}

/**
 * Error cuando una clave orgánica 2 no es válida
 */
export class OrganicaCascadeInvalidClaveOrganica2Error extends OrganicaCascadeError {
  constructor(claveOrganica2: string) {
    super(
      `La clave orgánica 2 '${claveOrganica2}' no es válida. Debe ser una cadena de 1-2 caracteres alfanuméricos.`,
      'ORGANICA_CASCADE_INVALID_CLAVE_2',
      400
    );
  }
}

/**
 * Error cuando no se encuentra la estructura orgánica 0
 */
export class OrganicaCascadeOrganica0NotFoundError extends OrganicaCascadeError {
  constructor(claveOrganica0: string) {
    super(
      `No se encontró la estructura orgánica 0 con clave '${claveOrganica0}'.`,
      'ORGANICA_CASCADE_ORGANICA0_NOT_FOUND',
      404
    );
  }
}

/**
 * Error cuando no se encuentra la estructura orgánica 1
 */
export class OrganicaCascadeOrganica1NotFoundError extends OrganicaCascadeError {
  constructor(claveOrganica0: string, claveOrganica1: string) {
    super(
      `No se encontró la estructura orgánica 1 con claves '${claveOrganica0}-${claveOrganica1}'.`,
      'ORGANICA_CASCADE_ORGANICA1_NOT_FOUND',
      404
    );
  }
}

/**
 * Error cuando no se encuentra la estructura orgánica 2
 */
export class OrganicaCascadeOrganica2NotFoundError extends OrganicaCascadeError {
  constructor(claveOrganica0: string, claveOrganica1: string, claveOrganica2: string) {
    super(
      `No se encontró la estructura orgánica 2 con claves '${claveOrganica0}-${claveOrganica1}-${claveOrganica2}'.`,
      'ORGANICA_CASCADE_ORGANICA2_NOT_FOUND',
      404
    );
  }
}

/**
 * Error de permisos para acceder a información orgánica
 */
export class OrganicaCascadePermissionError extends OrganicaCascadeError {
  constructor(userId: string) {
    super(
      `El usuario '${userId}' no tiene permisos para acceder a esta información orgánica.`,
      'ORGANICA_CASCADE_PERMISSION_DENIED',
      403
    );
  }
}