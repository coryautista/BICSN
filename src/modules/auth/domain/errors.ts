import { DomainError } from '../../../utils/errors.js';

// Errores de registro de usuarios
export class UserAlreadyExistsError extends DomainError {
  constructor(identifier: string, field: string = 'username', details?: any) {
    super('USER_ALREADY_EXISTS', `Ya existe un usuario con ${field}: ${identifier}`, { identifier, field, ...details });
  }
}

export class InvalidRegistrationDataError extends DomainError {
  constructor(message: string = 'Datos de registro inválidos', details?: any) {
    super('INVALID_REGISTRATION_DATA', message, details);
  }
}

export class WeakPasswordError extends DomainError {
  constructor(details?: any) {
    super('WEAK_PASSWORD', 'La contraseña no cumple con los requisitos de seguridad', details);
  }
}

export class InvalidEmailFormatError extends DomainError {
  constructor(email: string, details?: any) {
    super('INVALID_EMAIL_FORMAT', `Formato de email inválido: ${email}`, { email, ...details });
  }
}

// Errores de autenticación y login
export class InvalidCredentialsError extends DomainError {
  constructor(details?: any) {
    super('INVALID_CREDENTIALS', 'Credenciales de acceso inválidas', details);
  }
}

export class UserNotFoundError extends DomainError {
  constructor(identifier: string, details?: any) {
    super('USER_NOT_FOUND', `Usuario no encontrado: ${identifier}`, { identifier, ...details });
  }
}

export class AccountLockedError extends DomainError {
  constructor(userId: string, lockoutEnd?: Date, details?: any) {
    super('ACCOUNT_LOCKED', 'Cuenta bloqueada temporalmente por intentos fallidos de acceso', {
      userId,
      lockoutEnd: lockoutEnd?.toISOString(),
      ...details
    });
  }
}

export class AccountDisabledError extends DomainError {
  constructor(userId: string, details?: any) {
    super('ACCOUNT_DISABLED', 'Cuenta de usuario deshabilitada', { userId, ...details });
  }
}

// Errores de tokens JWT
export class InvalidTokenError extends DomainError {
  constructor(tokenType: string = 'token', details?: any) {
    super('INVALID_TOKEN', `${tokenType} inválido o malformado`, { tokenType, ...details });
  }
}

export class ExpiredTokenError extends DomainError {
  constructor(tokenType: string = 'token', details?: any) {
    super('EXPIRED_TOKEN', `${tokenType} expirado`, { tokenType, ...details });
  }
}

export class RevokedTokenError extends DomainError {
  constructor(tokenType: string = 'token', jti?: string, details?: any) {
    super('REVOKED_TOKEN', `${tokenType} revocado`, { tokenType, jti, ...details });
  }
}

export class MissingTokenError extends DomainError {
  constructor(tokenType: string = 'token', details?: any) {
    super('MISSING_TOKEN', `${tokenType} requerido pero no proporcionado`, { tokenType, ...details });
  }
}

// Errores de permisos y autorización
export class InsufficientPermissionsError extends DomainError {
  constructor(requiredRoles?: string[], userRoles?: string[], details?: any) {
    super('INSUFFICIENT_PERMISSIONS', 'Permisos insuficientes para realizar esta acción', {
      requiredRoles,
      userRoles,
      ...details
    });
  }
}

export class UnauthorizedAccessError extends DomainError {
  constructor(resource?: string, details?: any) {
    super('UNAUTHORIZED_ACCESS', `Acceso no autorizado${resource ? ` a: ${resource}` : ''}`, { resource, ...details });
  }
}

// Errores de sistema y seguridad
export class AuthSystemError extends DomainError {
  constructor(message: string = 'Error interno del sistema de autenticación', details?: any) {
    super('AUTH_SYSTEM_ERROR', message, details);
  }
}

export class AuthConnectionError extends DomainError {
  constructor(message: string = 'Error de conexión con el sistema de autenticación', details?: any) {
    super('AUTH_CONNECTION_ERROR', message, details);
  }
}

export class AuthTimeoutError extends DomainError {
  constructor(operation: string, timeoutMs: number, details?: any) {
    super('AUTH_TIMEOUT', `Timeout en operación de autenticación ${operation} después de ${timeoutMs}ms`, {
      operation,
      timeoutMs,
      ...details
    });
  }
}

export class RateLimitExceededError extends DomainError {
  constructor(identifier: string, limit: number, windowMs: number, details?: any) {
    super('RATE_LIMIT_EXCEEDED', `Límite de solicitudes excedido para ${identifier}. Máximo ${limit} solicitudes por ${windowMs}ms`, {
      identifier,
      limit,
      windowMs,
      ...details
    });
  }
}

export class SuspiciousActivityError extends DomainError {
  constructor(activity: string, userId?: string, ip?: string, details?: any) {
    super('SUSPICIOUS_ACTIVITY', `Actividad sospechosa detectada: ${activity}`, {
      activity,
      userId,
      ip,
      ...details
    });
  }
}

// Errores específicos de operaciones
export class RegistrationFailedError extends DomainError {
  constructor(reason: string, details?: any) {
    super('REGISTRATION_FAILED', `Registro de usuario fallido: ${reason}`, { reason, ...details });
  }
}

export class LoginFailedError extends DomainError {
  constructor(reason: string, details?: any) {
    super('LOGIN_FAILED', `Inicio de sesión fallido: ${reason}`, { reason, ...details });
  }
}

export class TokenRefreshFailedError extends DomainError {
  constructor(reason: string, details?: any) {
    super('TOKEN_REFRESH_FAILED', `Refresco de token fallido: ${reason}`, { reason, ...details });
  }
}

export class LogoutFailedError extends DomainError {
  constructor(reason: string, details?: any) {
    super('LOGOUT_FAILED', `Cierre de sesión fallido: ${reason}`, { reason, ...details });
  }
}