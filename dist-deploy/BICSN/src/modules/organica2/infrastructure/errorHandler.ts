import { FastifyReply } from 'fastify';
import pino from 'pino';
import { fail } from '../../../utils/http.js';
import {
  Organica2NotFoundError,
  Organica2AlreadyExistsError,
  Organica2InvalidClaveOrganica0Error,
  Organica2InvalidClaveOrganica1Error,
  Organica2InvalidClaveOrganica2Error,
  Organica2InvalidDescripcionError,
  Organica2InvalidTitularError,
  Organica2InvalidEstatusError,
  Organica2InvalidFechaError,
  Organica2InUseError,
  Organica2ParentNotFoundError,
  Organica2PermissionError,
  Organica2DeletionError
} from '../domain/errors.js';

const logger = pino({
  name: 'organica2-errorHandler',
  level: process.env.LOG_LEVEL || 'info'
});

/**
 * Handler centralizado para errores del módulo Organica2
 * Mapea errores de dominio a respuestas HTTP apropiadas con logging estructurado
 */
export function handleOrganica2Error(error: any, reply: FastifyReply): FastifyReply {
  const logContext = {
    module: 'organica2',
    errorType: error.constructor.name,
    errorCode: error.code || 'UNKNOWN_ERROR',
    timestamp: new Date().toISOString()
  };

  // Logging estructurado según tipo de error
  if (error instanceof Organica2NotFoundError) {
    logger.warn({
      ...logContext,
      claveOrganica0: error.details?.claveOrganica0,
      claveOrganica1: error.details?.claveOrganica1,
      claveOrganica2: error.details?.claveOrganica2
    }, 'Entidad organica2 no encontrada');
    return reply.code(404).send(fail('ORGANICA2_NOT_FOUND', 'Entidad organica2 no encontrada'));
  }

  if (error instanceof Organica2AlreadyExistsError) {
    logger.warn({
      ...logContext,
      claveOrganica0: error.details?.claveOrganica0,
      claveOrganica1: error.details?.claveOrganica1,
      claveOrganica2: error.details?.claveOrganica2
    }, 'Intento de crear entidad organica2 duplicada');
    return reply.code(409).send(fail('ORGANICA2_ALREADY_EXISTS', 'Ya existe una entidad organica2 con estos datos'));
  }

  if (error instanceof Organica2InvalidClaveOrganica0Error) {
    logger.warn({
      ...logContext,
      details: error.details
    }, 'Clave organica0 inválida');
    return reply.code(400).send(fail('ORGANICA2_INVALID_CLAVE_ORGANICA0', 'Clave organica0 inválida'));
  }

  if (error instanceof Organica2InvalidClaveOrganica1Error) {
    logger.warn({
      ...logContext,
      details: error.details
    }, 'Clave organica1 inválida');
    return reply.code(400).send(fail('ORGANICA2_INVALID_CLAVE_ORGANICA1', 'Clave organica1 inválida'));
  }

  if (error instanceof Organica2InvalidClaveOrganica2Error) {
    logger.warn({
      ...logContext,
      details: error.details
    }, 'Clave organica2 inválida');
    return reply.code(400).send(fail('ORGANICA2_INVALID_CLAVE_ORGANICA2', 'Clave organica2 inválida'));
  }

  if (error instanceof Organica2InvalidDescripcionError) {
    logger.warn({
      ...logContext,
      details: error.details
    }, 'Descripción inválida');
    return reply.code(400).send(fail('ORGANICA2_INVALID_DESCRIPCION', 'Descripción inválida'));
  }

  if (error instanceof Organica2InvalidTitularError) {
    logger.warn({
      ...logContext,
      details: error.details
    }, 'Titular inválido');
    return reply.code(400).send(fail('ORGANICA2_INVALID_TITULAR', 'Titular inválido'));
  }

  if (error instanceof Organica2InvalidEstatusError) {
    logger.warn({
      ...logContext,
      details: error.details
    }, 'Estatus inválido');
    return reply.code(400).send(fail('ORGANICA2_INVALID_ESTATUS', 'Estatus inválido'));
  }

  if (error instanceof Organica2InvalidFechaError) {
    logger.warn({
      ...logContext,
      details: error.details
    }, 'Fecha inválida');
    return reply.code(400).send(fail('ORGANICA2_INVALID_FECHA', 'Fecha inválida'));
  }

  if (error instanceof Organica2InUseError) {
    logger.warn({
      ...logContext,
      claveOrganica0: error.details?.claveOrganica0,
      claveOrganica1: error.details?.claveOrganica1,
      claveOrganica2: error.details?.claveOrganica2
    }, 'Entidad organica2 en uso, no se puede eliminar');
    return reply.code(409).send(fail('ORGANICA2_IN_USE', 'La entidad organica2 está en uso y no puede ser eliminada'));
  }

  if (error instanceof Organica2ParentNotFoundError) {
    logger.warn({
      ...logContext,
      claveOrganica0: error.details?.claveOrganica0,
      claveOrganica1: error.details?.claveOrganica1
    }, 'Entidad padre organica1 no encontrada');
    return reply.code(400).send(fail('ORGANICA2_PARENT_NOT_FOUND', 'Entidad padre organica1 no encontrada'));
  }

  if (error instanceof Organica2PermissionError) {
    logger.warn({
      ...logContext,
      userId: error.details?.userId,
      operation: error.details?.operation
    }, 'Permiso denegado para operación en organica2');
    return reply.code(403).send(fail('ORGANICA2_PERMISSION_DENIED', 'No tiene permisos para realizar esta operación'));
  }

  if (error instanceof Organica2DeletionError) {
    logger.error({
      ...logContext,
      details: error.details
    }, 'Error en eliminación de organica2');
    return reply.code(500).send(fail('ORGANICA2_DELETION_ERROR', 'Error interno en eliminación de organica2'));
  }

  // Error genérico del servidor
  logger.error({
    ...logContext,
    error: error instanceof Error ? error.message : 'Error desconocido',
    stack: error instanceof Error ? error.stack : undefined
  }, 'Error interno del servidor en módulo organica2');

  return reply.code(500).send(fail('INTERNAL_SERVER_ERROR', 'Error interno del servidor'));
}