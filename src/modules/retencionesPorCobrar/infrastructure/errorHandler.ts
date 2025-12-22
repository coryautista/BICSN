import { FastifyReply } from 'fastify';
import { RetencionesPorCobrarError } from '../domain/errors.js';

/**
 * Manejador centralizado de errores para el módulo retencionesPorCobrar
 */
export function handleRetencionesPorCobrarError(error: unknown, reply: FastifyReply): FastifyReply {
  // Log del error para debugging
  console.error('Error en módulo retencionesPorCobrar:', error);

  // Si es un error del dominio retencionesPorCobrar, manejarlo específicamente
  if (error instanceof RetencionesPorCobrarError) {
    return reply.code(error.statusCode).send({
      ok: false,
      error: {
        code: error.code,
        message: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Si es un error de validación de Fastify
  if (error instanceof Error && 'validation' in error) {
    return reply.code(400).send({
      ok: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Datos de entrada inválidos',
        details: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Error genérico del servidor
  return reply.code(500).send({
    ok: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Error interno del servidor',
      timestamp: new Date().toISOString()
    }
  });
}

