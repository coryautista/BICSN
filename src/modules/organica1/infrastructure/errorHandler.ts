import { FastifyReply } from 'fastify';
import { DomainError } from '../../../utils/errors.js';
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

/**
 * Manejador centralizado de errores para el módulo organica1
 */
export function handleOrganica1Error(error: unknown, reply: FastifyReply): FastifyReply {
  // Log del error para debugging
  console.error('Error en módulo organica1:', error);

  // Si es un error del dominio organica1, manejarlo específicamente
  if (error instanceof Organica1Error) {
    return reply.status(error.statusCode).send({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Si es un error de dominio genérico, manejarlo
  if (error instanceof DomainError) {
    return reply.status(error.statusCode).send({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Si es un error de validación de Fastify
  if (error instanceof Error && 'validation' in error) {
    return reply.status(400).send({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Datos de entrada inválidos',
        details: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Error genérico del servidor
  return reply.status(500).send({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Error interno del servidor',
      timestamp: new Date().toISOString()
    }
  });
}