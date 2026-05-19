import { FastifyReply } from 'fastify';
import pino from 'pino';
import { fail } from '../../../utils/http.js';
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
  const logContext = {
    module: 'info',
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
  }, 'Error en módulo Info');

  // Manejo específico de errores del dominio Info
  if (error instanceof InfoNotFoundError) {
    return reply.code(404).send(fail(error.code, error.message));
  }

  if (error instanceof InfoAlreadyExistsError) {
    return reply.code(409).send(fail(error.code, error.message));
  }

  if (error instanceof InvalidInfoNameError ||
      error instanceof InvalidInfoColorError ||
      error instanceof InvalidInfoIdError ||
      error instanceof InfoCreationDataMissingError) {
    return reply.code(400).send(fail(error.code, error.message));
  }

  if (error instanceof InfoRepositoryError) {
    return reply.code(500).send(fail('INTERNAL_ERROR', 'Error interno del servidor'));
  }

  // Manejo de errores genéricos del dominio
  if (error instanceof InfoError) {
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
  }, 'Error no manejado en módulo Info');

  return reply.code(500).send(fail('INTERNAL_ERROR', 'Error interno del servidor'));
}