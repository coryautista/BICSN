import { DomainError } from '../../../../utils/errors.js';

/**
 * Errores específicos del dominio Dependencia
 */

// Error base para el dominio Dependencia
export class DependenciaError extends DomainError {
  constructor(message: string, code: string, statusCode: number = 500, details?: any) {
    super(message, code, statusCode, details);
  }
}

// Error cuando una Dependencia no se encuentra
export class DependenciaNotFoundError extends DependenciaError {
  constructor(id: number) {
    super(
      `Dependencia con ID ${id} no encontrada`,
      'DEPENDENCIA_NOT_FOUND',
      404,
      { id }
    );
  }
}

// Error cuando ya existe una Dependencia con el mismo nombre
export class DependenciaAlreadyExistsError extends DependenciaError {
  constructor(nombre: string) {
    super(
      `Ya existe una dependencia con el nombre '${nombre}'`,
      'DEPENDENCIA_ALREADY_EXISTS',
      409,
      { nombre }
    );
  }
}

// Error de validación para el nombre de la Dependencia
export class InvalidDependenciaNombreError extends DependenciaError {
  constructor(nombre: string, reason: string) {
    super(
      `El nombre '${nombre}' no es válido: ${reason}`,
      'INVALID_DEPENDENCIA_NOMBRE',
      400,
      { nombre, reason }
    );
  }
}

// Error de validación para la descripción de la Dependencia
export class InvalidDependenciaDescripcionError extends DependenciaError {
  constructor(descripcion: string, reason: string) {
    super(
      `La descripción '${descripcion}' no es válida: ${reason}`,
      'INVALID_DEPENDENCIA_DESCRIPCION',
      400,
      { descripcion, reason }
    );
  }
}

// Error de permisos
export class DependenciaPermissionError extends DependenciaError {
  constructor(action: string) {
    super(
      `No tienes permisos para ${action} dependencias`,
      'DEPENDENCIA_PERMISSION_ERROR',
      403,
      { action }
    );
  }
}

// Error cuando la Dependencia está en uso
export class DependenciaInUseError extends DependenciaError {
  constructor(id: number) {
    super(
      `La dependencia con ID ${id} no puede ser eliminada porque está en uso`,
      'DEPENDENCIA_IN_USE',
      409,
      { id }
    );
  }
}