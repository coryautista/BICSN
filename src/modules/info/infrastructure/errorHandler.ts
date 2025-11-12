import { FastifyReply } from 'fastify';
import pino from 'pino';
import {
  InfoError,
  InfoNotFoundError,
  InfoAlreadyExistsError,
  InvalidInfoNameError,
  InvalidInfoColorError,
  InvalidInfoIdError,
  InfoCreationDataMissingError,
  InfoRepositoryError
} from '../domain/errors.js';

const logger = pino({
  name: 'infoErrorHandler',
  level: process.env.LOG_LEVEL || 'info'
});

/**
 * Manejador centralizado de errores para el módulo Info
 * Proporciona logging estructurado y respuestas HTTP seguras
 */
export function handleInfoError(error: any, reply: FastifyReply): FastifyReply {
  // Log del error con contexto estructurado
  logger.error({
    error: {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack
    },
    module: 'info',
    timestamp: new Date().toISOString()
  }, 'Error en módulo Info');

  // Manejo específico de errores del dominio Info
  if (error instanceof InfoNotFoundError) {
    return reply.code(404).send({
      ok: false,
      error: {
        code: error.code,
        message: error.message
      }
    });
  }

  if (error instanceof InfoAlreadyExistsError) {
    return reply.code(409).send({
      ok: false,
      error: {
        code: error.code,
        message: error.message
      }
    });
  }

  if (error instanceof InvalidInfoNameError ||
      error instanceof InvalidInfoColorError ||
      error instanceof InvalidInfoIdError ||
      error instanceof InfoCreationDataMissingError) {
    return reply.code(400).send({
      ok: false,
      error: {
        code: error.code,
        message: error.message
      }
    });
  }

  if (error instanceof InfoRepositoryError) {
    return reply.code(500).send({
      ok: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error interno del servidor'
      }
    });
  }

  // Manejo de errores genéricos del dominio
  if (error instanceof InfoError) {
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
    module: 'info',
    timestamp: new Date().toISOString()
  }, 'Error no manejado en módulo Info');

  return reply.code(500).send({
    ok: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Error interno del servidor'
    }
  });
}