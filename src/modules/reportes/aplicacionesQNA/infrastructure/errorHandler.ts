import { FastifyReply } from 'fastify';
import { AplicacionesQNAError } from '../domain/errors.js';

/**
 * Manejador centralizado de errores para el submódulo aplicacionesQNA
 */
export function handleAplicacionesQNAError(error: unknown, reply: FastifyReply): FastifyReply {
  // Log del error para debugging
  console.error('Error en módulo aplicacionesQNA:', error);

  // Si es un error del dominio aplicacionesQNA, manejarlo específicamente
  if (error instanceof AplicacionesQNAError) {
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

