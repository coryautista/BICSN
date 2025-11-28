import { FastifyReply } from 'fastify';
import pino from 'pino';
import { fail } from '../../../utils/http.js';
import {
  Organica0NotFoundError,
  Organica0AlreadyExistsError,
  Organica0InvalidClaveError,
  Organica0InvalidNombreError,
  Organica0InvalidEstatusError,
  Organica0InvalidFechaError,
  Organica0InUseError,
  Organica0PermissionError
} from '../domain/errors.js';

const logger = pino({
  name: 'organica0-errorHandler',
  level: process.env.LOG_LEVEL || 'info'
});

/**
 * Handler centralizado para errores del módulo Organica0
 * Mapea errores de dominio a respuestas HTTP apropiadas con logging estructurado
 */
export function handleOrganica0Error(error: any, reply: FastifyReply): FastifyReply {
  const logContext = {
    module: 'organica0',
    errorType: error.constructor.name,
    errorCode: error.code || 'UNKNOWN_ERROR',
    timestamp: new Date().toISOString()
  };

  // Logging estructurado según tipo de error
  if (error instanceof Organica0NotFoundError) {
    logger.warn({
      ...logContext,
      claveOrganica: error.details?.claveOrganica
    }, 'Entidad organica0 no encontrada');
    return reply.code(404).send(fail('ORGANICA0_NOT_FOUND', 'Entidad organica0 no encontrada'));
  }

  if (error instanceof Organica0AlreadyExistsError) {
    logger.warn({
      ...logContext,
      claveOrganica: error.details?.claveOrganica
    }, 'Intento de crear entidad organica0 duplicada');
    return reply.code(409).send(fail('ORGANICA0_ALREADY_EXISTS', 'Ya existe una entidad organica0 con estos datos'));
  }

  if (error instanceof Organica0InvalidClaveError) {
    logger.warn({
      ...logContext,
      details: error.details
    }, 'Clave organica0 inválida');
    return reply.code(400).send(fail('ORGANICA0_INVALID_CLAVE', 'Clave organica0 inválida'));
  }

  if (error instanceof Organica0InvalidNombreError) {
    logger.warn({
      ...logContext,
      details: error.details
    }, 'Nombre inválido');
    return reply.code(400).send(fail('ORGANICA0_INVALID_NOMBRE', 'Nombre inválido'));
  }

  if (error instanceof Organica0InvalidEstatusError) {
    logger.warn({
      ...logContext,
      details: error.details
    }, 'Estatus inválido');
    return reply.code(400).send(fail('ORGANICA0_INVALID_ESTATUS', 'Estatus inválido'));
  }

  if (error instanceof Organica0InvalidFechaError) {
    logger.warn({
      ...logContext,
      details: error.details
    }, 'Fecha inválida');
    return reply.code(400).send(fail('ORGANICA0_INVALID_FECHA', 'Fecha inválida'));
  }

  if (error instanceof Organica0InUseError) {
    logger.warn({
      ...logContext,
      claveOrganica: error.details?.claveOrganica
    }, 'Entidad organica0 en uso, no se puede eliminar');
    return reply.code(409).send(fail('ORGANICA0_IN_USE', 'La entidad organica0 está en uso y no puede ser eliminada'));
  }

  if (error instanceof Organica0PermissionError) {
    logger.warn({
      ...logContext,
      userId: error.details?.userId,
      operation: error.details?.operation
    }, 'Permiso denegado para operación en organica0');
    return reply.code(403).send(fail('ORGANICA0_PERMISSION_DENIED', 'No tiene permisos para realizar esta operación'));
  }

  // Error genérico del servidor
  logger.error({
    ...logContext,
    error: error instanceof Error ? error.message : 'Error desconocido',
    stack: error instanceof Error ? error.stack : undefined
  }, 'Error interno del servidor en módulo organica0');

  return reply.code(500).send(fail('INTERNAL_SERVER_ERROR', 'Error interno del servidor'));
}