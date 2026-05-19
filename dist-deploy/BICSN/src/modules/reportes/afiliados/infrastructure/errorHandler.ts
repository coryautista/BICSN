import { FastifyReply } from 'fastify';
import { AfiliadosReportesError } from '../domain/errors.js';

/**
 * Manejador centralizado de errores para el submódulo afiliados reportes
 */
export function handleAfiliadosReportesError(error: unknown, reply: FastifyReply): FastifyReply {
  // Log del error para debugging
  console.error('Error en módulo afiliados reportes:', error);

  // Si es un error del dominio afiliados reportes, manejarlo específicamente
  if (error instanceof AfiliadosReportesError) {
    return reply.code(error.statusCode).send({
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
    return reply.code(400).send({
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
  return reply.code(500).send({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Error interno del servidor',
      timestamp: new Date().toISOString()
    }
  });
}

