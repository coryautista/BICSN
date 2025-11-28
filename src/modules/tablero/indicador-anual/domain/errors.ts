import { DomainError } from '../../../../utils/errors.js';

/**
 * Errores específicos del dominio IndicadorAnual
 */

// Error base para el dominio IndicadorAnual
export class IndicadorAnualError extends DomainError {
  constructor(message: string, code: string, statusCode: number = 500, details?: any) {
    super(message, code, statusCode, details);
  }
}

// Error cuando un IndicadorAnual no se encuentra
export class IndicadorAnualNotFoundError extends IndicadorAnualError {
  constructor(id: number) {
    super(
      `Indicador anual con ID ${id} no encontrado`,
      'INDICADOR_ANUAL_NOT_FOUND',
      404,
      { id }
    );
  }
}

// Error cuando ya existe un IndicadorAnual con el mismo nombre
export class IndicadorAnualAlreadyExistsError extends IndicadorAnualError {
  constructor(nombre: string) {
    super(
      `Ya existe un indicador anual con el nombre '${nombre}'`,
      'INDICADOR_ANUAL_ALREADY_EXISTS',
      409,
      { nombre }
    );
  }
}

// Error de validación para el nombre del IndicadorAnual
export class InvalidIndicadorAnualNombreError extends IndicadorAnualError {
  constructor(nombre: string, reason: string) {
    super(
      `El nombre '${nombre}' no es válido: ${reason}`,
      'INVALID_INDICADOR_ANUAL_NOMBRE',
      400,
      { nombre, reason }
    );
  }
}

// Error de validación para la descripción del IndicadorAnual
export class InvalidIndicadorAnualDescripcionError extends IndicadorAnualError {
  constructor(descripcion: string, reason: string) {
    super(
      `La descripción '${descripcion}' no es válida: ${reason}`,
      'INVALID_INDICADOR_ANUAL_DESCRIPCION',
      400,
      { descripcion, reason }
    );
  }
}

// Error de permisos
export class IndicadorAnualPermissionError extends IndicadorAnualError {
  constructor(action: string) {
    super(
      `No tienes permisos para ${action} indicadores anuales`,
      'INDICADOR_ANUAL_PERMISSION_ERROR',
      403,
      { action }
    );
  }
}

// Error cuando el IndicadorAnual está en uso
export class IndicadorAnualInUseError extends IndicadorAnualError {
  constructor(id: number) {
    super(
      `El indicador anual con ID ${id} no puede ser eliminado porque está en uso`,
      'INDICADOR_ANUAL_IN_USE',
      409,
      { id }
    );
  }
}