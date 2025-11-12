import { FastifyReply } from 'fastify';
import { DomainError } from '../../../utils/errors.js';
import { 
  AfectacionNotFoundError,
  InvalidAfectacionDataError,
  InvalidQuincenaError,
  InvalidAnioError,
  InvalidOrgNivelError,
  AfectacionAlreadyExistsError,
  AfectacionRegistrationError,
  AfectacionQueryError,
  InvalidDateForQuincenaError,
  OrgHierarchyValidationError,
  AfectacionPermissionError
} from '../domain/errors.js';
import pino from 'pino';

const logger = pino({ 
  name: 'afectacionOrg-errorHandler',
  level: process.env.LOG_LEVEL || 'info'
});

/**
 * Maneja errores específicos del módulo de afectacionOrg
 * y retorna respuestas HTTP apropiadas
 */
export function handleAfectacionError(error: Error, reply: FastifyReply, context?: any): FastifyReply {
  const logContext = {
    errorName: error.name,
    errorMessage: error.message,
    ...context
  };

  // Errores de validación (400)
  if (error instanceof InvalidQuincenaError ||
      error instanceof InvalidAnioError ||
      error instanceof InvalidOrgNivelError ||
      error instanceof OrgHierarchyValidationError ||
      error instanceof InvalidAfectacionDataError ||
      error instanceof InvalidDateForQuincenaError) {
    logger.warn(logContext, 'Error de validación');
    return reply.code(400).send({
      ok: false,
      error: {
        code: (error as DomainError).code,
        message: error.message,
        details: (error as DomainError).details
      }
    });
  }

  // Errores de permisos (403)
  if (error instanceof AfectacionPermissionError) {
    logger.warn(logContext, 'Error de permisos');
    return reply.code(403).send({
      ok: false,
      error: {
        code: (error as DomainError).code,
        message: error.message
      }
    });
  }

  // Errores de recurso no encontrado (404)
  if (error instanceof AfectacionNotFoundError) {
    logger.info(logContext, 'Recurso no encontrado');
    return reply.code(404).send({
      ok: false,
      error: {
        code: (error as DomainError).code,
        message: error.message
      }
    });
  }

  // Errores de conflicto (409)
  if (error instanceof AfectacionAlreadyExistsError) {
    logger.warn(logContext, 'Error de conflicto');
    return reply.code(409).send({
      ok: false,
      error: {
        code: (error as DomainError).code,
        message: error.message,
        details: (error as DomainError).details
      }
    });
  }

  // Errores de base de datos y errores internos (500)
  if (error instanceof AfectacionRegistrationError ||
      error instanceof AfectacionQueryError) {
    logger.error({ ...logContext, stack: error.stack }, 'Error de base de datos/consulta');
    return reply.code(500).send({
      ok: false,
      error: {
        code: (error as DomainError).code,
        message: error.message
      }
    });
  }

  // Error genérico de dominio
  if (error instanceof DomainError) {
    logger.error({ ...logContext, stack: error.stack }, 'Error de dominio');
    return reply.code(error.statusCode).send({
      ok: false,
      error: {
        code: error.code,
        message: error.message,
        ...(error.details && { details: error.details })
      }
    });
  }

  // Error desconocido
  logger.error({ 
    ...logContext, 
    stack: error.stack 
  }, 'Error desconocido');
  
  return reply.code(500).send({
    ok: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Ocurrió un error inesperado'
    }
  });
}

/**
 * Wrapper para ejecutar handlers con manejo de errores centralizado
 */
export async function withErrorHandler<T>(
  fn: () => Promise<T>,
  reply: FastifyReply,
  context?: any
): Promise<T | FastifyReply> {
  try {
    return await fn();
  } catch (error: any) {
    return handleAfectacionError(error, reply, context);
  }
}
