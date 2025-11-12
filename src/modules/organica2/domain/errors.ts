import { DomainError } from '../../../utils/errors.js';

/**
 * Error base para operaciones del módulo organica2
 */
export class Organica2Error extends DomainError {
  constructor(message: string, code: string, statusCode: number = 500) {
    super(message, code, statusCode);
  }
}

/**
 * Error cuando una entidad organica2 no es encontrada
 */
export class Organica2NotFoundError extends Organica2Error {
  constructor(claveOrganica0: string, claveOrganica1: string, claveOrganica2: string) {
    super(
      `Entidad organica2 con clave ${claveOrganica0}-${claveOrganica1}-${claveOrganica2} no encontrada`,
      'ORGANICA2_NOT_FOUND',
      404
    );
  }
}

/**
 * Error cuando ya existe una entidad organica2 con la misma clave
 */
export class Organica2AlreadyExistsError extends Organica2Error {
  constructor(claveOrganica0: string, claveOrganica1: string, claveOrganica2: string) {
    super(
      `Ya existe una entidad organica2 con la clave: ${claveOrganica0}-${claveOrganica1}-${claveOrganica2}`,
      'ORGANICA2_ALREADY_EXISTS',
      409
    );
  }
}

/**
 * Error de validación de la clave organica0
 */
export class Organica2InvalidClaveOrganica0Error extends Organica2Error {
  constructor(details: string) {
    super(
      `Clave organica0 inválida: ${details}`,
      'ORGANICA2_INVALID_CLAVE_ORGANICA0',
      400
    );
  }
}

/**
 * Error de validación de la clave organica1
 */
export class Organica2InvalidClaveOrganica1Error extends Organica2Error {
  constructor(details: string) {
    super(
      `Clave organica1 inválida: ${details}`,
      'ORGANICA2_INVALID_CLAVE_ORGANICA1',
      400
    );
  }
}

/**
 * Error de validación de la clave organica2
 */
export class Organica2InvalidClaveOrganica2Error extends Organica2Error {
  constructor(details: string) {
    super(
      `Clave organica2 inválida: ${details}`,
      'ORGANICA2_INVALID_CLAVE_ORGANICA2',
      400
    );
  }
}

/**
 * Error de validación de la descripción organica2
 */
export class Organica2InvalidDescripcionError extends Organica2Error {
  constructor(details: string) {
    super(
      `Descripción organica2 inválida: ${details}`,
      'ORGANICA2_INVALID_DESCRIPCION',
      400
    );
  }
}

/**
 * Error de validación del titular organica2
 */
export class Organica2InvalidTitularError extends Organica2Error {
  constructor(details: string) {
    super(
      `Titular organica2 inválido: ${details}`,
      'ORGANICA2_INVALID_TITULAR',
      400
    );
  }
}

/**
 * Error de validación del estatus organica2
 */
export class Organica2InvalidEstatusError extends Organica2Error {
  constructor(details: string) {
    super(
      `Estatus organica2 inválido: ${details}`,
      'ORGANICA2_INVALID_ESTATUS',
      400
    );
  }
}

/**
 * Error de validación de fechas organica2
 */
export class Organica2InvalidFechaError extends Organica2Error {
  constructor(details: string) {
    super(
      `Fecha organica2 inválida: ${details}`,
      'ORGANICA2_INVALID_FECHA',
      400
    );
  }
}

/**
 * Error cuando se intenta eliminar una entidad organica2 que está en uso
 */
export class Organica2InUseError extends Organica2Error {
  constructor(claveOrganica0: string, claveOrganica1: string, claveOrganica2: string) {
    super(
      `No se puede eliminar la entidad organica2 ${claveOrganica0}-${claveOrganica1}-${claveOrganica2} porque está siendo utilizada`,
      'ORGANICA2_IN_USE',
      409
    );
  }
}

/**
 * Error cuando la clave organica1 padre no existe
 */
export class Organica2ParentNotFoundError extends Organica2Error {
  constructor(claveOrganica0: string, claveOrganica1: string) {
    super(
      `La clave organica1 padre ${claveOrganica0}-${claveOrganica1} no existe`,
      'ORGANICA2_PARENT_NOT_FOUND',
      400
    );
  }
}

/**
 * Error de permisos insuficientes para operaciones de organica2
 */
export class Organica2PermissionError extends Organica2Error {
  constructor(operation: string) {
    super(
      `Permisos insuficientes para la operación: ${operation}`,
      'ORGANICA2_PERMISSION_DENIED',
      403
    );
  }
}

/**
 * Error cuando falla la eliminación de una entidad organica2
 */
export class Organica2DeletionError extends Organica2Error {
  constructor(details: string) {
    super(
      `Error en la eliminación de organica2: ${details}`,
      'ORGANICA2_DELETION_ERROR',
      500
    );
  }
}