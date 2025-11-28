import { FastifyReply } from 'fastify';
import pino from 'pino';
import { fail } from '../../../utils/http.js';
import {
  ModuloError,
  ModuloNotFoundError,
  ModuloAlreadyExistsError,
  ModuloInvalidNameError,
  ModuloInvalidTypeError,
  ModuloInvalidOrderError,
  ModuloPermissionError,
  ModuloInUseError
} from '../domain/errors.js';

const logger = pino({
  name: 'moduloErrorHandler',
  level: process.env.LOG_LEVEL || 'info'
});

/**
 * Manejador centralizado de errores para el módulo Modulo
 * Proporciona logging estructurado y respuestas HTTP seguras
 */
export function handleModuloError(error: any, reply: FastifyReply): FastifyReply {
  const logContext = {
    module: 'modulo',
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
  }, 'Error en módulo Modulo');

  // Manejo específico de errores del dominio Modulo
  if (error instanceof ModuloNotFoundError) {
    return reply.code(404).send(fail(error.code, error.message));
  }

  if (error instanceof ModuloAlreadyExistsError) {
    return reply.code(409).send(fail(error.code, error.message));
  }

  if (error instanceof ModuloInvalidNameError ||
      error instanceof ModuloInvalidTypeError ||
      error instanceof ModuloInvalidOrderError) {
    return reply.code(400).send(fail(error.code, error.message));
  }

  if (error instanceof ModuloInUseError) {
    return reply.code(409).send(fail(error.code, error.message));
  }

  if (error instanceof ModuloPermissionError) {
    return reply.code(403).send(fail(error.code, error.message));
  }

  // Manejo de errores genéricos del dominio
  if (error instanceof ModuloError) {
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
  }, 'Error no manejado en módulo Modulo');

  return reply.code(500).send(fail('INTERNAL_ERROR', 'Error interno del servidor'));
}