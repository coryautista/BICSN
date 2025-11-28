import { FastifyReply } from 'fastify';
import pino from 'pino';
import { fail } from '../../../utils/http.js';
import {
  EstadoError,
  EstadoNotFoundError,
  EstadosNotFoundError,
  DuplicateEstadoError,
  InvalidEstadoDataError,
  EstadoQueryError,
  EstadoCommandError
} from '../domain/errors.js';

const logger = pino({
  name: 'estadosErrorHandler',
  level: process.env.LOG_LEVEL || 'info'
});

/**
 * Manejador centralizado de errores para el módulo Estados
 * Proporciona logging estructurado y respuestas HTTP seguras
 */
export function handleEstadosError(error: any, reply: FastifyReply): FastifyReply {
  const logContext = {
    module: 'estados',
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
  }, 'Error en módulo Estados');

  // Manejo específico de errores del dominio estados
  if (error instanceof EstadoNotFoundError) {
    return reply.code(404).send(fail(error.code || 'ESTADO_NOT_FOUND', error.message));
  }

  if (error instanceof EstadosNotFoundError) {
    return reply.code(404).send(fail(error.code || 'ESTADOS_NOT_FOUND', error.message));
  }

  if (error instanceof DuplicateEstadoError) {
    return reply.code(409).send(fail(error.code || 'DUPLICATE_ESTADO', error.message));
  }

  if (error instanceof InvalidEstadoDataError) {
    return reply.code(400).send(fail(error.code || 'INVALID_ESTADO_DATA', error.message));
  }

  if (error instanceof EstadoQueryError) {
    return reply.code(500).send(fail(error.code || 'ESTADO_QUERY_ERROR', error.message));
  }

  if (error instanceof EstadoCommandError) {
    return reply.code(500).send(fail(error.code || 'ESTADO_COMMAND_ERROR', error.message));
  }

  if (error instanceof EstadoError) {
    return reply.code(error.statusCode || 500).send(fail(error.code || 'ESTADO_ERROR', error.message));
  }

  // Errores genéricos
  if (error.code === '23505') { // Unique constraint violation
    return reply.code(409).send(fail('DUPLICATE_ERROR', 'Ya existe un estado con estos datos'));
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
  }, 'Error no manejado en módulo Estados');

  return reply.code(500).send(fail('INTERNAL_ERROR', 'Error interno del servidor'));
}