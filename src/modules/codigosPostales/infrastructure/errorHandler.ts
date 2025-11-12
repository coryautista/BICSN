import { FastifyReply } from 'fastify';
import { DomainError } from '../../../utils/errors.js';
import pino from 'pino';
import { fail } from '../../../utils/http.js';
import {
  CodigoPostalNotFoundError,
  CodigoPostalByCodeNotFoundError,
  InvalidCodigoPostalDataError,
  InvalidCodigoPostalFormatError,
  DuplicateCodigoPostalError,
  CodigoPostalInUseError,
  CodigoPostalRegistrationError,
  CodigoPostalUpdateError,
  CodigoPostalDeletionError,
  CodigoPostalQueryError
} from '../domain/errors.js';

const logger = pino({
  name: 'codigosPostales-errorHandler',
  level: process.env.LOG_LEVEL || 'info'
});

/**
 * Handler centralizado para errores del módulo CodigosPostales
 * Mapea errores de dominio a respuestas HTTP apropiadas con logging estructurado
 */
export function handleCodigosPostalesError(error: any, reply: FastifyReply): FastifyReply {
  const logContext = {
    module: 'codigosPostales',
    errorType: error.constructor.name,
    errorCode: error.code || 'UNKNOWN_ERROR',
    timestamp: new Date().toISOString()
  };

  // Logging estructurado según tipo de error
  if (error instanceof CodigoPostalNotFoundError) {
    logger.warn({ ...logContext, codigoPostalId: (error as any).details?.codigoPostalId }, 'Código postal no encontrado');
    return reply.code(404).send(fail('CODIGO_POSTAL_NOT_FOUND', error.message));
  }

  if (error instanceof CodigoPostalByCodeNotFoundError) {
    logger.warn({ ...logContext, codigoPostal: (error as any).details?.codigoPostal }, 'Código postal no encontrado por código');
    return reply.code(404).send(fail('CODIGO_POSTAL_BY_CODE_NOT_FOUND', error.message));
  }

  if (error instanceof InvalidCodigoPostalDataError) {
    logger.warn({
      ...logContext,
      field: (error as any).details?.field,
      reason: (error as any).details?.reason
    }, 'Datos de código postal inválidos');
    return reply.code(400).send(fail('INVALID_CODIGO_POSTAL_DATA', error.message));
  }

  if (error instanceof InvalidCodigoPostalFormatError) {
    logger.warn({ ...logContext, codigoPostal: (error as any).details?.codigoPostal }, 'Formato de código postal inválido');
    return reply.code(400).send(fail('INVALID_CODIGO_POSTAL_FORMAT', error.message));
  }

  if (error instanceof DuplicateCodigoPostalError) {
    logger.warn({ ...logContext, codigoPostal: (error as any).details?.codigoPostal }, 'Código postal duplicado');
    return reply.code(409).send(fail('DUPLICATE_CODIGO_POSTAL', error.message));
  }

  if (error instanceof CodigoPostalInUseError) {
    logger.warn({ ...logContext, codigoPostalId: (error as any).details?.codigoPostalId }, 'Código postal en uso');
    return reply.code(409).send(fail('CODIGO_POSTAL_IN_USE', error.message));
  }

  if (error instanceof CodigoPostalRegistrationError) {
    logger.error({
      ...logContext,
      stack: error.stack
    }, 'Error al registrar código postal');
    return reply.code(500).send(fail('CODIGO_POSTAL_REGISTRATION_ERROR', error.message));
  }

  if (error instanceof CodigoPostalUpdateError) {
    logger.error({
      ...logContext,
      codigoPostalId: (error as any).details?.codigoPostalId,
      stack: error.stack
    }, 'Error al actualizar código postal');
    return reply.code(500).send(fail('CODIGO_POSTAL_UPDATE_ERROR', error.message));
  }

  if (error instanceof CodigoPostalDeletionError) {
    logger.error({
      ...logContext,
      codigoPostalId: (error as any).details?.codigoPostalId,
      stack: error.stack
    }, 'Error al eliminar código postal');
    return reply.code(500).send(fail('CODIGO_POSTAL_DELETION_ERROR', error.message));
  }

  if (error instanceof CodigoPostalQueryError) {
    logger.error({
      ...logContext,
      operation: (error as any).details?.operation,
      stack: error.stack
    }, 'Error en consulta de códigos postales');
    return reply.code(500).send(fail('CODIGO_POSTAL_QUERY_ERROR', error.message));
  }

  // Errores de dominio genéricos
  if (error instanceof DomainError) {
    logger.error({
      ...logContext,
      stack: error.stack
    }, 'Error de dominio no manejado específicamente');
    return reply.code(500).send(fail(error.code, error.message));
  }

  // Errores genéricos no tipados
  logger.error({
    ...logContext,
    errorMessage: error.message,
    stack: error.stack
  }, 'Error inesperado en módulo codigosPostales');

  return reply.code(500).send(fail('CODIGOS_POSTALES_INTERNAL_ERROR', 'Error interno del servidor'));
}