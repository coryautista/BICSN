import { FastifyReply } from 'fastify';
import { DomainError } from '../../../utils/errors.js';
import pino from 'pino';
import { fail } from '../../../utils/http.js';
import {
  UserAlreadyExistsError,
  InvalidRegistrationDataError,
  WeakPasswordError,
  InvalidEmailFormatError,
  InvalidCredentialsError,
  UserNotFoundError,
  AccountLockedError,
  AccountDisabledError,
  InvalidTokenError,
  ExpiredTokenError,
  RevokedTokenError,
  MissingTokenError,
  InsufficientPermissionsError,
  UnauthorizedAccessError,
  AuthSystemError,
  AuthConnectionError,
  AuthTimeoutError,
  RateLimitExceededError,
  SuspiciousActivityError,
  RegistrationFailedError,
  LoginFailedError,
  TokenRefreshFailedError,
  LogoutFailedError
} from '../domain/errors.js';

const logger = pino({
  name: 'auth-errorHandler',
  level: process.env.LOG_LEVEL || 'info'
});

/**
 * Handler centralizado para errores del módulo Auth
 * Mapea errores de dominio a respuestas HTTP apropiadas con logging estructurado
 * NOTA: El logging de errores de autenticación debe ser cuidadoso para no exponer
 * información sensible que pueda ayudar en ataques
 */
export function handleAuthError(error: any, reply: FastifyReply): FastifyReply {
  const logContext = {
    module: 'auth',
    errorType: error.constructor.name,
    errorCode: error.code || 'UNKNOWN_ERROR',
    timestamp: new Date().toISOString()
  };

  // Logging estructurado según tipo de error
  // Para errores de seguridad, usar warn en lugar de error para evitar alertas excesivas
  if (error instanceof UserAlreadyExistsError) {
    logger.warn({
      ...logContext,
      field: error.details?.field,
      // No loggear el identificador específico por seguridad
    }, 'Intento de registro con usuario existente');
    return reply.code(409).send(fail('USER_ALREADY_EXISTS', 'Ya existe un usuario con estos datos'));
  }

  if (error instanceof InvalidRegistrationDataError) {
    logger.warn(logContext, 'Datos de registro inválidos');
    return reply.code(400).send(fail('INVALID_REGISTRATION_DATA', error.message));
  }

  if (error instanceof WeakPasswordError) {
    logger.warn(logContext, 'Intento de registro con contraseña débil');
    return reply.code(400).send(fail('WEAK_PASSWORD', error.message));
  }

  if (error instanceof InvalidEmailFormatError) {
    logger.warn(logContext, 'Formato de email inválido en registro');
    return reply.code(400).send(fail('INVALID_EMAIL_FORMAT', 'Formato de email inválido'));
  }

  if (error instanceof InvalidCredentialsError) {
    logger.warn({
      ...logContext,
      ip: error.details?.ip,
      userAgent: error.details?.userAgent
    }, 'Credenciales inválidas');
    return reply.code(401).send(fail('INVALID_CREDENTIALS', 'Credenciales inválidas'));
  }

  if (error instanceof UserNotFoundError) {
    logger.warn(logContext, 'Usuario no encontrado');
    return reply.code(401).send(fail('INVALID_CREDENTIALS', 'Credenciales inválidas'));
  }

  if (error instanceof AccountLockedError) {
    logger.warn({
      ...logContext,
      userId: error.details?.userId,
      lockoutEnd: error.details?.lockoutEnd
    }, 'Cuenta bloqueada por intentos fallidos');
    return reply.code(423).send(fail('ACCOUNT_LOCKED', 'Cuenta bloqueada temporalmente'));
  }

  if (error instanceof AccountDisabledError) {
    logger.warn({
      ...logContext,
      userId: error.details?.userId
    }, 'Intento de acceso a cuenta deshabilitada');
    return reply.code(401).send(fail('ACCOUNT_DISABLED', 'Cuenta deshabilitada'));
  }

  if (error instanceof InvalidTokenError) {
    logger.warn({
      ...logContext,
      tokenType: error.details?.tokenType
    }, 'Token inválido o malformado');
    return reply.code(401).send(fail('INVALID_TOKEN', 'Token inválido'));
  }

  if (error instanceof ExpiredTokenError) {
    logger.info({
      ...logContext,
      tokenType: error.details?.tokenType
    }, 'Token expirado');
    return reply.code(401).send(fail('EXPIRED_TOKEN', 'Token expirado'));
  }

  if (error instanceof RevokedTokenError) {
    logger.info({
      ...logContext,
      tokenType: error.details?.tokenType,
      jti: error.details?.jti
    }, 'Token revocado');
    return reply.code(401).send(fail('REVOKED_TOKEN', 'Token revocado'));
  }

  if (error instanceof MissingTokenError) {
    logger.warn({
      ...logContext,
      tokenType: error.details?.tokenType
    }, 'Token requerido faltante');
    return reply.code(401).send(fail('MISSING_TOKEN', 'Token requerido'));
  }

  if (error instanceof InsufficientPermissionsError) {
    logger.warn({
      ...logContext,
      requiredRoles: error.details?.requiredRoles,
      userRoles: error.details?.userRoles
    }, 'Permisos insuficientes');
    return reply.code(403).send(fail('INSUFFICIENT_PERMISSIONS', 'Permisos insuficientes'));
  }

  if (error instanceof UnauthorizedAccessError) {
    logger.warn({
      ...logContext,
      resource: error.details?.resource
    }, 'Acceso no autorizado');
    return reply.code(403).send(fail('UNAUTHORIZED_ACCESS', 'Acceso no autorizado'));
  }

  if (error instanceof RateLimitExceededError) {
    logger.warn({
      ...logContext,
      identifier: error.details?.identifier,
      limit: error.details?.limit,
      windowMs: error.details?.windowMs
    }, 'Límite de solicitudes excedido');
    return reply.code(429).send(fail('RATE_LIMIT_EXCEEDED', 'Demasiadas solicitudes'));
  }

  if (error instanceof SuspiciousActivityError) {
    logger.error({
      ...logContext,
      activity: error.details?.activity,
      userId: error.details?.userId,
      ip: error.details?.ip
    }, 'Actividad sospechosa detectada');
    return reply.code(403).send(fail('SUSPICIOUS_ACTIVITY', 'Actividad sospechosa detectada'));
  }

  if (error instanceof AuthConnectionError) {
    logger.error({
      ...logContext,
      stack: error.stack
    }, 'Error de conexión con sistema de autenticación');
    return reply.code(503).send(fail('AUTH_CONNECTION_ERROR', 'Servicio temporalmente no disponible'));
  }

  if (error instanceof AuthTimeoutError) {
    logger.error({
      ...logContext,
      operation: error.details?.operation,
      timeoutMs: error.details?.timeoutMs,
      stack: error.stack
    }, 'Timeout en operación de autenticación');
    return reply.code(504).send(fail('AUTH_TIMEOUT', 'Operación expirada'));
  }

  if (error instanceof RegistrationFailedError) {
    logger.error({
      ...logContext,
      reason: error.details?.reason,
      stack: error.stack
    }, 'Registro de usuario fallido');
    return reply.code(500).send(fail('REGISTRATION_FAILED', 'Error en el registro'));
  }

  if (error instanceof LoginFailedError) {
    logger.error({
      ...logContext,
      reason: error.details?.reason,
      stack: error.stack
    }, 'Inicio de sesión fallido');
    return reply.code(500).send(fail('LOGIN_FAILED', 'Error en el inicio de sesión'));
  }

  if (error instanceof TokenRefreshFailedError) {
    logger.error({
      ...logContext,
      reason: error.details?.reason,
      stack: error.stack
    }, 'Refresco de token fallido');
    return reply.code(500).send(fail('TOKEN_REFRESH_FAILED', 'Error al refrescar token'));
  }

  if (error instanceof LogoutFailedError) {
    logger.error({
      ...logContext,
      reason: error.details?.reason,
      stack: error.stack
    }, 'Cierre de sesión fallido');
    return reply.code(500).send(fail('LOGOUT_FAILED', 'Error en el cierre de sesión'));
  }

  if (error instanceof AuthSystemError) {
    logger.error({
      ...logContext,
      stack: error.stack
    }, 'Error interno del sistema de autenticación');
    return reply.code(500).send(fail('AUTH_SYSTEM_ERROR', 'Error interno del servidor'));
  }

  // Errores de dominio genéricos
  if (error instanceof DomainError) {
    logger.error({
      ...logContext,
      stack: error.stack
    }, 'Error de dominio no manejado específicamente');
    return reply.code(500).send(fail(error.code, error.message));
  }

  // Errores genéricos no tipados
  logger.error({
    ...logContext,
    errorMessage: error.message,
    stack: error.stack
  }, 'Error inesperado en módulo auth');

  return reply.code(500).send(fail('AUTH_INTERNAL_ERROR', 'Error interno del servidor'));
}