import { DomainError } from '../../../../utils/errors.js';

/**
 * Errores específicos del dominio LineaEstrategica
 */

// Error base para el dominio LineaEstrategica
export class LineaEstrategicaError extends DomainError {
  constructor(message: string, code: string, statusCode: number = 500, details?: any) {
    super(message, code, statusCode, details);
  }
}

// Error cuando una LineaEstrategica no se encuentra
export class LineaEstrategicaNotFoundError extends LineaEstrategicaError {
  constructor(id: number) {
    super(
      `Línea estratégica con ID ${id} no encontrada`,
      'LINEA_ESTRATEGICA_NOT_FOUND',
      404,
      { id }
    );
  }
}

// Error cuando ya existe una LineaEstrategica con el mismo nombre
export class LineaEstrategicaAlreadyExistsError extends LineaEstrategicaError {
  constructor(nombre: string) {
    super(
      `Ya existe una línea estratégica con el nombre '${nombre}'`,
      'LINEA_ESTRATEGICA_ALREADY_EXISTS',
      409,
      { nombre }
    );
  }
}

// Error de validación para el nombre de la LineaEstrategica
export class InvalidLineaEstrategicaNombreError extends LineaEstrategicaError {
  constructor(nombre: string, reason: string) {
    super(
      `El nombre '${nombre}' no es válido: ${reason}`,
      'INVALID_LINEA_ESTRATEGICA_NOMBRE',
      400,
      { nombre, reason }
    );
  }
}

// Error de validación para la descripción de la LineaEstrategica
export class InvalidLineaEstrategicaDescripcionError extends LineaEstrategicaError {
  constructor(descripcion: string, reason: string) {
    super(
      `La descripción '${descripcion}' no es válida: ${reason}`,
      'INVALID_LINEA_ESTRATEGICA_DESCRIPCION',
      400,
      { descripcion, reason }
    );
  }
}

// Error de permisos
export class LineaEstrategicaPermissionError extends LineaEstrategicaError {
  constructor(action: string) {
    super(
      `No tienes permisos para ${action} líneas estratégicas`,
      'LINEA_ESTRATEGICA_PERMISSION_ERROR',
      403,
      { action }
    );
  }
}

// Error cuando la LineaEstrategica está en uso
export class LineaEstrategicaInUseError extends LineaEstrategicaError {
  constructor(id: number) {
    super(
      `La línea estratégica con ID ${id} no puede ser eliminada porque está en uso`,
      'LINEA_ESTRATEGICA_IN_USE',
      409,
      { id }
    );
  }
}