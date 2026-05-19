import { FastifyReply } from 'fastify';
import { DomainError } from '../../../utils/errors.js';
import pino from 'pino';
import { fail } from '../../../utils/http.js';
import {
  AuditLogAccessDeniedError,
  AuditLogInsufficientPermissionsError,
  AuditLogInvalidDateRangeError,
  AuditLogInvalidDateFormatError,
  AuditLogDateRangeTooLargeError,
  AuditLogFutureDateError,
  AuditLogQueryFailedError,
  AuditLogConnectionError,
  AuditLogDataNotFoundError,
  AuditLogSystemError,
  AuditLogTimeoutError,
  AuditLogRateLimitExceededError
} from '../domain/errors.js';

const logger = pino({
  name: 'auditLog-errorHandler',
  level: process.env.LOG_LEVEL || 'info'
});

/**
 * Handler centralizado para errores del módulo AuditLog
 * Mapea errores de dominio a respuestas HTTP apropiadas con logging estructurado
 */
export function handleAuditLogError(error: any, reply: FastifyReply): FastifyReply {
  const logContext = {
    module: 'auditLog',
    errorType: error.constructor.name,
    errorCode: error.code || 'UNKNOWN_ERROR',
    timestamp: new Date().toISOString()
  };

  // Logging estructurado según tipo de error
  if (error instanceof AuditLogAccessDeniedError) {
    logger.warn({ ...logContext, userId: error.details?.userId }, 'Acceso denegado a logs de auditoría');
    return reply.code(403).send(fail('AUDIT_LOG_ACCESS_DENIED', error.message));
  }

  if (error instanceof AuditLogInsufficientPermissionsError) {
    logger.warn({
      ...logContext,
      userId: error.details?.userId,
      userRole: error.details?.userRole
    }, 'Permisos insuficientes para acceder a logs de auditoría');
    return reply.code(403).send(fail('AUDIT_LOG_INSUFFICIENT_PERMISSIONS', error.message));
  }

  if (error instanceof AuditLogInvalidDateRangeError) {
    logger.warn({
      ...logContext,
      fechaInicio: error.details?.fechaInicio,
      fechaFin: error.details?.fechaFin
    }, 'Rango de fechas inválido');
    return reply.code(400).send(fail('AUDIT_LOG_INVALID_DATE_RANGE', error.message));
  }

  if (error instanceof AuditLogInvalidDateFormatError) {
    logger.warn({ ...logContext, dateString: error.details?.dateString }, 'Formato de fecha inválido');
    return reply.code(400).send(fail('AUDIT_LOG_INVALID_DATE_FORMAT', error.message));
  }

  if (error instanceof AuditLogDateRangeTooLargeError) {
    logger.warn({
      ...logContext,
      fechaInicio: error.details?.fechaInicio,
      fechaFin: error.details?.fechaFin,
      maxDays: error.details?.maxDays,
      actualDays: error.details?.actualDays
    }, 'Rango de fechas demasiado grande');
    return reply.code(400).send(fail('AUDIT_LOG_DATE_RANGE_TOO_LARGE', error.message));
  }

  if (error instanceof AuditLogFutureDateError) {
    logger.warn({ ...logContext, dateString: error.details?.dateString }, 'Consulta de fecha futura');
    return reply.code(400).send(fail('AUDIT_LOG_FUTURE_DATE', error.message));
  }

  if (error instanceof AuditLogQueryFailedError) {
    logger.error({
      ...logContext,
      operation: error.details?.operation,
      stack: error.stack
    }, 'Error en consulta de logs de auditoría');
    return reply.code(500).send(fail('AUDIT_LOG_QUERY_FAILED', error.message));
  }

  if (error instanceof AuditLogConnectionError) {
    logger.error({
      ...logContext,
      stack: error.stack
    }, 'Error de conexión con base de datos de auditoría');
    return reply.code(503).send(fail('AUDIT_LOG_CONNECTION_ERROR', error.message));
  }

  if (error instanceof AuditLogDataNotFoundError) {
    logger.info({
      ...logContext,
      searchCriteria: error.details?.searchCriteria
    }, 'No se encontraron logs de auditoría');
    return reply.code(404).send(fail('AUDIT_LOG_DATA_NOT_FOUND', error.message));
  }

  if (error instanceof AuditLogTimeoutError) {
    logger.error({
      ...logContext,
      operation: error.details?.operation,
      timeoutMs: error.details?.timeoutMs,
      stack: error.stack
    }, 'Timeout en operación de auditoría');
    return reply.code(504).send(fail('AUDIT_LOG_TIMEOUT', error.message));
  }

  if (error instanceof AuditLogRateLimitExceededError) {
    logger.warn({
      ...logContext,
      userId: error.details?.userId,
      limit: error.details?.limit,
      windowMs: error.details?.windowMs
    }, 'Límite de consultas excedido');
    return reply.code(429).send(fail('AUDIT_LOG_RATE_LIMIT_EXCEEDED', error.message));
  }

  if (error instanceof AuditLogSystemError) {
    logger.error({
      ...logContext,
      stack: error.stack
    }, 'Error interno del sistema de auditoría');
    return reply.code(500).send(fail('AUDIT_LOG_SYSTEM_ERROR', error.message));
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
  }, 'Error inesperado en módulo auditLog');

  return reply.code(500).send(fail('AUDIT_LOG_INTERNAL_ERROR', 'Error interno del servidor'));
}