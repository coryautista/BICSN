import { FastifyReply } from 'fastify';
import pino from 'pino';
import { fail } from '../../../../utils/http.js';
import {
  LineaEstrategicaError,
  LineaEstrategicaNotFoundError,
  LineaEstrategicaAlreadyExistsError,
  InvalidLineaEstrategicaNombreError,
  InvalidLineaEstrategicaDescripcionError,
  LineaEstrategicaPermissionError,
  LineaEstrategicaInUseError
} from '../domain/errors.js';

const logger = pino({
  name: 'lineaEstrategicaErrorHandler',
  level: process.env.LOG_LEVEL || 'info'
});

/**
 * Manejador centralizado de errores para el módulo LineaEstrategica
 * Proporciona logging estructurado y respuestas HTTP seguras
 */
export function handleLineaEstrategicaError(error: any, reply: FastifyReply): FastifyReply {
  const logContext = {
    module: 'tablero.linea-estrategica',
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
  }, 'Error en módulo LineaEstrategica');

  // Manejo específico de errores del dominio LineaEstrategica
  if (error instanceof LineaEstrategicaNotFoundError) {
    return reply.code(404).send(fail(error.code, error.message));
  }

  if (error instanceof LineaEstrategicaAlreadyExistsError) {
    return reply.code(409).send(fail(error.code, error.message));
  }

  if (error instanceof InvalidLineaEstrategicaNombreError ||
      error instanceof InvalidLineaEstrategicaDescripcionError) {
    return reply.code(400).send(fail(error.code, error.message));
  }

  if (error instanceof LineaEstrategicaInUseError) {
    return reply.code(409).send(fail(error.code, error.message));
  }

  if (error instanceof LineaEstrategicaPermissionError) {
    return reply.code(403).send(fail(error.code, error.message));
  }

  // Manejo de errores genéricos del dominio
  if (error instanceof LineaEstrategicaError) {
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
  }, 'Error no manejado en módulo LineaEstrategica');

  return reply.code(500).send(fail('INTERNAL_ERROR', 'Error interno del servidor'));
}