import { FastifyReply } from 'fastify';
import { DomainError } from '../../../utils/errors.js';
import pino from 'pino';
import { fail } from '../../../utils/http.js';
import {
  Organica1Error,
  Organica1NotFoundError,
  Organica1AlreadyExistsError,
  Organica1InvalidClaveOrganica0Error,
  Organica1InvalidClaveOrganica1Error,
  Organica1InvalidDescripcionError,
  Organica1InvalidTitularError,
  Organica1InvalidRfcError,
  Organica1InvalidImssError,
  Organica1InvalidInfonavitError,
  Organica1InvalidEstatusError,
  Organica1InvalidFechaError,
  Organica1InUseError,
  Organica1ParentNotFoundError,
  Organica1PermissionError
} from '../domain/errors.js';

const logger = pino({
  name: 'organica1-errorHandler',
  level: process.env.LOG_LEVEL || 'info'
});

/**
 * Handler centralizado para errores del módulo Organica1
 * Mapea errores de dominio a respuestas HTTP apropiadas con logging estructurado
 */
export function handleOrganica1Error(error: any, reply: FastifyReply): FastifyReply {
  const logContext = {
    module: 'organica1',
    errorType: error.constructor.name,
    errorCode: error.code || 'UNKNOWN_ERROR',
    timestamp: new Date().toISOString()
  };

  // Logging estructurado según tipo de error
  if (error instanceof Organica1NotFoundError) {
    logger.warn({
      ...logContext,
      claveOrganica0: error.details?.claveOrganica0,
      claveOrganica1: error.details?.claveOrganica1
    }, 'Entidad organica1 no encontrada');
    return reply.code(404).send(fail('ORGANICA1_NOT_FOUND', 'Entidad organica1 no encontrada'));
  }

  if (error instanceof Organica1AlreadyExistsError) {
    logger.warn({
      ...logContext,
      claveOrganica0: error.details?.claveOrganica0,
      claveOrganica1: error.details?.claveOrganica1
    }, 'Intento de crear entidad organica1 duplicada');
    return reply.code(409).send(fail('ORGANICA1_ALREADY_EXISTS', 'Ya existe una entidad organica1 con estos datos'));
  }

  if (error instanceof Organica1InvalidClaveOrganica0Error) {
    logger.warn({
      ...logContext,
      details: error.details
    }, 'Clave organica0 inválida');
    return reply.code(400).send(fail('ORGANICA1_INVALID_CLAVE_ORGANICA0', 'Clave organica0 inválida'));
  }

  if (error instanceof Organica1InvalidClaveOrganica1Error) {
    logger.warn({
      ...logContext,
      details: error.details
    }, 'Clave organica1 inválida');
    return reply.code(400).send(fail('ORGANICA1_INVALID_CLAVE_ORGANICA1', 'Clave organica1 inválida'));
  }

  if (error instanceof Organica1InvalidDescripcionError) {
    logger.warn({
      ...logContext,
      details: error.details
    }, 'Descripción inválida');
    return reply.code(400).send(fail('ORGANICA1_INVALID_DESCRIPCION', 'Descripción inválida'));
  }

  if (error instanceof Organica1InvalidTitularError) {
    logger.warn({
      ...logContext,
      details: error.details
    }, 'Titular inválido');
    return reply.code(400).send(fail('ORGANICA1_INVALID_TITULAR', 'Titular inválido'));
  }

  if (error instanceof Organica1InvalidRfcError) {
    logger.warn({
      ...logContext,
      details: error.details
    }, 'RFC inválido');
    return reply.code(400).send(fail('ORGANICA1_INVALID_RFC', 'RFC inválido'));
  }

  if (error instanceof Organica1InvalidImssError) {
    logger.warn({
      ...logContext,
      details: error.details
    }, 'IMSS inválido');
    return reply.code(400).send(fail('ORGANICA1_INVALID_IMSS', 'IMSS inválido'));
  }

  if (error instanceof Organica1InvalidInfonavitError) {
    logger.warn({
      ...logContext,
      details: error.details
    }, 'INFONAVIT inválido');
    return reply.code(400).send(fail('ORGANICA1_INVALID_INFONAVIT', 'INFONAVIT inválido'));
  }

  if (error instanceof Organica1InvalidEstatusError) {
    logger.warn({
      ...logContext,
      details: error.details
    }, 'Estatus inválido');
    return reply.code(400).send(fail('ORGANICA1_INVALID_ESTATUS', 'Estatus inválido'));
  }

  if (error instanceof Organica1InvalidFechaError) {
    logger.warn({
      ...logContext,
      details: error.details
    }, 'Fecha inválida');
    return reply.code(400).send(fail('ORGANICA1_INVALID_FECHA', 'Fecha inválida'));
  }

  if (error instanceof Organica1InUseError) {
    logger.warn({
      ...logContext,
      claveOrganica0: error.details?.claveOrganica0,
      claveOrganica1: error.details?.claveOrganica1
    }, 'Entidad organica1 en uso, no se puede eliminar');
    return reply.code(409).send(fail('ORGANICA1_IN_USE', 'La entidad organica1 está en uso y no puede ser eliminada'));
  }

  if (error instanceof Organica1ParentNotFoundError) {
    logger.warn({
      ...logContext,
      claveOrganica0: error.details?.claveOrganica0
    }, 'Entidad padre organica0 no encontrada');
    return reply.code(400).send(fail('ORGANICA1_PARENT_NOT_FOUND', 'Entidad padre organica0 no encontrada'));
  }

  if (error instanceof Organica1PermissionError) {
    logger.warn({
      ...logContext,
      userId: error.details?.userId,
      operation: error.details?.operation
    }, 'Permiso denegado para operación en organica1');
    return reply.code(403).send(fail('ORGANICA1_PERMISSION_DENIED', 'No tiene permisos para realizar esta operación'));
  }

  // Si es un error del dominio organica1 genérico, manejarlo
  if (error instanceof Organica1Error) {
    logger.error({
      ...logContext,
      message: error.message
    }, 'Error genérico del dominio organica1');
    return reply.code(error.statusCode).send(fail(error.code, error.message));
  }

  // Si es un error de dominio genérico, manejarlo
  if (error instanceof DomainError) {
    logger.error({
      ...logContext,
      message: error.message
    }, 'Error de dominio genérico');
    return reply.code(error.statusCode).send(fail(error.code, error.message));
  }

  // Error genérico del servidor
  logger.error({
    ...logContext,
    error: error instanceof Error ? error.message : 'Error desconocido',
    stack: error instanceof Error ? error.stack : undefined
  }, 'Error interno del servidor en módulo organica1');

  return reply.code(500).send(fail('INTERNAL_SERVER_ERROR', 'Error interno del servidor'));
}