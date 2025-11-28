import { FastifyReply } from 'fastify';
import pino from 'pino';
import { fail } from '../../../../utils/http.js';
import {
  IndicadorAnualError,
  IndicadorAnualNotFoundError,
  IndicadorAnualAlreadyExistsError,
  InvalidIndicadorAnualNombreError,
  InvalidIndicadorAnualDescripcionError,
  IndicadorAnualPermissionError,
  IndicadorAnualInUseError
} from '../domain/errors.js';

const logger = pino({
  name: 'indicadorAnualErrorHandler',
  level: process.env.LOG_LEVEL || 'info'
});

/**
 * Manejador centralizado de errores para el módulo IndicadorAnual
 * Proporciona logging estructurado y respuestas HTTP seguras
 */
export function handleIndicadorAnualError(error: any, reply: FastifyReply): FastifyReply {
  const logContext = {
    module: 'tablero.indicador-anual',
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
  }, 'Error en módulo IndicadorAnual');

  // Manejo específico de errores del dominio IndicadorAnual
  if (error instanceof IndicadorAnualNotFoundError) {
    return reply.code(404).send(fail(error.code, error.message));
  }

  if (error instanceof IndicadorAnualAlreadyExistsError) {
    return reply.code(409).send(fail(error.code, error.message));
  }

  if (error instanceof InvalidIndicadorAnualNombreError ||
      error instanceof InvalidIndicadorAnualDescripcionError) {
    return reply.code(400).send(fail(error.code, error.message));
  }

  if (error instanceof IndicadorAnualInUseError) {
    return reply.code(409).send(fail(error.code, error.message));
  }

  if (error instanceof IndicadorAnualPermissionError) {
    return reply.code(403).send(fail(error.code, error.message));
  }

  // Manejo de errores genéricos del dominio
  if (error instanceof IndicadorAnualError) {
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
  }, 'Error no manejado en módulo IndicadorAnual');

  return reply.code(500).send(fail('INTERNAL_ERROR', 'Error interno del servidor'));
}