import { DomainError } from '../../../utils/errors.js';

// Errores de permisos y acceso
export class AuditLogAccessDeniedError extends DomainError {
  constructor(message: string = 'Acceso denegado a logs de auditoría. Se requiere rol de administrador', details?: any) {
    super('AUDIT_LOG_ACCESS_DENIED', message, details);
  }
}

export class AuditLogInsufficientPermissionsError extends DomainError {
  constructor(userRole?: string, details?: any) {
    super('AUDIT_LOG_INSUFFICIENT_PERMISSIONS', `Permisos insuficientes para acceder a logs de auditoría. Rol actual: ${userRole || 'desconocido'}`, { userRole, ...details });
  }
}

// Errores de validación de fechas
export class AuditLogInvalidDateRangeError extends DomainError {
  constructor(fechaInicio: string, fechaFin: string, details?: any) {
    super('AUDIT_LOG_INVALID_DATE_RANGE', `Rango de fechas inválido: ${fechaInicio} - ${fechaFin}`, { fechaInicio, fechaFin, ...details });
  }
}

export class AuditLogInvalidDateFormatError extends DomainError {
  constructor(dateString: string, details?: any) {
    super('AUDIT_LOG_INVALID_DATE_FORMAT', `Formato de fecha inválido: ${dateString}`, { dateString, ...details });
  }
}

export class AuditLogDateRangeTooLargeError extends DomainError {
  constructor(fechaInicio: string, fechaFin: string, maxDays: number, actualDays: number, details?: any) {
    super('AUDIT_LOG_DATE_RANGE_TOO_LARGE', `Rango de fechas demasiado grande. Máximo ${maxDays} días, solicitado ${actualDays} días`, {
      fechaInicio,
      fechaFin,
      maxDays,
      actualDays,
      ...details
    });
  }
}

export class AuditLogFutureDateError extends DomainError {
  constructor(dateString: string, details?: any) {
    super('AUDIT_LOG_FUTURE_DATE', `No se pueden consultar logs de fechas futuras: ${dateString}`, { dateString, ...details });
  }
}

// Errores de consulta y base de datos
export class AuditLogQueryFailedError extends DomainError {
  constructor(operation: string, details?: any) {
    super('AUDIT_LOG_QUERY_FAILED', `Error al ejecutar consulta de logs de auditoría: ${operation}`, { operation, ...details });
  }
}

export class AuditLogConnectionError extends DomainError {
  constructor(message: string = 'Error de conexión con base de datos de auditoría', details?: any) {
    super('AUDIT_LOG_CONNECTION_ERROR', message, details);
  }
}

export class AuditLogDataNotFoundError extends DomainError {
  constructor(searchCriteria: any, details?: any) {
    super('AUDIT_LOG_DATA_NOT_FOUND', 'No se encontraron logs de auditoría para los criterios especificados', { searchCriteria, ...details });
  }
}

// Errores de sistema y operaciones
export class AuditLogSystemError extends DomainError {
  constructor(message: string = 'Error interno del sistema de auditoría', details?: any) {
    super('AUDIT_LOG_SYSTEM_ERROR', message, details);
  }
}

export class AuditLogTimeoutError extends DomainError {
  constructor(operation: string, timeoutMs: number, details?: any) {
    super('AUDIT_LOG_TIMEOUT', `Timeout en operación de auditoría ${operation} después de ${timeoutMs}ms`, { operation, timeoutMs, ...details });
  }
}

export class AuditLogRateLimitExceededError extends DomainError {
  constructor(userId: string, limit: number, windowMs: number, details?: any) {
    super('AUDIT_LOG_RATE_LIMIT_EXCEEDED', `Límite de consultas excedido para usuario ${userId}. Máximo ${limit} consultas por ${windowMs}ms`, {
      userId,
      limit,
      windowMs,
      ...details
    });
  }
}