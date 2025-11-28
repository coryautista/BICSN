import { FastifyReply } from 'fastify';
import pino from 'pino';
import { fail } from '../../../utils/http.js';
import {
  EventoCalendarioError,
  EventoCalendarioNotFoundError,
  EventoCalendarioByAnioNotFoundError,
  EventoCalendarioByDateRangeNotFoundError,
  DuplicateEventoCalendarioError,
  InvalidEventoCalendarioDataError,
  InvalidEventoCalendarioTipoError,
  InvalidEventoCalendarioFechaError,
  InvalidEventoCalendarioAnioError,
  EventoCalendarioQueryError,
  EventoCalendarioCommandError,
  EventoCalendariosNotFoundError
} from '../domain/errors.js';

const logger = pino({
  name: 'eventoCalendarioErrorHandler',
  level: process.env.LOG_LEVEL || 'info'
});

export function handleEventoCalendarioError(error: any, reply: FastifyReply): FastifyReply {
  const logContext = {
    module: 'eventoCalendario',
    errorType: error.constructor.name,
    errorCode: error.code || 'UNKNOWN_ERROR',
    timestamp: new Date().toISOString()
  };

  // Log del error con contexto
  logger.error({
    ...logContext,
    error: error.message,
    statusCode: error.statusCode,
    details: error.details,
    stack: error.stack
  }, 'Error en módulo eventoCalendario');

  // Manejo específico de errores del dominio eventoCalendario
  if (error instanceof EventoCalendarioNotFoundError) {
    return reply.code(404).send(fail(error.code, error.message));
  }

  if (error instanceof EventoCalendariosNotFoundError) {
    return reply.code(404).send(fail(error.code, error.message));
  }

  if (error instanceof EventoCalendarioByAnioNotFoundError) {
    return reply.code(404).send(fail(error.code, error.message));
  }

  if (error instanceof EventoCalendarioByDateRangeNotFoundError) {
    return reply.code(404).send(fail(error.code, error.message));
  }

  if (error instanceof DuplicateEventoCalendarioError) {
    return reply.code(409).send(fail(error.code, error.message));
  }

  if (error instanceof InvalidEventoCalendarioDataError) {
    return reply.code(400).send(fail(error.code, error.message));
  }

  if (error instanceof InvalidEventoCalendarioTipoError) {
    return reply.code(400).send(fail(error.code, error.message));
  }

  if (error instanceof InvalidEventoCalendarioFechaError) {
    return reply.code(400).send(fail(error.code, error.message));
  }

  if (error instanceof InvalidEventoCalendarioAnioError) {
    return reply.code(400).send(fail(error.code, error.message));
  }

  if (error instanceof EventoCalendarioQueryError) {
    return reply.code(500).send(fail(error.code, error.message));
  }

  if (error instanceof EventoCalendarioCommandError) {
    return reply.code(500).send(fail(error.code, error.message));
  }

  if (error instanceof EventoCalendarioError) {
    return reply.code(error.statusCode || 500).send(fail(error.code, error.message));
  }

  // Errores genéricos
  if (error.code === '23505') { // Unique constraint violation
    return reply.code(409).send(fail('DUPLICATE_ERROR', 'Ya existe un evento de calendario con estos datos'));
  }

  // Error genérico
  return reply.code(500).send(fail('INTERNAL_ERROR', 'Ha ocurrido un error inesperado'));
}