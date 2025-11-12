import { FastifyReply } from 'fastify';
import { DomainError } from '../../../utils/errors.js';
import {
  Organica0Error,
  Organica0NotFoundError,
  Organica0AlreadyExistsError,
  Organica0InvalidClaveError,
  Organica0InvalidNombreError,
  Organica0InvalidEstatusError,
  Organica0InvalidFechaError,
  Organica0InUseError,
  Organica0PermissionError
} from '../domain/errors.js';

/**
 * Manejador centralizado de errores para el módulo organica0
 */
export function handleOrganica0Error(error: unknown, reply: FastifyReply): FastifyReply {
  // Log del error para debugging
  console.error('Error en módulo organica0:', error);

  // Si es un error del dominio organica0, manejarlo específicamente
  if (error instanceof Organica0Error) {
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