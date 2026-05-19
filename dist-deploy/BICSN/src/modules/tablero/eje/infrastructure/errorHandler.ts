import { FastifyReply } from 'fastify';
import pino from 'pino';
import { fail } from '../../../../utils/http.js';
import {
  EjeError,
  EjeNotFoundError,
  EjeAlreadyExistsError,
  InvalidEjeNombreError,
  InvalidEjeDescripcionError,
  EjePermissionError,
  EjeInUseError
} from '../domain/errors.js';

const logger = pino({
  name: 'ejeErrorHandler',
  level: process.env.LOG_LEVEL || 'info'
});

/**
 * Manejador centralizado de errores para el módulo Eje
 * Proporciona logging estructurado y respuestas HTTP seguras
 */
export function handleEjeError(error: any, reply: FastifyReply): FastifyReply {
  const logContext = {
    module: 'tablero.eje',
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
  }, 'Error en módulo Eje');

  // Manejo específico de errores del dominio Eje
  if (error instanceof EjeNotFoundError) {
    return reply.code(404).send(fail(error.code, error.message));
  }

  if (error instanceof EjeAlreadyExistsError) {
    return reply.code(409).send(fail(error.code, error.message));
  }

  if (error instanceof InvalidEjeNombreError ||
      error instanceof InvalidEjeDescripcionError) {
    return reply.code(400).send(fail(error.code, error.message));
  }

  if (error instanceof EjeInUseError) {
    return reply.code(409).send(fail(error.code, error.message));
  }

  if (error instanceof EjePermissionError) {
    return reply.code(403).send(fail(error.code, error.message));
  }

  // Manejo de errores genéricos del dominio
  if (error instanceof EjeError) {
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
  }, 'Error no manejado en módulo Eje');

  return reply.code(500).send(fail('INTERNAL_ERROR', 'Error interno del servidor'));
}