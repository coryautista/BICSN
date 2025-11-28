import { FastifyReply } from 'fastify';
import pino from 'pino';
import { fail } from '../../../../utils/http.js';
import {
  DependenciaError,
  DependenciaNotFoundError,
  DependenciaAlreadyExistsError,
  InvalidDependenciaNombreError,
  InvalidDependenciaDescripcionError,
  DependenciaPermissionError,
  DependenciaInUseError
} from '../domain/errors.js';

const logger = pino({
  name: 'dependenciaErrorHandler',
  level: process.env.LOG_LEVEL || 'info'
});

/**
 * Manejador centralizado de errores para el módulo Dependencia
 * Proporciona logging estructurado y respuestas HTTP seguras
 */
export function handleDependenciaError(error: any, reply: FastifyReply): FastifyReply {
  const logContext = {
    module: 'tablero.dependencia',
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
  }, 'Error en módulo Dependencia');

  // Manejo específico de errores del dominio Dependencia
  if (error instanceof DependenciaNotFoundError) {
    return reply.code(404).send(fail(error.code, error.message));
  }

  if (error instanceof DependenciaAlreadyExistsError) {
    return reply.code(409).send(fail(error.code, error.message));
  }

  if (error instanceof InvalidDependenciaNombreError ||
      error instanceof InvalidDependenciaDescripcionError) {
    return reply.code(400).send(fail(error.code, error.message));
  }

  if (error instanceof DependenciaInUseError) {
    return reply.code(409).send(fail(error.code, error.message));
  }

  if (error instanceof DependenciaPermissionError) {
    return reply.code(403).send(fail(error.code, error.message));
  }

  // Manejo de errores genéricos del dominio
  if (error instanceof DependenciaError) {
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
  }, 'Error no manejado en módulo Dependencia');

  return reply.code(500).send(fail('INTERNAL_ERROR', 'Error interno del servidor'));
}