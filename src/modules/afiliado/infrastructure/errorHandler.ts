import { FastifyReply } from 'fastify';
import { DomainError } from '../../../utils/errors.js';
import {
  AfiliadoNotFoundError,
  AfiliadoAlreadyExistsError,
  InvalidAfiliadoDataError,
  InvalidCurpError,
  InvalidRfcError,
  InvalidNumeroSeguroSocialError,
  InvalidFechaNacimientoError,
  InvalidInternoError,
  InternoNotFoundInFirebirdError,
  AfiliadoPermissionError,
  AfiliadoRegistrationError,
  AfiliadoUpdateError,
  AfiliadoDeletionError,
  AfiliadoQueryError,
  CambioSueldoError,
  BajaPermanenteError,
  BajaSuspensionError,
  TerminarSuspensionError,
  MovimientosQuincenalesQueryError,
  AfiliadoValidationError
} from '../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'afiliado-errorHandler',
  level: process.env.LOG_LEVEL || 'info'
});

/**
 * Maneja errores específicos del módulo de afiliado
 * y retorna respuestas HTTP apropiadas
 */
export function handleAfiliadoError(error: Error, reply: FastifyReply, context?: any): FastifyReply {
  const logContext = {
    errorName: error.name,
    errorMessage: error.message,
    operation: context?.operation || 'unknown',
    user: context?.user || null,
    timestamp: new Date().toISOString()
  };

  // Errores de validación (400)
  if (error instanceof InvalidAfiliadoDataError ||
      error instanceof InvalidCurpError ||
      error instanceof InvalidRfcError ||
      error instanceof InvalidNumeroSeguroSocialError ||
      error instanceof InvalidFechaNacimientoError ||
      error instanceof InvalidInternoError ||
      error instanceof InternoNotFoundInFirebirdError ||
      error instanceof AfiliadoValidationError) {
    logger.warn(logContext, 'Error de validación en afiliado');
    return reply.status(400).send({
      ok: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: error.message,
        details: (error as any).details || null
      }
    });
  }

  // Errores de permisos (403)
  if (error instanceof AfiliadoPermissionError) {
    logger.warn(logContext, 'Error de permisos en afiliado');
    return reply.status(403).send({
      ok: false,
      error: {
        code: 'PERMISSION_DENIED',
        message: error.message,
        details: (error as any).details || null
      }
    });
  }

  // Errores de no encontrado (404)
  if (error instanceof AfiliadoNotFoundError) {
    logger.warn(logContext, 'Afiliado no encontrado');
    return reply.status(404).send({
      ok: false,
      error: {
        code: 'NOT_FOUND',
        message: error.message,
        details: (error as any).details || null
      }
    });
  }

  // Errores de conflicto/ya existe (409)
  if (error instanceof AfiliadoAlreadyExistsError) {
    logger.warn(logContext, 'Afiliado ya existe');
    return reply.status(409).send({
      ok: false,
      error: {
        code: 'CONFLICT',
        message: error.message,
        details: (error as any).details || null
      }
    });
  }

  // Errores de regla de negocio (409)
  if (error instanceof CambioSueldoError ||
      error instanceof BajaPermanenteError ||
      error instanceof BajaSuspensionError ||
      error instanceof TerminarSuspensionError) {
    logger.warn(logContext, 'Error de regla de negocio en afiliado');
    return reply.status(409).send({
      ok: false,
      error: {
        code: 'BUSINESS_RULE_VIOLATION',
        message: error.message,
        details: (error as any).details || null
      }
    });
  }

  // Errores de base de datos (500)
  if (error instanceof AfiliadoRegistrationError ||
      error instanceof AfiliadoUpdateError ||
      error instanceof AfiliadoDeletionError ||
      error instanceof AfiliadoQueryError ||
      error instanceof MovimientosQuincenalesQueryError) {
    logger.error({ ...logContext, stack: error.stack }, 'Error de base de datos en afiliado');
    return reply.status(500).send({
      ok: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Error interno del servidor al procesar la solicitud de afiliado'
      }
    });
  }

  // Errores de dominio genéricos (500)
  if (error instanceof DomainError) {
    logger.error({ ...logContext, stack: error.stack }, 'Error de dominio en afiliado');
    return reply.status(500).send({
      ok: false,
      error: {
        code: 'DOMAIN_ERROR',
        message: 'Error interno del servidor en el dominio de afiliado'
      }
    });
  }

  // Errores no manejados (500)
  logger.error({ ...logContext, stack: error.stack }, 'Error no manejado en afiliado');
  return reply.status(500).send({
    ok: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Error interno del servidor'
    }
  });
}