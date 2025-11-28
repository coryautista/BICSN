import { DomainError } from '../../../utils/errors.js';

/**
 * Error cuando una entidad organica0 no es encontrada
 */
export class Organica0NotFoundError extends DomainError {
  constructor(claveOrganica: string) {
    super(
      `Entidad organica0 con clave ${claveOrganica} no encontrada`,
      'ORGANICA0_NOT_FOUND',
      404,
      { claveOrganica }
    );
  }
}

/**
 * Error cuando ya existe una entidad organica0 con la misma clave
 */
export class Organica0AlreadyExistsError extends DomainError {
  constructor(claveOrganica: string) {
    super(
      `Ya existe una entidad organica0 con la clave: ${claveOrganica}`,
      'ORGANICA0_ALREADY_EXISTS',
      409,
      { claveOrganica }
    );
  }
}

/**
 * Error de validación de la clave organica0
 */
export class Organica0InvalidClaveError extends DomainError {
  constructor(details: string) {
    super(
      `Clave organica0 inválida: ${details}`,
      'ORGANICA0_INVALID_CLAVE',
      400,
      { details }
    );
  }
}

/**
 * Error de validación del nombre organica0
 */
export class Organica0InvalidNombreError extends DomainError {
  constructor(details: string) {
    super(
      `Nombre organica0 inválido: ${details}`,
      'ORGANICA0_INVALID_NOMBRE',
      400,
      { details }
    );
  }
}

/**
 * Error de validación del estatus organica0
 */
export class Organica0InvalidEstatusError extends DomainError {
  constructor(details: string) {
    super(
      `Estatus organica0 inválido: ${details}`,
      'ORGANICA0_INVALID_ESTATUS',
      400,
      { details }
    );
  }
}

/**
 * Error de validación de fechas organica0
 */
export class Organica0InvalidFechaError extends DomainError {
  constructor(details: string) {
    super(
      `Fecha organica0 inválida: ${details}`,
      'ORGANICA0_INVALID_FECHA',
      400,
      { details }
    );
  }
}

/**
 * Error cuando se intenta eliminar una entidad organica0 que está en uso
 */
export class Organica0InUseError extends DomainError {
  constructor(claveOrganica: string) {
    super(
      `No se puede eliminar la entidad organica0 ${claveOrganica} porque está siendo utilizada`,
      'ORGANICA0_IN_USE',
      409,
      { claveOrganica }
    );
  }
}

/**
 * Error de permisos insuficientes para operaciones de organica0
 */
export class Organica0PermissionError extends DomainError {
  constructor(operation: string, userId?: string) {
    super(
      `Permisos insuficientes para la operación: ${operation}`,
      'ORGANICA0_PERMISSION_DENIED',
      403,
      { operation, userId }
    );
  }
}