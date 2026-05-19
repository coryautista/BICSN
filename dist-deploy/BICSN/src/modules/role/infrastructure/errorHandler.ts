import { FastifyReply } from 'fastify';
import { DomainError } from '../../../utils/errors.js';
import { RoleError } from '../domain/errors.js';

/**
 * Manejador centralizado de errores para el módulo role
 */
export function handleRoleError(error: unknown, reply: FastifyReply, userId?: string): FastifyReply {
  // Log del error con contexto del usuario
  const timestamp = new Date().toISOString();
  const logContext = userId ? ` [Usuario: ${userId}]` : '';

  console.error(`[${timestamp}] Error en módulo role${logContext}:`, {
    error: error instanceof Error ? error.message : 'Error desconocido',
    stack: error instanceof Error ? error.stack : undefined,
    type: error instanceof DomainError ? error.code : 'UNKNOWN_ERROR'
  });

  // Si es un error de dominio del módulo role
  if (error instanceof RoleError) {
    const statusCode = error.statusCode;
    const response = {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        timestamp
      }
    };

    return reply.code(statusCode).send(response);
  }

  // Si es cualquier otro error de dominio
  if (error instanceof DomainError) {
    const response = {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        timestamp
      }
    };

    return reply.code(error.statusCode).send(response);
  }

  // Error genérico no controlado
  console.error(`[${timestamp}] Error no controlado en módulo role${logContext}:`, error);

  const response = {
    success: false,
    error: {
      code: 'ROLE_INTERNAL_ERROR',
      message: 'Error interno del servidor en módulo role',
      timestamp
    }
  };

  return reply.code(500).send(response);
}