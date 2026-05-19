import { DomainError } from '../../../utils/errors.js';

export class EstadoError extends DomainError {
  constructor(message: string, operation: string, details?: Record<string, any>) {
    super(message, `ESTADO_${operation.toUpperCase()}_ERROR`, 500, details);
  }
}

export class EstadoNotFoundError extends EstadoError {
  constructor(estadoId: string) {
    super(
      `Estado con ID ${estadoId} no encontrado`,
      'findById',
      { estadoId }
    );
  }
}

export class DuplicateEstadoError extends EstadoError {
  constructor(estadoId: string) {
    super(
      `Ya existe un estado con ID '${estadoId}'`,
      'create',
      { estadoId }
    );
  }
}

export class InvalidEstadoDataError extends EstadoError {
  constructor(field: string, reason: string) {
    super(
      `Campo '${field}' inválido: ${reason}`,
      'validation',
      { field, reason }
    );
  }
}

export class EstadoQueryError extends EstadoError {
  constructor(operation: string, details?: Record<string, any>) {
    super(
      `Error en consulta de estados: ${operation}`,
      'query',
      details
    );
  }
}

export class EstadoCommandError extends EstadoError {
  constructor(operation: string, details?: Record<string, any>) {
    super(
      `Error en comando de estados: ${operation}`,
      'command',
      details
    );
  }
}

export class EstadosNotFoundError extends EstadoError {
  constructor() {
    super(
      'No se encontraron estados en el sistema',
      'findAll',
      {}
    );
  }
}