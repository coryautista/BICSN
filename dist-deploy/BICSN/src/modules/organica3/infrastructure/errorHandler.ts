import { FastifyReply } from 'fastify';
import pino from 'pino';
import { fail } from '../../../utils/http.js';
import {
  Organica3NotFoundError,
  Organica3AlreadyExistsError,
  Organica3InvalidClaveOrganica0Error,
  Organica3InvalidClaveOrganica1Error,
  Organica3InvalidClaveOrganica2Error,
  Organica3InvalidClaveOrganica3Error,
  Organica3InvalidDescripcionError,
  Organica3InvalidTitularError,
  Organica3InvalidCalleNumError,
  Organica3InvalidFraccionamientoError,
  Organica3InvalidCodigoPostalError,
  Organica3InvalidTelefonoError,
  Organica3InvalidFaxError,
  Organica3InvalidLocalidadError,
  Organica3InvalidMunicipioError,
  Organica3InvalidEstadoError,
  Organica3InvalidEstatusError,
  Organica3InvalidFechaError,
  Organica3InUseError,
  Organica3ParentNotFoundError,
  Organica3PermissionError,
  Organica3DeletionError
} from '../domain/errors.js';

const logger = pino({
  name: 'organica3-errorHandler',
  level: process.env.LOG_LEVEL || 'info'
});

/**
 * Handler centralizado para errores del módulo Organica3
 * Mapea errores de dominio a respuestas HTTP apropiadas con logging estructurado
 */
export function handleOrganica3Error(error: any, reply: FastifyReply): FastifyReply {
  const logContext = {
    module: 'organica3',
    errorType: error.constructor.name,
    errorCode: error.code || 'UNKNOWN_ERROR',
    timestamp: new Date().toISOString()
  };

  // Logging estructurado según tipo de error
  if (error instanceof Organica3NotFoundError) {
    logger.warn({
      ...logContext,
      claveOrganica0: error.details?.claveOrganica0,
      claveOrganica1: error.details?.claveOrganica1,
      claveOrganica2: error.details?.claveOrganica2,
      claveOrganica3: error.details?.claveOrganica3
    }, 'Entidad organica3 no encontrada');
    return reply.code(404).send(fail('ORGANICA3_NOT_FOUND', 'Entidad organica3 no encontrada'));
  }

  if (error instanceof Organica3AlreadyExistsError) {
    logger.warn({
      ...logContext,
      claveOrganica0: error.details?.claveOrganica0,
      claveOrganica1: error.details?.claveOrganica1,
      claveOrganica2: error.details?.claveOrganica2,
      claveOrganica3: error.details?.claveOrganica3
    }, 'Intento de crear entidad organica3 duplicada');
    return reply.code(409).send(fail('ORGANICA3_ALREADY_EXISTS', 'Ya existe una entidad organica3 con estos datos'));
  }

  if (error instanceof Organica3InvalidClaveOrganica0Error) {
    logger.warn({
      ...logContext,
      details: error.details
    }, 'Clave organica0 inválida');
    return reply.code(400).send(fail('ORGANICA3_INVALID_CLAVE_ORGANICA0', 'Clave organica0 inválida'));
  }

  if (error instanceof Organica3InvalidClaveOrganica1Error) {
    logger.warn({
      ...logContext,
      details: error.details
    }, 'Clave organica1 inválida');
    return reply.code(400).send(fail('ORGANICA3_INVALID_CLAVE_ORGANICA1', 'Clave organica1 inválida'));
  }

  if (error instanceof Organica3InvalidClaveOrganica2Error) {
    logger.warn({
      ...logContext,
      details: error.details
    }, 'Clave organica2 inválida');
    return reply.code(400).send(fail('ORGANICA3_INVALID_CLAVE_ORGANICA2', 'Clave organica2 inválida'));
  }

  if (error instanceof Organica3InvalidClaveOrganica3Error) {
    logger.warn({
      ...logContext,
      details: error.details
    }, 'Clave organica3 inválida');
    return reply.code(400).send(fail('ORGANICA3_INVALID_CLAVE_ORGANICA3', 'Clave organica3 inválida'));
  }

  if (error instanceof Organica3InvalidDescripcionError) {
    logger.warn({
      ...logContext,
      details: error.details
    }, 'Descripción inválida');
    return reply.code(400).send(fail('ORGANICA3_INVALID_DESCRIPCION', 'Descripción inválida'));
  }

  if (error instanceof Organica3InvalidTitularError) {
    logger.warn({
      ...logContext,
      details: error.details
    }, 'Titular inválido');
    return reply.code(400).send(fail('ORGANICA3_INVALID_TITULAR', 'Titular inválido'));
  }

  if (error instanceof Organica3InvalidCalleNumError) {
    logger.warn({
      ...logContext,
      details: error.details
    }, 'Calle y número inválidos');
    return reply.code(400).send(fail('ORGANICA3_INVALID_CALLE_NUM', 'Calle y número inválidos'));
  }

  if (error instanceof Organica3InvalidFraccionamientoError) {
    logger.warn({
      ...logContext,
      details: error.details
    }, 'Fraccionamiento inválido');
    return reply.code(400).send(fail('ORGANICA3_INVALID_FRACCIONAMIENTO', 'Fraccionamiento inválido'));
  }

  if (error instanceof Organica3InvalidCodigoPostalError) {
    logger.warn({
      ...logContext,
      details: error.details
    }, 'Código postal inválido');
    return reply.code(400).send(fail('ORGANICA3_INVALID_CODIGO_POSTAL', 'Código postal inválido'));
  }

  if (error instanceof Organica3InvalidTelefonoError) {
    logger.warn({
      ...logContext,
      details: error.details
    }, 'Teléfono inválido');
    return reply.code(400).send(fail('ORGANICA3_INVALID_TELEFONO', 'Teléfono inválido'));
  }

  if (error instanceof Organica3InvalidFaxError) {
    logger.warn({
      ...logContext,
      details: error.details
    }, 'Fax inválido');
    return reply.code(400).send(fail('ORGANICA3_INVALID_FAX', 'Fax inválido'));
  }

  if (error instanceof Organica3InvalidLocalidadError) {
    logger.warn({
      ...logContext,
      details: error.details
    }, 'Localidad inválida');
    return reply.code(400).send(fail('ORGANICA3_INVALID_LOCALIDAD', 'Localidad inválida'));
  }

  if (error instanceof Organica3InvalidMunicipioError) {
    logger.warn({
      ...logContext,
      details: error.details
    }, 'Municipio inválido');
    return reply.code(400).send(fail('ORGANICA3_INVALID_MUNICIPIO', 'Municipio inválido'));
  }

  if (error instanceof Organica3InvalidEstadoError) {
    logger.warn({
      ...logContext,
      details: error.details
    }, 'Estado inválido');
    return reply.code(400).send(fail('ORGANICA3_INVALID_ESTADO', 'Estado inválido'));
  }

  if (error instanceof Organica3InvalidEstatusError) {
    logger.warn({
      ...logContext,
      details: error.details
    }, 'Estatus inválido');
    return reply.code(400).send(fail('ORGANICA3_INVALID_ESTATUS', 'Estatus inválido'));
  }

  if (error instanceof Organica3InvalidFechaError) {
    logger.warn({
      ...logContext,
      details: error.details
    }, 'Fecha inválida');
    return reply.code(400).send(fail('ORGANICA3_INVALID_FECHA', 'Fecha inválida'));
  }

  if (error instanceof Organica3InUseError) {
    logger.warn({
      ...logContext,
      claveOrganica0: error.details?.claveOrganica0,
      claveOrganica1: error.details?.claveOrganica1,
      claveOrganica2: error.details?.claveOrganica2,
      claveOrganica3: error.details?.claveOrganica3
    }, 'Entidad organica3 en uso, no se puede eliminar');
    return reply.code(409).send(fail('ORGANICA3_IN_USE', 'La entidad organica3 está en uso y no puede ser eliminada'));
  }

  if (error instanceof Organica3ParentNotFoundError) {
    logger.warn({
      ...logContext,
      claveOrganica0: error.details?.claveOrganica0,
      claveOrganica1: error.details?.claveOrganica1,
      claveOrganica2: error.details?.claveOrganica2
    }, 'Entidad padre organica2 no encontrada');
    return reply.code(400).send(fail('ORGANICA3_PARENT_NOT_FOUND', 'Entidad padre organica2 no encontrada'));
  }

  if (error instanceof Organica3PermissionError) {
    logger.warn({
      ...logContext,
      userId: error.details?.userId,
      operation: error.details?.operation
    }, 'Permiso denegado para operación en organica3');
    return reply.code(403).send(fail('ORGANICA3_PERMISSION_DENIED', 'No tiene permisos para realizar esta operación'));
  }

  if (error instanceof Organica3DeletionError) {
    logger.error({
      ...logContext,
      details: error.details
    }, 'Error en eliminación de organica3');
    return reply.code(500).send(fail('ORGANICA3_DELETION_ERROR', 'Error interno en eliminación de organica3'));
  }

  // Error genérico del servidor
  const errorMessage = error instanceof Error 
    ? (error.message || 'Error interno del servidor')
    : (typeof error === 'string' ? error : 'Error interno del servidor');
    
  logger.error({
    ...logContext,
    error: errorMessage,
    stack: error instanceof Error ? error.stack : undefined
  }, 'Error interno del servidor en módulo organica3');

  return reply.code(500).send(fail('INTERNAL_SERVER_ERROR', errorMessage));
}