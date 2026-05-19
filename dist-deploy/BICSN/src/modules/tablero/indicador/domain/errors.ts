import { DomainError } from '../../../../utils/errors.js';

/**
 * Errores específicos del dominio Indicador
 */

// Error base para el dominio Indicador
export class IndicadorError extends DomainError {
  constructor(message: string, code: string, statusCode: number = 500, details?: any) {
    super(message, code, statusCode, details);
  }
}

// Error cuando un Indicador no se encuentra
export class IndicadorNotFoundError extends IndicadorError {
  constructor(id: number) {
    super(
      `Indicador con ID ${id} no encontrado`,
      'INDICADOR_NOT_FOUND',
      404,
      { id }
    );
  }
}

// Error cuando ya existe un Indicador con el mismo nombre
export class IndicadorAlreadyExistsError extends IndicadorError {
  constructor(nombre: string) {
    super(
      `Ya existe un indicador con el nombre '${nombre}'`,
      'INDICADOR_ALREADY_EXISTS',
      409,
      { nombre }
    );
  }
}

// Error de validación para el nombre del Indicador
export class InvalidIndicadorNombreError extends IndicadorError {
  constructor(nombre: string, reason: string) {
    super(
      `El nombre '${nombre}' no es válido: ${reason}`,
      'INVALID_INDICADOR_NOMBRE',
      400,
      { nombre, reason }
    );
  }
}

// Error de validación para la descripción del Indicador
export class InvalidIndicadorDescripcionError extends IndicadorError {
  constructor(descripcion: string, reason: string) {
    super(
      `La descripción '${descripcion}' no es válida: ${reason}`,
      'INVALID_INDICADOR_DESCRIPCION',
      400,
      { descripcion, reason }
    );
  }
}

// Error de validación para la unidad del Indicador
export class InvalidIndicadorUnidadError extends IndicadorError {
  constructor(unidad: string, reason: string) {
    super(
      `La unidad '${unidad}' no es válida: ${reason}`,
      'INVALID_INDICADOR_UNIDAD',
      400,
      { unidad, reason }
    );
  }
}

// Error de permisos
export class IndicadorPermissionError extends IndicadorError {
  constructor(action: string) {
    super(
      `No tienes permisos para ${action} indicadores`,
      'INDICADOR_PERMISSION_ERROR',
      403,
      { action }
    );
  }
}

// Error cuando el Indicador está en uso
export class IndicadorInUseError extends IndicadorError {
  constructor(id: number) {
    super(
      `El indicador con ID ${id} no puede ser eliminado porque está en uso`,
      'INDICADOR_IN_USE',
      409,
      { id }
    );
  }
}