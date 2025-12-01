import { FastifyReply } from 'fastify';
import pino from 'pino';
import { fail } from '../../../utils/http.js';
import {
  ReportError,
  InvalidReportFiltersError,
  ReportNotFoundError,
  InvalidDateRangeError,
  MissingMonthOrYearError,
  InvalidMonthError,
  InvalidYearError,
  ReportDatabaseError
} from '../domain/errors.js';

const logger = pino({
  name: 'reportesErrorHandler',
  level: process.env.LOG_LEVEL || 'info'
});

/**
 * Manejador centralizado de errores para el módulo Reportes
 * Proporciona logging estructurado y respuestas HTTP seguras
 */
export function handleReportsError(error: any, reply: FastifyReply): FastifyReply {
  const logContext = {
    module: 'reportes',
    errorType: error.constructor?.name || 'Unknown',
    errorCode: error.code || 'UNKNOWN_ERROR',
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
  }, 'Error en módulo Reportes');

  // Manejo específico de errores del dominio Reportes
  if (error instanceof InvalidReportFiltersError) {
    return reply.code(400).send(fail(error.code, error.message));
  }

  if (error instanceof ReportNotFoundError) {
    return reply.code(404).send(fail(error.code, error.message));
  }

  if (error instanceof InvalidDateRangeError) {
    return reply.code(400).send(fail(error.code, error.message));
  }

  if (error instanceof MissingMonthOrYearError) {
    return reply.code(400).send(fail(error.code, error.message));
  }

  if (error instanceof InvalidMonthError) {
    return reply.code(400).send(fail(error.code, error.message));
  }

  if (error instanceof InvalidYearError) {
    return reply.code(400).send(fail(error.code, error.message));
  }

  if (error instanceof ReportDatabaseError) {
    return reply.code(500).send(fail(error.code, error.message));
  }

  // Manejo de errores genéricos del dominio
  if (error instanceof ReportError) {
    return reply.code(error.statusCode).send(fail(error.code, error.message));
  }

  // Si es un error de validación de Fastify
  if (error instanceof Error && 'validation' in error) {
    return reply.code(400).send(fail('VALIDATION_ERROR', 'Datos de entrada inválidos'));
  }

  // Error genérico no manejado
  logger.error({
    ...logContext,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    },
    timestamp: new Date().toISOString()
  }, 'Error no manejado en módulo Reportes');

  return reply.code(500).send(fail('INTERNAL_ERROR', 'Error interno del servidor'));
}