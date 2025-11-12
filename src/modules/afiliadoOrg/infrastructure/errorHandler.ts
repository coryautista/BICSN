import { FastifyReply } from 'fastify';
import { DomainError } from '../../../utils/errors.js';
import {
  AfiliadoOrgNotFoundError,
  AfiliadoOrgAlreadyExistsError,
  InvalidAfiliadoOrgDataError,
  InvalidOrgHierarchyError,
  InvalidOrgLevelError,
  InvalidSueldoError,
  InvalidFechaMovAltError,
  AfiliadoNotFoundForOrgError,
  AfiliadoOrgPermissionError,
  AfiliadoOrgRegistrationError,
  AfiliadoOrgUpdateError,
  AfiliadoOrgDeletionError,
  AfiliadoOrgQueryError,
  DuplicateAfiliadoOrgError,
  InvalidOrgClaveError,
  AfiliadoOrgValidationError
} from '../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'afiliadoOrg-errorHandler',
  level: process.env.LOG_LEVEL || 'info'
});

/**
 * Maneja errores específicos del módulo de afiliadoOrg
 * y retorna respuestas HTTP apropiadas
 */
export function handleAfiliadoOrgError(error: Error, reply: FastifyReply, context?: any): FastifyReply {
  const logContext = {
    errorName: error.name,
    errorMessage: error.message,
    operation: context?.operation || 'unknown',
    user: context?.user || null,
    timestamp: new Date().toISOString()
  };

  // Errores de validación (400)
  if (error instanceof InvalidAfiliadoOrgDataError ||
      error instanceof InvalidOrgHierarchyError ||
      error instanceof InvalidOrgLevelError ||
      error instanceof InvalidSueldoError ||
      error instanceof InvalidFechaMovAltError ||
      error instanceof AfiliadoNotFoundForOrgError ||
      error instanceof InvalidOrgClaveError ||
      error instanceof AfiliadoOrgValidationError) {
    logger.warn(logContext, 'Error de validación en afiliado-org');
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
  if (error instanceof AfiliadoOrgPermissionError) {
    logger.warn(logContext, 'Error de permisos en afiliado-org');
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
  if (error instanceof AfiliadoOrgNotFoundError) {
    logger.warn(logContext, 'Afiliado-org no encontrado');
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
  if (error instanceof AfiliadoOrgAlreadyExistsError ||
      error instanceof DuplicateAfiliadoOrgError) {
    logger.warn(logContext, 'Afiliado-org ya existe');
    return reply.status(409).send({
      ok: false,
      error: {
        code: 'CONFLICT',
        message: error.message,
        details: (error as any).details || null
      }
    });
  }

  // Errores de base de datos (500)
  if (error instanceof AfiliadoOrgRegistrationError ||
      error instanceof AfiliadoOrgUpdateError ||
      error instanceof AfiliadoOrgDeletionError ||
      error instanceof AfiliadoOrgQueryError) {
    logger.error({ ...logContext, stack: error.stack }, 'Error de base de datos en afiliado-org');
    return reply.status(500).send({
      ok: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Error interno del servidor al procesar la solicitud de afiliado-org'
      }
    });
  }

  // Errores de dominio genéricos (500)
  if (error instanceof DomainError) {
    logger.error({ ...logContext, stack: error.stack }, 'Error de dominio en afiliado-org');
    return reply.status(500).send({
      ok: false,
      error: {
        code: 'DOMAIN_ERROR',
        message: 'Error interno del servidor en el dominio de afiliado-org'
      }
    });
  }

  // Errores no manejados (500)
  logger.error({ ...logContext, stack: error.stack }, 'Error no manejado en afiliado-org');
  return reply.status(500).send({
    ok: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Error interno del servidor'
    }
  });
}