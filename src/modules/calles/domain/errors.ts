import { DomainError } from '../../../utils/errors.js';

// Errores de creación y actualización de calles
export class CalleAlreadyExistsError extends DomainError {
  constructor(calleId: number, nombreCalle: string, coloniaId: number, details?: any) {
    super('CALLE_ALREADY_EXISTS', `Ya existe una calle con ID ${calleId} o nombre "${nombreCalle}" en la colonia ${coloniaId}`, {
      calleId,
      nombreCalle,
      coloniaId,
      ...details
    });
  }
}

export class CalleNotFoundError extends DomainError {
  constructor(calleId: number, details?: any) {
    super('CALLE_NOT_FOUND', `Calle con ID ${calleId} no encontrada`, { calleId, ...details });
  }
}

export class InvalidCalleDataError extends DomainError {
  constructor(message: string = 'Datos de calle inválidos', details?: any) {
    super('INVALID_CALLE_DATA', message, details);
  }
}

export class CalleNombreRequiredError extends DomainError {
  constructor(details?: any) {
    super('CALLE_NOMBRE_REQUIRED', 'El nombre de la calle es requerido', details);
  }
}

export class CalleNombreTooLongError extends DomainError {
  constructor(nombreCalle: string, maxLength: number = 150, details?: any) {
    super('CALLE_NOMBRE_TOO_LONG', `El nombre de la calle "${nombreCalle}" excede la longitud máxima de ${maxLength} caracteres`, {
      nombreCalle,
      maxLength,
      actualLength: nombreCalle.length,
      ...details
    });
  }
}

export class CalleNombreEmptyError extends DomainError {
  constructor(details?: any) {
    super('CALLE_NOMBRE_EMPTY', 'El nombre de la calle no puede estar vacío', details);
  }
}

// Errores relacionados con colonia
export class ColoniaNotFoundError extends DomainError {
  constructor(coloniaId: number, details?: any) {
    super('COLONIA_NOT_FOUND', `Colonia con ID ${coloniaId} no encontrada`, { coloniaId, ...details });
  }
}

export class InvalidColoniaIdError extends DomainError {
  constructor(coloniaId: any, details?: any) {
    super('INVALID_COLONIA_ID', `ID de colonia inválido: ${coloniaId}`, { coloniaId, ...details });
  }
}

// Errores de permisos y autorización
export class CallePermissionError extends DomainError {
  constructor(action: string, userId?: string, details?: any) {
    super('CALLE_PERMISSION_DENIED', `Permisos insuficientes para ${action} calle`, {
      action,
      userId,
      ...details
    });
  }
}

export class CalleAccessDeniedError extends DomainError {
  constructor(resource: string, details?: any) {
    super('CALLE_ACCESS_DENIED', `Acceso denegado al recurso de calles: ${resource}`, { resource, ...details });
  }
}

// Errores de eliminación
export class CalleDeletionError extends DomainError {
  constructor(calleId: number, reason: string, details?: any) {
    super('CALLE_DELETION_ERROR', `Error al eliminar calle ${calleId}: ${reason}`, {
      calleId,
      reason,
      ...details
    });
  }
}

export class CalleInUseError extends DomainError {
  constructor(calleId: number, references: string[], details?: any) {
    super('CALLE_IN_USE', `No se puede eliminar la calle ${calleId} porque está siendo utilizada`, {
      calleId,
      references,
      ...details
    });
  }
}

// Errores de consulta y búsqueda
export class CalleQueryError extends DomainError {
  constructor(operation: string, reason: string, details?: any) {
    super('CALLE_QUERY_ERROR', `Error en consulta de calles (${operation}): ${reason}`, {
      operation,
      reason,
      ...details
    });
  }
}

export class CalleSearchError extends DomainError {
  constructor(filters: any, reason: string, details?: any) {
    super('CALLE_SEARCH_ERROR', `Error en búsqueda de calles: ${reason}`, {
      filters,
      reason,
      ...details
    });
  }
}

export class InvalidSearchFiltersError extends DomainError {
  constructor(invalidFilters: string[], details?: any) {
    super('INVALID_SEARCH_FILTERS', `Filtros de búsqueda inválidos: ${invalidFilters.join(', ')}`, {
      invalidFilters,
      ...details
    });
  }
}

// Errores de validación de filtros
export class InvalidEstadoIdError extends DomainError {
  constructor(estadoId: string, details?: any) {
    super('INVALID_ESTADO_ID', `ID de estado inválido: ${estadoId} (debe ser 2 caracteres)`, {
      estadoId,
      ...details
    });
  }
}

export class InvalidMunicipioIdError extends DomainError {
  constructor(municipioId: string, details?: any) {
    super('INVALID_MUNICIPIO_ID', `ID de municipio inválido: ${municipioId} (debe ser numérico)`, {
      municipioId,
      ...details
    });
  }
}

export class InvalidCodigoPostalError extends DomainError {
  constructor(codigoPostal: string, details?: any) {
    super('INVALID_CODIGO_POSTAL', `Código postal inválido: ${codigoPostal} (debe ser 5 dígitos)`, {
      codigoPostal,
      ...details
    });
  }
}

// Errores de paginación
export class InvalidPaginationError extends DomainError {
  constructor(param: string, value: any, details?: any) {
    super('INVALID_PAGINATION', `Parámetro de paginación inválido ${param}: ${value}`, {
      param,
      value,
      ...details
    });
  }
}

export class PaginationLimitExceededError extends DomainError {
  constructor(limit: number, maxLimit: number, details?: any) {
    super('PAGINATION_LIMIT_EXCEEDED', `Límite de paginación ${limit} excede el máximo permitido ${maxLimit}`, {
      limit,
      maxLimit,
      ...details
    });
  }
}

// Errores del sistema
export class CalleSystemError extends DomainError {
  constructor(message: string = 'Error interno del sistema de calles', details?: any) {
    super('CALLE_SYSTEM_ERROR', message, details);
  }
}

export class CalleConnectionError extends DomainError {
  constructor(message: string = 'Error de conexión con el sistema de calles', details?: any) {
    super('CALLE_CONNECTION_ERROR', message, details);
  }
}

export class CalleTimeoutError extends DomainError {
  constructor(operation: string, timeoutMs: number, details?: any) {
    super('CALLE_TIMEOUT', `Timeout en operación de calles ${operation} después de ${timeoutMs}ms`, {
      operation,
      timeoutMs,
      ...details
    });
  }
}