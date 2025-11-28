import { FastifyReply } from 'fastify';
import pino from 'pino';
import { fail } from '../../../../utils/http.js';
import {
  DimensionError,
  DimensionNotFoundError,
  DimensionAlreadyExistsError,
  InvalidDimensionNombreError,
  InvalidDimensionDescripcionError,
  DimensionPermissionError,
  DimensionInUseError
} from '../domain/errors.js';

const logger = pino({
  name: 'dimensionErrorHandler',
  level: process.env.LOG_LEVEL || 'info'
});

/**
 * Manejador centralizado de errores para el módulo Dimension
 * Proporciona logging estructurado y respuestas HTTP seguras
 */
export function handleDimensionError(error: any, reply: FastifyReply): FastifyReply {
  const logContext = {
    module: 'tablero.dimension',
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
  }, 'Error en módulo Dimension');

  // Manejo específico de errores del dominio Dimension
  if (error instanceof DimensionNotFoundError) {
    return reply.code(404).send(fail(error.code, error.message));
  }

  if (error instanceof DimensionAlreadyExistsError) {
    return reply.code(409).send(fail(error.code, error.message));
  }

  if (error instanceof InvalidDimensionNombreError ||
      error instanceof InvalidDimensionDescripcionError) {
    return reply.code(400).send(fail(error.code, error.message));
  }

  if (error instanceof DimensionInUseError) {
    return reply.code(409).send(fail(error.code, error.message));
  }

  if (error instanceof DimensionPermissionError) {
    return reply.code(403).send(fail(error.code, error.message));
  }

  // Manejo de errores genéricos del dominio
  if (error instanceof DimensionError) {
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
  }, 'Error no manejado en módulo Dimension');

  return reply.code(500).send(fail('INTERNAL_ERROR', 'Error interno del servidor'));
}