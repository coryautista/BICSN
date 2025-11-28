import { FastifyReply } from 'fastify';
import pino from 'pino';
import { fail } from '../../../utils/http.js';
import {
  ColoniaError,
  ColoniaNotFoundError,
  ColoniaByMunicipioNotFoundError,
  ColoniaByCodigoPostalNotFoundError,
  DuplicateColoniaError,
  InvalidColoniaDataError,
  MunicipioNotFoundError,
  CodigoPostalNotFoundError,
  ColoniaQueryError,
  ColoniaCommandError,
  SearchColoniasError
} from '../domain/errors.js';

const logger = pino({
  name: 'coloniasErrorHandler',
  level: process.env.LOG_LEVEL || 'info'
});

/**
 * Manejador centralizado de errores para el módulo Colonias
 * Proporciona logging estructurado y respuestas HTTP seguras
 */
export function handleColoniasError(error: any, reply: FastifyReply): FastifyReply {
  const logContext = {
    module: 'colonias',
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
  }, 'Error en módulo Colonias');

  // Manejo específico de errores del dominio colonias
  if (error instanceof ColoniaNotFoundError) {
    return reply.code(404).send(fail(error.code || 'COLONIA_NOT_FOUND', error.message));
  }

  if (error instanceof ColoniaByMunicipioNotFoundError) {
    return reply.code(404).send(fail(error.code || 'COLONIAS_BY_MUNICIPIO_NOT_FOUND', error.message));
  }

  if (error instanceof ColoniaByCodigoPostalNotFoundError) {
    return reply.code(404).send(fail(error.code || 'COLONIAS_BY_CODIGO_POSTAL_NOT_FOUND', error.message));
  }

  if (error instanceof DuplicateColoniaError) {
    return reply.code(409).send(fail(error.code || 'DUPLICATE_COLONIA', error.message));
  }

  if (error instanceof InvalidColoniaDataError) {
    return reply.code(400).send(fail(error.code || 'INVALID_COLONIA_DATA', error.message));
  }

  if (error instanceof MunicipioNotFoundError) {
    return reply.code(400).send(fail(error.code || 'MUNICIPIO_NOT_FOUND', error.message));
  }

  if (error instanceof CodigoPostalNotFoundError) {
    return reply.code(400).send(fail(error.code || 'CODIGO_POSTAL_NOT_FOUND', error.message));
  }

  if (error instanceof ColoniaQueryError) {
    return reply.code(500).send(fail(error.code || 'COLONIA_QUERY_ERROR', error.message));
  }

  if (error instanceof ColoniaCommandError) {
    return reply.code(500).send(fail(error.code || 'COLONIA_COMMAND_ERROR', error.message));
  }

  if (error instanceof SearchColoniasError) {
    return reply.code(400).send(fail(error.code || 'SEARCH_COLONIAS_ERROR', error.message));
  }

  if (error instanceof ColoniaError) {
    return reply.code(error.statusCode || 500).send(fail(error.code || 'COLONIA_ERROR', error.message));
  }

  // Errores genéricos
  if (error.code === '23505') { // Unique constraint violation
    return reply.code(409).send(fail('DUPLICATE_ERROR', 'Ya existe una colonia con estos datos'));
  }

  if (error.code === '23503') { // Foreign key constraint violation
    return reply.code(400).send(fail('INVALID_REFERENCE', 'Los datos referenciados no existen'));
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
  }, 'Error no manejado en módulo Colonias');

  return reply.code(500).send(fail('INTERNAL_ERROR', 'Error interno del servidor'));
}