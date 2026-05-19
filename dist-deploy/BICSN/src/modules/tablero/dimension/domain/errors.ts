import { DomainError } from '../../../../utils/errors.js';

/**
 * Errores específicos del dominio Dimension
 */

// Error base para el dominio Dimension
export class DimensionError extends DomainError {
  constructor(message: string, code: string, statusCode: number = 500, details?: any) {
    super(message, code, statusCode, details);
  }
}

// Error cuando una Dimension no se encuentra
export class DimensionNotFoundError extends DimensionError {
  constructor(id: number) {
    super(
      `Dimensión con ID ${id} no encontrada`,
      'DIMENSION_NOT_FOUND',
      404,
      { id }
    );
  }
}

// Error cuando ya existe una Dimension con el mismo nombre
export class DimensionAlreadyExistsError extends DimensionError {
  constructor(nombre: string) {
    super(
      `Ya existe una dimensión con el nombre '${nombre}'`,
      'DIMENSION_ALREADY_EXISTS',
      409,
      { nombre }
    );
  }
}

// Error de validación para el nombre de la Dimension
export class InvalidDimensionNombreError extends DimensionError {
  constructor(nombre: string, reason: string) {
    super(
      `El nombre '${nombre}' no es válido: ${reason}`,
      'INVALID_DIMENSION_NOMBRE',
      400,
      { nombre, reason }
    );
  }
}

// Error de validación para la descripción de la Dimension
export class InvalidDimensionDescripcionError extends DimensionError {
  constructor(descripcion: string, reason: string) {
    super(
      `La descripción '${descripcion}' no es válida: ${reason}`,
      'INVALID_DIMENSION_DESCRIPCION',
      400,
      { descripcion, reason }
    );
  }
}

// Error de permisos
export class DimensionPermissionError extends DimensionError {
  constructor(action: string) {
    super(
      `No tienes permisos para ${action} dimensiones`,
      'DIMENSION_PERMISSION_ERROR',
      403,
      { action }
    );
  }
}

// Error cuando la Dimension está en uso
export class DimensionInUseError extends DimensionError {
  constructor(id: number) {
    super(
      `La dimensión con ID ${id} no puede ser eliminada porque está en uso`,
      'DIMENSION_IN_USE',
      409,
      { id }
    );
  }
}