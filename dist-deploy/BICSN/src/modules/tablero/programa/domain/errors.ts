import { DomainError } from '../../../../utils/errors.js';

/**
 * Errores específicos del dominio Programa
 */

// Error base para el dominio Programa
export class ProgramaError extends DomainError {
  constructor(message: string, code: string, statusCode: number = 500, details?: any) {
    super(message, code, statusCode, details);
  }
}

// Error cuando un Programa no se encuentra
export class ProgramaNotFoundError extends ProgramaError {
  constructor(id: number) {
    super(
      `Programa con ID ${id} no encontrado`,
      'PROGRAMA_NOT_FOUND',
      404,
      { id }
    );
  }
}

// Error cuando ya existe un Programa con el mismo nombre
export class ProgramaAlreadyExistsError extends ProgramaError {
  constructor(nombre: string) {
    super(
      `Ya existe un programa con el nombre '${nombre}'`,
      'PROGRAMA_ALREADY_EXISTS',
      409,
      { nombre }
    );
  }
}

// Error de validación para el nombre del Programa
export class InvalidProgramaNombreError extends ProgramaError {
  constructor(nombre: string, reason: string) {
    super(
      `El nombre '${nombre}' no es válido: ${reason}`,
      'INVALID_PROGRAMA_NOMBRE',
      400,
      { nombre, reason }
    );
  }
}

// Error de validación para la descripción del Programa
export class InvalidProgramaDescripcionError extends ProgramaError {
  constructor(descripcion: string, reason: string) {
    super(
      `La descripción '${descripcion}' no es válida: ${reason}`,
      'INVALID_PROGRAMA_DESCRIPCION',
      400,
      { descripcion, reason }
    );
  }
}

// Error de permisos
export class ProgramaPermissionError extends ProgramaError {
  constructor(action: string) {
    super(
      `No tienes permisos para ${action} programas`,
      'PROGRAMA_PERMISSION_ERROR',
      403,
      { action }
    );
  }
}

// Error cuando el Programa está en uso
export class ProgramaInUseError extends ProgramaError {
  constructor(id: number) {
    super(
      `El programa con ID ${id} no puede ser eliminado porque está en uso`,
      'PROGRAMA_IN_USE',
      409,
      { id }
    );
  }
}