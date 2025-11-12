import { FastifyReply } from 'fastify';
import pino from 'pino';
import {
  LogError,
  LogStatsError,
  LogContentError,
  LogSearchError,
  LogCleanupError,
  LogArchiveError,
  InvalidLogCleanupParamsError,
  InvalidLogArchiveParamsError,
  LogFileNotFoundError,
  LogPermissionError,
  LogFileSystemError
} from '../domain/errors.js';

const logger = pino({
  name: 'logErrorHandler',
  level: process.env.LOG_LEVEL || 'info'
});

/**
 * Manejador centralizado de errores para el módulo Log
 * Proporciona logging estructurado y respuestas HTTP seguras
 */
export function handleLogError(error: any, reply: FastifyReply): FastifyReply {
  // Log del error con contexto estructurado
  logger.error({
    error: {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack
    },
    module: 'log',
    timestamp: new Date().toISOString()
  }, 'Error en módulo Log');

  // Manejo específico de errores del dominio Log
  if (error instanceof LogFileNotFoundError) {
    return reply.code(404).send({
      ok: false,
      error: {
        code: error.code,
        message: error.message
      }
    });
  }

  if (error instanceof InvalidLogCleanupParamsError ||
      error instanceof InvalidLogArchiveParamsError) {
    return reply.code(400).send({
      ok: false,
      error: {
        code: error.code,
        message: error.message
      }
    });
  }

  if (error instanceof LogPermissionError) {
    return reply.code(403).send({
      ok: false,
      error: {
        code: error.code,
        message: error.message
      }
    });
  }

  if (error instanceof LogFileSystemError) {
    return reply.code(500).send({
      ok: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error interno del sistema de archivos'
      }
    });
  }

  // Manejo de errores específicos de operaciones
  if (error instanceof LogStatsError ||
      error instanceof LogContentError ||
      error instanceof LogSearchError ||
      error instanceof LogCleanupError ||
      error instanceof LogArchiveError) {
    return reply.code(500).send({
      ok: false,
      error: {
        code: error.code,
        message: error.message
      }
    });
  }

  // Manejo de errores genéricos del dominio
  if (error instanceof LogError) {
    return reply.code(400).send({
      ok: false,
      error: {
        code: error.code,
        message: error.message
      }
    });
  }

  // Error genérico no manejado
  logger.error({
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    },
    module: 'log',
    timestamp: new Date().toISOString()
  }, 'Error no manejado en módulo Log');

  return reply.code(500).send({
    ok: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Error interno del servidor'
    }
  });
}