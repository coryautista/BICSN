import { FastifyReply } from 'fastify';
import { fail } from '../../../utils/http.js';
import pino from 'pino';
import {
  MunicipioError,
  MunicipioNotFoundError,
  MunicipioAlreadyExistsError,
  MunicipioInvalidEstadoError,
  MunicipioInvalidClaveError,
  MunicipioInvalidNombreError,
  MunicipioInvalidIdError,
  MunicipioInUseError,
  MunicipioPermissionError
} from '../domain/errors.js';

const logger = pino({
  name: 'municipioErrorHandler',
  level: process.env.LOG_LEVEL || 'info'
});

/**
 * Manejador centralizado de errores para el módulo municipios
 * Proporciona logging seguro y mapeo consistente de errores a respuestas HTTP
 */
export function handleMunicipioError(error: any, reply: FastifyReply): FastifyReply {
  // Errores específicos del dominio municipios
  if (error instanceof MunicipioNotFoundError) {
    logger.warn({
      operation: 'municipio_operation',
      error: error.message,
      code: error.code,
      statusCode: error.statusCode,
      timestamp: new Date().toISOString()
    }, 'Municipio no encontrado');
    return reply.code(error.statusCode).send(fail(error.code, error.message));
  }

  if (error instanceof MunicipioAlreadyExistsError) {
    logger.warn({
      operation: 'municipio_operation',
      error: error.message,
      code: error.code,
      statusCode: error.statusCode,
      timestamp: new Date().toISOString()
    }, 'Intento de crear municipio duplicado');
    return reply.code(error.statusCode).send(fail(error.code, error.message));
  }

  if (error instanceof MunicipioInvalidEstadoError ||
      error instanceof MunicipioInvalidClaveError ||
      error instanceof MunicipioInvalidNombreError ||
      error instanceof MunicipioInvalidIdError) {
    logger.warn({
      operation: 'municipio_validation',
      error: error.message,
      code: error.code,
      statusCode: error.statusCode,
      timestamp: new Date().toISOString()
    }, 'Error de validación en municipio');
    return reply.code(error.statusCode).send(fail(error.code, error.message));
  }

  if (error instanceof MunicipioInUseError) {
    logger.warn({
      operation: 'municipio_operation',
      error: error.message,
      code: error.code,
      statusCode: error.statusCode,
      timestamp: new Date().toISOString()
    }, 'Intento de eliminar municipio en uso');
    return reply.code(error.statusCode).send(fail(error.code, error.message));
  }

  if (error instanceof MunicipioPermissionError) {
    logger.warn({
      operation: 'municipio_operation',
      error: error.message,
      code: error.code,
      statusCode: error.statusCode,
      timestamp: new Date().toISOString()
    }, 'Permisos insuficientes para operación de municipio');
    return reply.code(error.statusCode).send(fail(error.code, error.message));
  }

  if (error instanceof MunicipioError) {
    logger.error({
      operation: 'municipio_operation',
      error: error.message,
      code: error.code,
      statusCode: error.statusCode,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }, 'Error interno del módulo municipios');
    return reply.code(error.statusCode).send(fail(error.code, error.message));
  }

  // Errores genéricos - logging seguro sin detalles sensibles
  logger.error({
    operation: 'municipio_operation',
    error: error.message || 'Error desconocido',
    stack: error.stack,
    timestamp: new Date().toISOString()
  }, 'Error no manejado en módulo municipios');

  return reply.code(500).send(fail('MUNICIPIO_INTERNAL_ERROR', 'Error interno del servidor'));
}