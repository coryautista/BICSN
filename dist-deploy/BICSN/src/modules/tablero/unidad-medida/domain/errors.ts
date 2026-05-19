import { DomainError } from '../../../../utils/errors.js';

/**
 * Errores específicos del dominio UnidadMedida
 */

// Error base para el dominio UnidadMedida
export class UnidadMedidaError extends DomainError {
  constructor(message: string, code: string, statusCode: number = 500, details?: any) {
    super(message, code, statusCode, details);
  }
}

// Error cuando una UnidadMedida no se encuentra
export class UnidadMedidaNotFoundError extends UnidadMedidaError {
  constructor(id: number) {
    super(
      `Unidad de medida con ID ${id} no encontrada`,
      'UNIDAD_MEDIDA_NOT_FOUND',
      404,
      { id }
    );
  }
}

// Error cuando ya existe una UnidadMedida con el mismo nombre
export class UnidadMedidaAlreadyExistsError extends UnidadMedidaError {
  constructor(nombre: string) {
    super(
      `Ya existe una unidad de medida con el nombre '${nombre}'`,
      'UNIDAD_MEDIDA_ALREADY_EXISTS',
      409,
      { nombre }
    );
  }
}

// Error de validación para el nombre de la UnidadMedida
export class InvalidUnidadMedidaNombreError extends UnidadMedidaError {
  constructor(nombre: string, reason: string) {
    super(
      `El nombre '${nombre}' no es válido: ${reason}`,
      'INVALID_UNIDAD_MEDIDA_NOMBRE',
      400,
      { nombre, reason }
    );
  }
}

// Error de validación para la descripción de la UnidadMedida
export class InvalidUnidadMedidaDescripcionError extends UnidadMedidaError {
  constructor(descripcion: string, reason: string) {
    super(
      `La descripción '${descripcion}' no es válida: ${reason}`,
      'INVALID_UNIDAD_MEDIDA_DESCRIPCION',
      400,
      { descripcion, reason }
    );
  }
}

// Error de permisos
export class UnidadMedidaPermissionError extends UnidadMedidaError {
  constructor(action: string) {
    super(
      `No tienes permisos para ${action} unidades de medida`,
      'UNIDAD_MEDIDA_PERMISSION_ERROR',
      403,
      { action }
    );
  }
}

// Error cuando la UnidadMedida está en uso
export class UnidadMedidaInUseError extends UnidadMedidaError {
  constructor(id: number) {
    super(
      `La unidad de medida con ID ${id} no puede ser eliminada porque está en uso`,
      'UNIDAD_MEDIDA_IN_USE',
      409,
      { id }
    );
  }
}