import { FastifyReply } from 'fastify';
import pino from 'pino';
import { fail } from '../../../../utils/http.js';
import { DomainError } from '../../../../utils/errors.js';
import {
  IndicadorError,
  IndicadorNotFoundError,
  IndicadorAlreadyExistsError,
  InvalidIndicadorNombreError,
  InvalidIndicadorDescripcionError,
  InvalidIndicadorUnidadError,
  IndicadorPermissionError,
  IndicadorInUseError
} from '../domain/errors.js';

const logger = pino({
  name: 'indicadorErrorHandler',
  level: process.env.LOG_LEVEL || 'info'
});

/**
 * Manejador centralizado de errores para el módulo Indicador
 * Proporciona logging estructurado y respuestas HTTP seguras
 */
export function handleIndicadorError(error: any, reply: FastifyReply): FastifyReply {
  const logContext = {
    module: 'tablero.indicador',
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
  }, 'Error en módulo Indicador');

  // Manejo específico de errores del dominio Indicador
  if (error instanceof IndicadorNotFoundError) {
    const domainError = error as DomainError;
    return reply.code(404).send(fail(domainError.code, domainError.message));
  }

  if (error instanceof IndicadorAlreadyExistsError) {
    const domainError = error as DomainError;
    return reply.code(409).send(fail(domainError.code, domainError.message));
  }

  if (error instanceof InvalidIndicadorNombreError ||
      error instanceof InvalidIndicadorDescripcionError ||
      error instanceof InvalidIndicadorUnidadError) {
    const domainError = error as DomainError;
    return reply.code(400).send(fail(domainError.code, domainError.message));
  }

  if (error instanceof IndicadorInUseError) {
    const domainError = error as DomainError;
    return reply.code(409).send(fail(domainError.code, domainError.message));
  }

  if (error instanceof IndicadorPermissionError) {
    const domainError = error as DomainError;
    return reply.code(403).send(fail(domainError.code, domainError.message));
  }

  // Manejo de errores genéricos del dominio
  if (error instanceof IndicadorError) {
    const domainError = error as DomainError;
    return reply.code(400).send(fail(domainError.code, domainError.message));
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
  }, 'Error no manejado en módulo Indicador');

  return reply.code(500).send(fail('INTERNAL_ERROR', 'Error interno del servidor'));
}