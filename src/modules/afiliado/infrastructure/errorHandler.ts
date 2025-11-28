import { FastifyReply } from 'fastify';
import pino from 'pino';
import { fail } from '../../../utils/http.js';
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
  AfiliadoValidationError,
  AplicarBDIsspeaError,
  OrganicaNoConfiguradaError,
  NoAfiliadosElegiblesError
} from '../domain/errors.js';

const logger = pino({
  name: 'afiliadoErrorHandler',
  level: process.env.LOG_LEVEL || 'info'
});

/**
 * Manejador centralizado de errores para el módulo Afiliado
 * Proporciona logging estructurado y respuestas HTTP seguras
 */
export function handleAfiliadoError(error: any, reply: FastifyReply, context?: any): FastifyReply {
  const logContext = {
    module: 'afiliado',
    errorType: error.constructor.name,
    errorCode: error.code || 'UNKNOWN_ERROR',
    operation: context?.operation || 'unknown',
    user: context?.user || null,
    timestamp: new Date().toISOString()
  };

  // Log del error con contexto estructurado
  logger.error({
    ...logContext,
    error: {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack
    },
    timestamp: new Date().toISOString()
  }, 'Error en módulo Afiliado');

  // Errores de validación (400)
  if (error instanceof InvalidAfiliadoDataError ||
      error instanceof InvalidCurpError ||
      error instanceof InvalidRfcError ||
      error instanceof InvalidNumeroSeguroSocialError ||
      error instanceof InvalidFechaNacimientoError ||
      error instanceof InvalidInternoError ||
      error instanceof InternoNotFoundInFirebirdError ||
      error instanceof AfiliadoValidationError ||
      error instanceof OrganicaNoConfiguradaError) {
    return reply.code(400).send(fail(error.code || 'VALIDATION_ERROR', error.message));
  }

  // Errores de permisos (403)
  if (error instanceof AfiliadoPermissionError) {
    return reply.code(403).send(fail(error.code || 'PERMISSION_DENIED', error.message));
  }

  // Errores de no encontrado (404)
  if (error instanceof AfiliadoNotFoundError ||
      error instanceof NoAfiliadosElegiblesError) {
    return reply.code(404).send(fail(error.code || 'NOT_FOUND', error.message));
  }

  // Errores de conflicto/ya existe (409)
  if (error instanceof AfiliadoAlreadyExistsError) {
    return reply.code(409).send(fail(error.code || 'CONFLICT', error.message));
  }

  // Errores de regla de negocio (409)
  if (error instanceof CambioSueldoError ||
      error instanceof BajaPermanenteError ||
      error instanceof BajaSuspensionError ||
      error instanceof TerminarSuspensionError) {
    return reply.code(409).send(fail(error.code || 'BUSINESS_RULE_VIOLATION', error.message));
  }

  // Errores de base de datos (500)
  if (error instanceof AfiliadoRegistrationError ||
      error instanceof AfiliadoUpdateError ||
      error instanceof AfiliadoDeletionError ||
      error instanceof AfiliadoQueryError ||
      error instanceof MovimientosQuincenalesQueryError ||
      error instanceof AplicarBDIsspeaError) {
    return reply.code(500).send(fail('DATABASE_ERROR', 'Error interno del servidor al procesar la solicitud de afiliado'));
  }

  // Errores de dominio genéricos (500)
  if (error instanceof DomainError) {
    return reply.code(500).send(fail(error.code || 'DOMAIN_ERROR', 'Error interno del servidor en el dominio de afiliado'));
  }

  // Errores no manejados (500)
  // Si el error tiene un mensaje específico, intentar detectar el tipo por el mensaje
  if (error.message) {
    // Detectar errores de duplicado por mensaje
    if (error.message.includes('Ya existe un afiliado') || 
        error.message.includes('ya está registrado') ||
        error.message.includes('duplicado')) {
      return reply.code(409).send(fail('CONFLICT', error.message));
    }
    
    // Detectar errores de validación por mensaje
    if (error.message.includes('inválido') || 
        error.message.includes('no es válido') ||
        error.message.includes('no tiene un formato válido')) {
      return reply.code(400).send(fail('VALIDATION_ERROR', error.message));
    }
    
    // Detectar errores de no encontrado por mensaje
    if (error.message.includes('no encontrado') || 
        error.message.includes('no existe')) {
      return reply.code(404).send(fail('NOT_FOUND', error.message));
    }
  }
  
  logger.error({
    ...logContext,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    },
    timestamp: new Date().toISOString()
  }, 'Error no manejado en módulo Afiliado');

  // Incluir el mensaje del error si está disponible, de lo contrario usar mensaje genérico
  const errorMessage = error.message || 'Error interno del servidor';
  return reply.code(500).send(fail('INTERNAL_ERROR', errorMessage));
}