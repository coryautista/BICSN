import { FastifyReply } from 'fastify';
import pino from 'pino';
import { fail } from '../../../../utils/http.js';
import {
  ProgramaError,
  ProgramaNotFoundError,
  ProgramaAlreadyExistsError,
  InvalidProgramaNombreError,
  InvalidProgramaDescripcionError,
  ProgramaPermissionError,
  ProgramaInUseError
} from '../domain/errors.js';

const logger = pino({
  name: 'programaErrorHandler',
  level: process.env.LOG_LEVEL || 'info'
});

/**
 * Manejador centralizado de errores para el módulo Programa
 * Proporciona logging estructurado y respuestas HTTP seguras
 */
export function handleProgramaError(error: any, reply: FastifyReply): FastifyReply {
  const logContext = {
    module: 'tablero.programa',
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
  }, 'Error en módulo Programa');

  // Manejo específico de errores del dominio Programa
  if (error instanceof ProgramaNotFoundError) {
    return reply.code(404).send(fail(error.code, error.message));
  }

  if (error instanceof ProgramaAlreadyExistsError) {
    return reply.code(409).send(fail(error.code, error.message));
  }

  if (error instanceof InvalidProgramaNombreError ||
      error instanceof InvalidProgramaDescripcionError) {
    return reply.code(400).send(fail(error.code, error.message));
  }

  if (error instanceof ProgramaInUseError) {
    return reply.code(409).send(fail(error.code, error.message));
  }

  if (error instanceof ProgramaPermissionError) {
    return reply.code(403).send(fail(error.code, error.message));
  }

  // Manejo de errores genéricos del dominio
  if (error instanceof ProgramaError) {
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
  }, 'Error no manejado en módulo Programa');

  return reply.code(500).send(fail('INTERNAL_ERROR', 'Error interno del servidor'));
}