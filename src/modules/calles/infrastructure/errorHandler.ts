import { FastifyReply } from 'fastify';
import { DomainError } from '../../../utils/errors.js';
import pino from 'pino';
import { fail } from '../../../utils/http.js';
import {
  CalleAlreadyExistsError,
  CalleNotFoundError,
  InvalidCalleDataError,
  CalleNombreRequiredError,
  CalleNombreTooLongError,
  CalleNombreEmptyError,
  ColoniaNotFoundError,
  InvalidColoniaIdError,
  CallePermissionError,
  CalleAccessDeniedError,
  CalleDeletionError,
  CalleInUseError,
  CalleQueryError,
  CalleSearchError,
  InvalidSearchFiltersError,
  InvalidEstadoIdError,
  InvalidMunicipioIdError,
  InvalidCodigoPostalError,
  InvalidPaginationError,
  PaginationLimitExceededError,
  CalleSystemError,
  CalleConnectionError,
  CalleTimeoutError
} from '../domain/errors.js';

const logger = pino({
  name: 'calles-errorHandler',
  level: process.env.LOG_LEVEL || 'info'
});

/**
 * Handler centralizado para errores del módulo Calles
 * Mapea errores de dominio a respuestas HTTP apropiadas con logging estructurado
 */
export function handleCalleError(error: any, reply: FastifyReply): FastifyReply {
  const logContext = {
    module: 'calles',
    errorType: error.constructor.name,
    errorCode: error.code || 'UNKNOWN_ERROR',
    timestamp: new Date().toISOString()
  };

  // Logging estructurado según tipo de error
  if (error instanceof CalleAlreadyExistsError) {
    logger.warn({
      ...logContext,
      calleId: error.details?.calleId,
      nombreCalle: error.details?.nombreCalle,
      coloniaId: error.details?.coloniaId
    }, 'Intento de crear calle duplicada');
    return reply.code(409).send(fail('CALLE_ALREADY_EXISTS', 'Ya existe una calle con estos datos'));
  }

  if (error instanceof CalleNotFoundError) {
    logger.warn({
      ...logContext,
      calleId: error.details?.calleId
    }, 'Calle no encontrada');
    return reply.code(404).send(fail('CALLE_NOT_FOUND', 'Calle no encontrada'));
  }

  if (error instanceof InvalidCalleDataError) {
    logger.warn({
      ...logContext,
      details: error.details
    }, 'Datos de calle inválidos');
    return reply.code(400).send(fail('INVALID_CALLE_DATA', 'Datos de calle inválidos'));
  }

  if (error instanceof CalleNombreRequiredError) {
    logger.warn(logContext, 'Nombre de calle requerido faltante');
    return reply.code(400).send(fail('CALLE_NOMBRE_REQUIRED', 'El nombre de la calle es requerido'));
  }

  if (error instanceof CalleNombreTooLongError) {
    logger.warn({
      ...logContext,
      nombreCalle: error.details?.nombreCalle,
      maxLength: error.details?.maxLength,
      actualLength: error.details?.actualLength
    }, 'Nombre de calle demasiado largo');
    return reply.code(400).send(fail('CALLE_NOMBRE_TOO_LONG', 'El nombre de la calle es demasiado largo'));
  }

  if (error instanceof CalleNombreEmptyError) {
    logger.warn(logContext, 'Nombre de calle vacío');
    return reply.code(400).send(fail('CALLE_NOMBRE_EMPTY', 'El nombre de la calle no puede estar vacío'));
  }

  if (error instanceof ColoniaNotFoundError) {
    logger.warn({
      ...logContext,
      coloniaId: error.details?.coloniaId
    }, 'Colonia no encontrada');
    return reply.code(400).send(fail('COLONIA_NOT_FOUND', 'Colonia no encontrada'));
  }

  if (error instanceof InvalidColoniaIdError) {
    logger.warn({
      ...logContext,
      coloniaId: error.details?.coloniaId
    }, 'ID de colonia inválido');
    return reply.code(400).send(fail('INVALID_COLONIA_ID', 'ID de colonia inválido'));
  }

  if (error instanceof CallePermissionError) {
    logger.warn({
      ...logContext,
      action: error.details?.action,
      userId: error.details?.userId
    }, 'Permisos insuficientes para operación en calle');
    return reply.code(403).send(fail('CALLE_PERMISSION_DENIED', 'Permisos insuficientes'));
  }

  if (error instanceof CalleAccessDeniedError) {
    logger.warn({
      ...logContext,
      resource: error.details?.resource
    }, 'Acceso denegado a recurso de calles');
    return reply.code(403).send(fail('CALLE_ACCESS_DENIED', 'Acceso denegado'));
  }

  if (error instanceof CalleDeletionError) {
    logger.error({
      ...logContext,
      calleId: error.details?.calleId,
      reason: error.details?.reason
    }, 'Error al eliminar calle');
    return reply.code(500).send(fail('CALLE_DELETION_ERROR', 'Error al eliminar calle'));
  }

  if (error instanceof CalleInUseError) {
    logger.warn({
      ...logContext,
      calleId: error.details?.calleId,
      references: error.details?.references
    }, 'Intento de eliminar calle en uso');
    return reply.code(409).send(fail('CALLE_IN_USE', 'No se puede eliminar la calle porque está siendo utilizada'));
  }

  if (error instanceof CalleQueryError) {
    logger.error({
      ...logContext,
      operation: error.details?.operation,
      reason: error.details?.reason
    }, 'Error en consulta de calles');
    return reply.code(500).send(fail('CALLE_QUERY_ERROR', 'Error en consulta de calles'));
  }

  if (error instanceof CalleSearchError) {
    logger.error({
      ...logContext,
      filters: error.details?.filters,
      reason: error.details?.reason
    }, 'Error en búsqueda de calles');
    return reply.code(500).send(fail('CALLE_SEARCH_ERROR', 'Error en búsqueda de calles'));
  }

  if (error instanceof InvalidSearchFiltersError) {
    logger.warn({
      ...logContext,
      invalidFilters: error.details?.invalidFilters
    }, 'Filtros de búsqueda inválidos');
    return reply.code(400).send(fail('INVALID_SEARCH_FILTERS', 'Filtros de búsqueda inválidos'));
  }

  if (error instanceof InvalidEstadoIdError) {
    logger.warn({
      ...logContext,
      estadoId: error.details?.estadoId
    }, 'ID de estado inválido');
    return reply.code(400).send(fail('INVALID_ESTADO_ID', 'ID de estado inválido'));
  }

  if (error instanceof InvalidMunicipioIdError) {
    logger.warn({
      ...logContext,
      municipioId: error.details?.municipioId
    }, 'ID de municipio inválido');
    return reply.code(400).send(fail('INVALID_MUNICIPIO_ID', 'ID de municipio inválido'));
  }

  if (error instanceof InvalidCodigoPostalError) {
    logger.warn({
      ...logContext,
      codigoPostal: error.details?.codigoPostal
    }, 'Código postal inválido');
    return reply.code(400).send(fail('INVALID_CODIGO_POSTAL', 'Código postal inválido'));
  }

  if (error instanceof InvalidPaginationError) {
    logger.warn({
      ...logContext,
      param: error.details?.param,
      value: error.details?.value
    }, 'Parámetro de paginación inválido');
    return reply.code(400).send(fail('INVALID_PAGINATION', 'Parámetro de paginación inválido'));
  }

  if (error instanceof PaginationLimitExceededError) {
    logger.warn({
      ...logContext,
      limit: error.details?.limit,
      maxLimit: error.details?.maxLimit
    }, 'Límite de paginación excedido');
    return reply.code(400).send(fail('PAGINATION_LIMIT_EXCEEDED', 'Límite de paginación excedido'));
  }

  if (error instanceof CalleSystemError) {
    logger.error({
      ...logContext,
      stack: error.stack
    }, 'Error interno del sistema de calles');
    return reply.code(500).send(fail('CALLE_SYSTEM_ERROR', 'Error interno del sistema'));
  }

  if (error instanceof CalleConnectionError) {
    logger.error({
      ...logContext,
      stack: error.stack
    }, 'Error de conexión con el sistema de calles');
    return reply.code(503).send(fail('CALLE_CONNECTION_ERROR', 'Error de conexión'));
  }

  if (error instanceof CalleTimeoutError) {
    logger.error({
      ...logContext,
      operation: error.details?.operation,
      timeoutMs: error.details?.timeoutMs
    }, 'Timeout en operación de calles');
    return reply.code(504).send(fail('CALLE_TIMEOUT', 'Timeout en operación'));
  }

  // Errores genéricos de dominio
  if (error instanceof DomainError) {
    logger.error({
      ...logContext,
      details: error.details,
      stack: error.stack
    }, 'Error de dominio no manejado específicamente');
    return reply.code(500).send(fail('DOMAIN_ERROR', 'Error interno del dominio'));
  }

  // Errores no clasificados
  logger.error({
    ...logContext,
    errorMessage: error.message,
    stack: error.stack
  }, 'Error no clasificado en módulo calles');

  return reply.code(500).send(fail('INTERNAL_ERROR', 'Error interno del servidor'));
}