import { FastifyReply } from 'fastify';
import { DomainError } from '../../../utils/errors.js';
import pino from 'pino';
import { fail } from '../../../utils/http.js';
import {
  AfiliadosPersonalAccessDeniedError,
  AfiliadosPersonalInvalidCredentialsError,
  AfiliadosPersonalInvalidSearchTermError,
  AfiliadosPersonalInvalidClaveOrganicaError,
  AfiliadosPersonalQueryFailedError,
  AfiliadosPersonalConnectionError,
  AfiliadosPersonalDataNotFoundError,
  AfiliadosPersonalSystemError,
  AfiliadosPersonalTimeoutError
} from '../domain/errors.js';

const logger = pino({
  name: 'afiliadosPersonal-errorHandler',
  level: process.env.LOG_LEVEL || 'info'
});

/**
 * Handler centralizado para errores del módulo AfiliadosPersonal
 * Mapea errores de dominio a respuestas HTTP apropiadas con logging estructurado
 */
export function handleAfiliadosPersonalError(error: any, reply: FastifyReply): FastifyReply {
  const logContext = {
    module: 'afiliadosPersonal',
    errorType: error.constructor.name,
    errorCode: error.code || 'UNKNOWN_ERROR',
    timestamp: new Date().toISOString()
  };

  // Logging estructurado según tipo de error
  if (error instanceof AfiliadosPersonalAccessDeniedError) {
    logger.warn({ ...logContext, userId: error.details?.userId }, 'Acceso denegado a información de personal');
    return reply.code(403).send(fail('AFILIADOS_PERSONAL_ACCESS_DENIED', error.message));
  }

  if (error instanceof AfiliadosPersonalInvalidCredentialsError) {
    logger.warn({ ...logContext, userId: error.details?.userId }, 'Credenciales inválidas para consulta de personal');
    return reply.code(401).send(fail('AFILIADOS_PERSONAL_INVALID_CREDENTIALS', error.message));
  }

  if (error instanceof AfiliadosPersonalInvalidSearchTermError) {
    logger.warn({ ...logContext, searchTerm: error.details?.searchTerm }, 'Término de búsqueda inválido');
    return reply.code(400).send(fail('AFILIADOS_PERSONAL_INVALID_SEARCH_TERM', error.message));
  }

  if (error instanceof AfiliadosPersonalInvalidClaveOrganicaError) {
    logger.warn({
      ...logContext,
      claveOrganica: error.details?.claveOrganica,
      level: error.details?.level
    }, 'Clave orgánica inválida');
    return reply.code(400).send(fail('AFILIADOS_PERSONAL_INVALID_CLAVE_ORGANICA', error.message));
  }

  if (error instanceof AfiliadosPersonalQueryFailedError) {
    logger.error({
      ...logContext,
      operation: error.details?.operation,
      stack: error.stack
    }, 'Error en consulta de personal');
    return reply.code(500).send(fail('AFILIADOS_PERSONAL_QUERY_FAILED', error.message));
  }

  if (error instanceof AfiliadosPersonalConnectionError) {
    logger.error({
      ...logContext,
      stack: error.stack
    }, 'Error de conexión con base de datos de personal');
    return reply.code(503).send(fail('AFILIADOS_PERSONAL_CONNECTION_ERROR', error.message));
  }

  if (error instanceof AfiliadosPersonalDataNotFoundError) {
    logger.info({
      ...logContext,
      searchCriteria: error.details?.searchCriteria
    }, 'No se encontraron datos de personal');
    return reply.code(404).send(fail('AFILIADOS_PERSONAL_DATA_NOT_FOUND', error.message));
  }

  if (error instanceof AfiliadosPersonalTimeoutError) {
    logger.error({
      ...logContext,
      operation: error.details?.operation,
      timeoutMs: error.details?.timeoutMs,
      stack: error.stack
    }, 'Timeout en operación de personal');
    return reply.code(504).send(fail('AFILIADOS_PERSONAL_TIMEOUT', error.message));
  }

  if (error instanceof AfiliadosPersonalSystemError) {
    logger.error({
      ...logContext,
      stack: error.stack
    }, 'Error interno del sistema de personal');
    return reply.code(500).send(fail('AFILIADOS_PERSONAL_SYSTEM_ERROR', error.message));
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
  }, 'Error inesperado en módulo afiliadosPersonal');

  return reply.code(500).send(fail('AFILIADOS_PERSONAL_INTERNAL_ERROR', 'Error interno del servidor'));
}