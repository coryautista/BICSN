import { DomainError } from '../../../utils/errors.js';

/**
 * Error base para operaciones del módulo organica1
 */
export class Organica1Error extends DomainError {
  constructor(message: string, code: string, statusCode: number = 500) {
    super(message, code, statusCode);
  }
}

/**
 * Error cuando una entidad organica1 no es encontrada
 */
export class Organica1NotFoundError extends DomainError {
  constructor(claveOrganica0: string, claveOrganica1: string) {
    super(
      `Entidad organica1 con clave ${claveOrganica0}-${claveOrganica1} no encontrada`,
      'ORGANICA1_NOT_FOUND',
      404,
      { claveOrganica0, claveOrganica1 }
    );
  }
}

/**
 * Error cuando ya existe una entidad organica1 con la misma clave
 */
export class Organica1AlreadyExistsError extends DomainError {
  constructor(claveOrganica0: string, claveOrganica1: string) {
    super(
      `Ya existe una entidad organica1 con la clave: ${claveOrganica0}-${claveOrganica1}`,
      'ORGANICA1_ALREADY_EXISTS',
      409,
      { claveOrganica0, claveOrganica1 }
    );
  }
}

/**
 * Error de validación de la clave organica0
 */
export class Organica1InvalidClaveOrganica0Error extends DomainError {
  constructor(details: string) {
    super(
      `Clave organica0 inválida: ${details}`,
      'ORGANICA1_INVALID_CLAVE_ORGANICA0',
      400,
      { details }
    );
  }
}

/**
 * Error de validación de la clave organica1
 */
export class Organica1InvalidClaveOrganica1Error extends DomainError {
  constructor(details: string) {
    super(
      `Clave organica1 inválida: ${details}`,
      'ORGANICA1_INVALID_CLAVE_ORGANICA1',
      400,
      { details }
    );
  }
}

/**
 * Error de validación de la descripción organica1
 */
export class Organica1InvalidDescripcionError extends DomainError {
  constructor(details: string) {
    super(
      `Descripción organica1 inválida: ${details}`,
      'ORGANICA1_INVALID_DESCRIPCION',
      400,
      { details }
    );
  }
}

/**
 * Error de validación del titular organica1
 */
export class Organica1InvalidTitularError extends DomainError {
  constructor(details: string) {
    super(
      `Titular organica1 inválido: ${details}`,
      'ORGANICA1_INVALID_TITULAR',
      400,
      { details }
    );
  }
}

/**
 * Error de validación del RFC organica1
 */
export class Organica1InvalidRfcError extends DomainError {
  constructor(details: string) {
    super(
      `RFC organica1 inválido: ${details}`,
      'ORGANICA1_INVALID_RFC',
      400,
      { details }
    );
  }
}

/**
 * Error de validación del IMSS organica1
 */
export class Organica1InvalidImssError extends DomainError {
  constructor(details: string) {
    super(
      `IMSS organica1 inválido: ${details}`,
      'ORGANICA1_INVALID_IMSS',
      400,
      { details }
    );
  }
}

/**
 * Error de validación del INFONAVIT organica1
 */
export class Organica1InvalidInfonavitError extends DomainError {
  constructor(details: string) {
    super(
      `INFONAVIT organica1 inválido: ${details}`,
      'ORGANICA1_INVALID_INFONAVIT',
      400,
      { details }
    );
  }
}

/**
 * Error de validación del estatus organica1
 */
export class Organica1InvalidEstatusError extends DomainError {
  constructor(details: string) {
    super(
      `Estatus organica1 inválido: ${details}`,
      'ORGANICA1_INVALID_ESTATUS',
      400,
      { details }
    );
  }
}

/**
 * Error de validación de fechas organica1
 */
export class Organica1InvalidFechaError extends DomainError {
  constructor(details: string) {
    super(
      `Fecha organica1 inválida: ${details}`,
      'ORGANICA1_INVALID_FECHA',
      400,
      { details }
    );
  }
}

/**
 * Error cuando se intenta eliminar una entidad organica1 que está en uso
 */
export class Organica1InUseError extends DomainError {
  constructor(claveOrganica0: string, claveOrganica1: string) {
    super(
      `No se puede eliminar la entidad organica1 ${claveOrganica0}-${claveOrganica1} porque está siendo utilizada`,
      'ORGANICA1_IN_USE',
      409,
      { claveOrganica0, claveOrganica1 }
    );
  }
}

/**
 * Error cuando la clave organica0 padre no existe
 */
export class Organica1ParentNotFoundError extends DomainError {
  constructor(claveOrganica0: string) {
    super(
      `La clave organica0 padre ${claveOrganica0} no existe`,
      'ORGANICA1_PARENT_NOT_FOUND',
      400,
      { claveOrganica0 }
    );
  }
}

/**
 * Error de permisos insuficientes para operaciones de organica1
 */
export class Organica1PermissionError extends DomainError {
  constructor(operation: string, userId?: string) {
    super(
      `Permisos insuficientes para la operación: ${operation}`,
      'ORGANICA1_PERMISSION_DENIED',
      403,
      { operation, userId }
    );
  }
}