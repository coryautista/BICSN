import { FastifyReply } from 'fastify';
import pino from 'pino';
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
  // Log del error con contexto
  logger.error({
    error: error.message,
    name: error.name,
    code: error.code,
    statusCode: error.statusCode,
    details: error.details,
    stack: error.stack
  }, 'Error en módulo eventoCalendario');

  // Manejo específico de errores del dominio eventoCalendario
  if (error instanceof EventoCalendarioNotFoundError) {
    return reply.status(404).send({
      error: 'Evento de calendario no encontrado',
      message: error.message,
      code: error.code
    });
  }

  if (error instanceof EventoCalendariosNotFoundError) {
    return reply.status(404).send({
      error: 'Eventos de calendario no encontrados',
      message: error.message,
      code: error.code
    });
  }

  if (error instanceof EventoCalendarioByAnioNotFoundError) {
    return reply.status(404).send({
      error: 'Eventos de calendario no encontrados',
      message: error.message,
      code: error.code
    });
  }

  if (error instanceof EventoCalendarioByDateRangeNotFoundError) {
    return reply.status(404).send({
      error: 'Eventos de calendario no encontrados',
      message: error.message,
      code: error.code
    });
  }

  if (error instanceof DuplicateEventoCalendarioError) {
    return reply.status(409).send({
      error: 'Evento de calendario duplicado',
      message: error.message,
      code: error.code
    });
  }

  if (error instanceof InvalidEventoCalendarioDataError) {
    return reply.status(400).send({
      error: 'Datos de evento de calendario inválidos',
      message: error.message,
      code: error.code
    });
  }

  if (error instanceof InvalidEventoCalendarioTipoError) {
    return reply.status(400).send({
      error: 'Tipo de evento inválido',
      message: error.message,
      code: error.code
    });
  }

  if (error instanceof InvalidEventoCalendarioFechaError) {
    return reply.status(400).send({
      error: 'Fecha de evento inválida',
      message: error.message,
      code: error.code
    });
  }

  if (error instanceof InvalidEventoCalendarioAnioError) {
    return reply.status(400).send({
      error: 'Año de evento inválido',
      message: error.message,
      code: error.code
    });
  }

  if (error instanceof EventoCalendarioQueryError) {
    return reply.status(500).send({
      error: 'Error en consulta de eventos de calendario',
      message: error.message,
      code: error.code
    });
  }

  if (error instanceof EventoCalendarioCommandError) {
    return reply.status(500).send({
      error: 'Error en operación de eventos de calendario',
      message: error.message,
      code: error.code
    });
  }

  if (error instanceof EventoCalendarioError) {
    return reply.status(error.statusCode || 500).send({
      error: 'Error en eventos de calendario',
      message: error.message,
      code: error.code
    });
  }

  // Errores genéricos
  if (error.code === '23505') { // Unique constraint violation
    return reply.status(409).send({
      error: 'Conflicto de datos',
      message: 'Ya existe un evento de calendario con estos datos'
    });
  }

  // Error genérico
  logger.error({
    error: error.message,
    stack: error.stack
  }, 'Error no manejado en módulo eventoCalendario');

  return reply.status(500).send({
    error: 'Error interno del servidor',
    message: 'Ha ocurrido un error inesperado'
  });
}