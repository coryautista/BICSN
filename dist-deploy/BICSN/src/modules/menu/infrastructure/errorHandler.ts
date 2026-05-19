import { FastifyReply } from 'fastify';
import pino from 'pino';
import { fail } from '../../../utils/http.js';
import {
  MenuError,
  MenuNotFoundError,
  MenuAlreadyExistsError,
  MenuInvalidNameError,
  MenuInvalidComponentError,
  MenuInvalidOrderError,
  MenuInvalidParentError,
  MenuHierarchyCycleError,
  MenuHasChildrenError,
  MenuPermissionError
} from '../domain/errors.js';

const logger = pino({
  name: 'menuErrorHandler',
  level: process.env.LOG_LEVEL || 'info'
});

/**
 * Manejador centralizado de errores para el módulo Menu
 * Proporciona logging estructurado y respuestas HTTP seguras
 */
export function handleMenuError(error: any, reply: FastifyReply): FastifyReply {
  const logContext = {
    module: 'menu',
    errorType: error.constructor.name,
    errorCode: error.code || 'UNKNOWN_ERROR',
    timestamp: new Date().toISOString()
  };

  // Log del error con contexto estructurado
  logger.error({
    ...logContext,
    error: {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack
    },
    timestamp: new Date().toISOString()
  }, 'Error en módulo Menu');

  // Manejo específico de errores del dominio Menu
  if (error instanceof MenuNotFoundError) {
    return reply.code(404).send(fail(error.code, error.message));
  }

  if (error instanceof MenuAlreadyExistsError) {
    return reply.code(409).send(fail(error.code, error.message));
  }

  if (error instanceof MenuInvalidNameError ||
      error instanceof MenuInvalidComponentError ||
      error instanceof MenuInvalidOrderError ||
      error instanceof MenuInvalidParentError ||
      error instanceof MenuHierarchyCycleError) {
    return reply.code(400).send(fail(error.code, error.message));
  }

  if (error instanceof MenuHasChildrenError) {
    return reply.code(409).send(fail(error.code, error.message));
  }

  if (error instanceof MenuPermissionError) {
    return reply.code(403).send(fail(error.code, error.message));
  }

  // Manejo de errores genéricos del dominio
  if (error instanceof MenuError) {
    return reply.code(400).send(fail(error.code, error.message));
  }

  // Error genérico no manejado
  logger.error({
    ...logContext,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    },
    timestamp: new Date().toISOString()
  }, 'Error no manejado en módulo Menu');

  return reply.code(500).send(fail('INTERNAL_ERROR', 'Error interno del servidor'));
}