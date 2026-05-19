import { DomainError } from '../../../../utils/errors.js';

/**
 * Errores específicos del dominio Eje
 */

// Error base para el dominio Eje
export class EjeError extends DomainError {
  constructor(message: string, code: string, statusCode: number = 500, details?: any) {
    super(message, code, statusCode, details);
  }
}

// Error cuando un Eje no se encuentra
export class EjeNotFoundError extends EjeError {
  constructor(id: number) {
    super(
      `Eje con ID ${id} no encontrado`,
      'EJE_NOT_FOUND',
      404,
      { id }
    );
  }
}

// Error cuando ya existe un Eje con el mismo nombre
export class EjeAlreadyExistsError extends EjeError {
  constructor(nombre: string) {
    super(
      `Ya existe un eje con el nombre '${nombre}'`,
      'EJE_ALREADY_EXISTS',
      409,
      { nombre }
    );
  }
}

// Error de validación para el nombre del Eje
export class InvalidEjeNombreError extends EjeError {
  constructor(nombre: string, reason: string) {
    super(
      `El nombre '${nombre}' no es válido: ${reason}`,
      'INVALID_EJE_NOMBRE',
      400,
      { nombre, reason }
    );
  }
}

// Error de validación para la descripción del Eje
export class InvalidEjeDescripcionError extends EjeError {
  constructor(descripcion: string, reason: string) {
    super(
      `La descripción '${descripcion}' no es válida: ${reason}`,
      'INVALID_EJE_DESCRIPCION',
      400,
      { descripcion, reason }
    );
  }
}

// Error de permisos
export class EjePermissionError extends EjeError {
  constructor(action: string) {
    super(
      `No tienes permisos para ${action} ejes`,
      'EJE_PERMISSION_ERROR',
      403,
      { action }
    );
  }
}

// Error cuando el Eje está en uso
export class EjeInUseError extends EjeError {
  constructor(id: number) {
    super(
      `El eje con ID ${id} no puede ser eliminado porque está en uso`,
      'EJE_IN_USE',
      409,
      { id }
    );
  }
}