import { FastifyReply } from 'fastify';
import { DomainError } from '../../../utils/errors.js';
import { ProcesoError } from '../domain/errors.js';

/**
 * Manejador centralizado de errores para el módulo proceso
 */
export function handleProcesoError(error: unknown, reply: FastifyReply, userId?: string): FastifyReply {
  // Log del error con contexto del usuario
  const timestamp = new Date().toISOString();
  const logContext = userId ? ` [Usuario: ${userId}]` : '';

  console.error(`[${timestamp}] Error en módulo proceso${logContext}:`, {
    error: error instanceof Error ? error.message : 'Error desconocido',
    stack: error instanceof Error ? error.stack : undefined,
    type: error instanceof DomainError ? error.code : 'UNKNOWN_ERROR'
  });

  // Si es un error de dominio del módulo proceso
  if (error instanceof ProcesoError) {
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
  console.error(`[${timestamp}] Error no controlado en módulo proceso${logContext}:`, error);

  const response = {
    success: false,
    error: {
      code: 'PROCESO_INTERNAL_ERROR',
      message: 'Error interno del servidor en módulo proceso',
      timestamp
    }
  };

  return reply.code(500).send(response);
}