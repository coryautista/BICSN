import { DomainError } from '../../../utils/errors.js';

/**
 * Error base para operaciones del módulo módulo
 */
export class ModuloError extends DomainError {
  constructor(message: string, code: string, statusCode: number = 500) {
    super(message, code, statusCode);
  }
}

/**
 * Error cuando un módulo no es encontrado
 */
export class ModuloNotFoundError extends ModuloError {
  constructor(moduloId: number) {
    super(
      `Módulo con ID ${moduloId} no encontrado`,
      'MODULO_NOT_FOUND',
      404
    );
  }
}

/**
 * Error cuando ya existe un módulo con el mismo nombre
 */
export class ModuloAlreadyExistsError extends ModuloError {
  constructor(nombre: string) {
    super(
      `Ya existe un módulo con el nombre: ${nombre}`,
      'MODULO_ALREADY_EXISTS',
      409
    );
  }
}

/**
 * Error de validación del nombre del módulo
 */
export class ModuloInvalidNameError extends ModuloError {
  constructor(details: string) {
    super(
      `Nombre del módulo inválido: ${details}`,
      'MODULO_INVALID_NAME',
      400
    );
  }
}

/**
 * Error de validación del tipo del módulo
 */
export class ModuloInvalidTypeError extends ModuloError {
  constructor(details: string) {
    super(
      `Tipo del módulo inválido: ${details}`,
      'MODULO_INVALID_TYPE',
      400
    );
  }
}

/**
 * Error de validación del orden del módulo
 */
export class ModuloInvalidOrderError extends ModuloError {
  constructor(details: string) {
    super(
      `Orden del módulo inválido: ${details}`,
      'MODULO_INVALID_ORDER',
      400
    );
  }
}

/**
 * Error de permisos insuficientes para operaciones de módulo
 */
export class ModuloPermissionError extends ModuloError {
  constructor(operation: string) {
    super(
      `Permisos insuficientes para la operación: ${operation}`,
      'MODULO_PERMISSION_DENIED',
      403
    );
  }
}

/**
 * Error cuando se intenta eliminar un módulo que está siendo usado
 */
export class ModuloInUseError extends ModuloError {
  constructor(moduloId: number) {
    super(
      `No se puede eliminar el módulo ${moduloId} porque está siendo utilizado por otros componentes del sistema`,
      'MODULO_IN_USE',
      409
    );
  }
}