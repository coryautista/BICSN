import { FastifyReply } from 'fastify';
import pino from 'pino';
import {
  MovimientoError,
  MovimientoNotFoundError,
  MovimientoAlreadyExistsError,
  MovimientoInvalidTipoMovimientoError,
  MovimientoInvalidAfiliadoError,
  MovimientoInvalidFechaError,
  MovimientoInvalidFolioError,
  MovimientoInvalidEstatusError,
  MovimientoInvalidCreadorError,
  MovimientoCannotDeleteError,
  MovimientoPermissionError
} from '../domain/errors.js';

const logger = pino({
  name: 'movimientoErrorHandler',
  level: process.env.LOG_LEVEL || 'info'
});

/**
 * Manejador centralizado de errores para el módulo Movimiento
 * Proporciona logging estructurado y respuestas HTTP seguras
 */
export function handleMovimientoError(error: any, reply: FastifyReply): FastifyReply {
  // Log del error con contexto estructurado
  logger.error({
    error: {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack
    },
    module: 'movimiento',
    timestamp: new Date().toISOString()
  }, 'Error en módulo Movimiento');

  // Manejo específico de errores del dominio Movimiento
  if (error instanceof MovimientoNotFoundError) {
    return reply.code(404).send({
      ok: false,
      error: {
        code: error.code,
        message: error.message
      }
    });
  }

  if (error instanceof MovimientoAlreadyExistsError) {
    return reply.code(409).send({
      ok: false,
      error: {
        code: error.code,
        message: error.message
      }
    });
  }

  if (error instanceof MovimientoInvalidTipoMovimientoError ||
      error instanceof MovimientoInvalidAfiliadoError ||
      error instanceof MovimientoInvalidFechaError ||
      error instanceof MovimientoInvalidFolioError ||
      error instanceof MovimientoInvalidEstatusError ||
      error instanceof MovimientoInvalidCreadorError) {
    return reply.code(400).send({
      ok: false,
      error: {
        code: error.code,
        message: error.message
      }
    });
  }

  if (error instanceof MovimientoCannotDeleteError) {
    return reply.code(409).send({
      ok: false,
      error: {
        code: error.code,
        message: error.message
      }
    });
  }

  if (error instanceof MovimientoPermissionError) {
    return reply.code(403).send({
      ok: false,
      error: {
        code: error.code,
        message: error.message
      }
    });
  }

  // Manejo de errores genéricos del dominio
  if (error instanceof MovimientoError) {
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
    module: 'movimiento',
    timestamp: new Date().toISOString()
  }, 'Error no manejado en módulo Movimiento');

  return reply.code(500).send({
    ok: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Error interno del servidor'
    }
  });
}