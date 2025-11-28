import { FastifyReply } from 'fastify';
import pino from 'pino';
import { fail } from '../../../../utils/http.js';
import {
  UnidadMedidaError,
  UnidadMedidaNotFoundError,
  UnidadMedidaAlreadyExistsError,
  InvalidUnidadMedidaNombreError,
  InvalidUnidadMedidaDescripcionError,
  UnidadMedidaPermissionError,
  UnidadMedidaInUseError
} from '../domain/errors.js';

const logger = pino({
  name: 'unidadMedidaErrorHandler',
  level: process.env.LOG_LEVEL || 'info'
});

/**
 * Manejador centralizado de errores para el módulo UnidadMedida
 * Proporciona logging estructurado y respuestas HTTP seguras
 */
export function handleUnidadMedidaError(error: any, reply: FastifyReply): FastifyReply {
  const logContext = {
    module: 'tablero.unidad-medida',
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
  }, 'Error en módulo UnidadMedida');

  // Manejo específico de errores del dominio UnidadMedida
  if (error instanceof UnidadMedidaNotFoundError) {
    return reply.code(404).send(fail(error.code, error.message));
  }

  if (error instanceof UnidadMedidaAlreadyExistsError) {
    return reply.code(409).send(fail(error.code, error.message));
  }

  if (error instanceof InvalidUnidadMedidaNombreError ||
      error instanceof InvalidUnidadMedidaDescripcionError) {
    return reply.code(400).send(fail(error.code, error.message));
  }

  if (error instanceof UnidadMedidaInUseError) {
    return reply.code(409).send(fail(error.code, error.message));
  }

  if (error instanceof UnidadMedidaPermissionError) {
    return reply.code(403).send(fail(error.code, error.message));
  }

  // Manejo de errores genéricos del dominio
  if (error instanceof UnidadMedidaError) {
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
  }, 'Error no manejado en módulo UnidadMedida');

  return reply.code(500).send(fail('INTERNAL_ERROR', 'Error interno del servidor'));
}