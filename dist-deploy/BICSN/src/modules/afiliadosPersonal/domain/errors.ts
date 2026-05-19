import { DomainError } from '../../../utils/errors.js';

// Errores de permisos y acceso
export class AfiliadosPersonalAccessDeniedError extends DomainError {
  constructor(message: string = 'Usuario no tiene permisos para acceder a información de personal', details?: any) {
    super('AFILIADOS_PERSONAL_ACCESS_DENIED', message, details);
  }
}

export class AfiliadosPersonalInvalidCredentialsError extends DomainError {
  constructor(message: string = 'Credenciales de usuario inválidas para consulta de personal', details?: any) {
    super('AFILIADOS_PERSONAL_INVALID_CREDENTIALS', message, details);
  }
}

// Errores de validación de datos
export class AfiliadosPersonalInvalidSearchTermError extends DomainError {
  constructor(searchTerm: string, details?: any) {
    super('AFILIADOS_PERSONAL_INVALID_SEARCH_TERM', `Término de búsqueda inválido: ${searchTerm}`, { searchTerm, ...details });
  }
}

export class AfiliadosPersonalInvalidClaveOrganicaError extends DomainError {
  constructor(claveOrganica: string, level: number, details?: any) {
    super('AFILIADOS_PERSONAL_INVALID_CLAVE_ORGANICA', `Clave orgánica ${level} inválida: ${claveOrganica}`, { claveOrganica, level, ...details });
  }
}

// Errores de consulta y base de datos
export class AfiliadosPersonalQueryFailedError extends DomainError {
  constructor(operation: string, details?: any) {
    super('AFILIADOS_PERSONAL_QUERY_FAILED', `Error al ejecutar consulta de ${operation}`, { operation, ...details });
  }
}

export class AfiliadosPersonalConnectionError extends DomainError {
  constructor(message: string = 'Error de conexión con base de datos de personal', details?: any) {
    super('AFILIADOS_PERSONAL_CONNECTION_ERROR', message, details);
  }
}

export class AfiliadosPersonalDataNotFoundError extends DomainError {
  constructor(searchCriteria: any, details?: any) {
    super('AFILIADOS_PERSONAL_DATA_NOT_FOUND', 'No se encontraron datos de personal con los criterios especificados', { searchCriteria, ...details });
  }
}

// Errores de sistema y operaciones
export class AfiliadosPersonalSystemError extends DomainError {
  constructor(message: string = 'Error interno del sistema de personal', details?: any) {
    super('AFILIADOS_PERSONAL_SYSTEM_ERROR', message, details);
  }
}

export class AfiliadosPersonalTimeoutError extends DomainError {
  constructor(operation: string, timeoutMs: number, details?: any) {
    super('AFILIADOS_PERSONAL_TIMEOUT', `Timeout en operación ${operation} después de ${timeoutMs}ms`, { operation, timeoutMs, ...details });
  }
}