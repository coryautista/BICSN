import { FastifyReply } from 'fastify';
import pino from 'pino';
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
  // Log del error con contexto estructurado
  logger.error({
    error: {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack
    },
    module: 'menu',
    timestamp: new Date().toISOString()
  }, 'Error en módulo Menu');

  // Manejo específico de errores del dominio Menu
  if (error instanceof MenuNotFoundError) {
    return reply.code(404).send({
      ok: false,
      error: {
        code: error.code,
        message: error.message
      }
    });
  }

  if (error instanceof MenuAlreadyExistsError) {
    return reply.code(409).send({
      ok: false,
      error: {
        code: error.code,
        message: error.message
      }
    });
  }

  if (error instanceof MenuInvalidNameError ||
      error instanceof MenuInvalidComponentError ||
      error instanceof MenuInvalidOrderError ||
      error instanceof MenuInvalidParentError ||
      error instanceof MenuHierarchyCycleError) {
    return reply.code(400).send({
      ok: false,
      error: {
        code: error.code,
        message: error.message
      }
    });
  }

  if (error instanceof MenuHasChildrenError) {
    return reply.code(409).send({
      ok: false,
      error: {
        code: error.code,
        message: error.message
      }
    });
  }

  if (error instanceof MenuPermissionError) {
    return reply.code(403).send({
      ok: false,
      error: {
        code: error.code,
        message: error.message
      }
    });
  }

  // Manejo de errores genéricos del dominio
  if (error instanceof MenuError) {
    return reply.code(400).send({
      ok: false,
      error: {
        code: error.code,
        message: error.message
      }
    });
  }

  // Error genérico no manejado
  logger.error({
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    },
    module: 'menu',
    timestamp: new Date().toISOString()
  }, 'Error no manejado en módulo Menu');

  return reply.code(500).send({
    ok: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Error interno del servidor'
    }
  });
}