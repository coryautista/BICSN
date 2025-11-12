import { FastifyReply } from 'fastify';
import pino from 'pino';
import {
  EstadoError,
  EstadoNotFoundError,
  DuplicateEstadoError,
  InvalidEstadoDataError,
  EstadoQueryError,
  EstadoCommandError,
  EstadosNotFoundError
} from '../domain/errors.js';

const logger = pino({
  name: 'estadosErrorHandler',
  level: process.env.LOG_LEVEL || 'info'
});

export function handleEstadosError(error: any, reply: FastifyReply): FastifyReply {
  // Log del error con contexto
  logger.error({
    error: error.message,
    name: error.name,
    code: error.code,
    statusCode: error.statusCode,
    details: error.details,
    stack: error.stack
  }, 'Error en módulo estados');

  // Manejo específico de errores del dominio estados
  if (error instanceof EstadoNotFoundError) {
    return reply.status(404).send({
      error: 'Estado no encontrado',
      message: error.message,
      code: error.code
    });
  }

  if (error instanceof EstadosNotFoundError) {
    return reply.status(404).send({
      error: 'Estados no encontrados',
      message: error.message,
      code: error.code
    });
  }

  if (error instanceof DuplicateEstadoError) {
    return reply.status(409).send({
      error: 'Estado duplicado',
      message: error.message,
      code: error.code
    });
  }

  if (error instanceof InvalidEstadoDataError) {
    return reply.status(400).send({
      error: 'Datos de estado inválidos',
      message: error.message,
      code: error.code
    });
  }

  if (error instanceof EstadoQueryError) {
    return reply.status(500).send({
      error: 'Error en consulta de estados',
      message: error.message,
      code: error.code
    });
  }

  if (error instanceof EstadoCommandError) {
    return reply.status(500).send({
      error: 'Error en operación de estados',
      message: error.message,
      code: error.code
    });
  }

  if (error instanceof EstadoError) {
    return reply.status(error.statusCode || 500).send({
      error: 'Error en estados',
      message: error.message,
      code: error.code
    });
  }

  // Errores genéricos
  if (error.code === '23505') { // Unique constraint violation
    return reply.status(409).send({
      error: 'Conflicto de datos',
      message: 'Ya existe un estado con estos datos'
    });
  }

  // Error genérico
  logger.error({
    error: error.message,
    stack: error.stack
  }, 'Error no manejado en módulo estados');

  return reply.status(500).send({
    error: 'Error interno del servidor',
    message: 'Ha ocurrido un error inesperado'
  });
}