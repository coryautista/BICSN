import { FastifyReply } from 'fastify';
import { AplicacionQuincenalError } from '../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'AplicacionQuincenalErrorHandler',
  level: process.env.LOG_LEVEL || 'info'
});

/**
 * Manejador centralizado de errores para el módulo aplicacionQuincenal
 */
export function handleAplicacionQuincenalError(error: unknown, reply: FastifyReply): FastifyReply {
  // Log del error usando logger apropiado
  logger.error({
    error: error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name
    } : error
  }, 'Error en módulo aplicacionQuincenal');

  // Si es un error del dominio aplicacionQuincenal, manejarlo específicamente
  if (error instanceof AplicacionQuincenalError) {
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

