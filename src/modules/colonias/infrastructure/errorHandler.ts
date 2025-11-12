import { FastifyReply } from 'fastify';
import pino from 'pino';
import {
  ColoniaError,
  ColoniaNotFoundError,
  ColoniaByMunicipioNotFoundError,
  ColoniaByCodigoPostalNotFoundError,
  DuplicateColoniaError,
  InvalidColoniaDataError,
  MunicipioNotFoundError,
  CodigoPostalNotFoundError,
  ColoniaQueryError,
  ColoniaCommandError,
  SearchColoniasError
} from '../domain/errors.js';

const logger = pino({
  name: 'coloniasErrorHandler',
  level: process.env.LOG_LEVEL || 'info'
});

export function handleColoniasError(error: any, reply: FastifyReply): FastifyReply {
  // Log del error con contexto
  logger.error({
    error: error.message,
    name: error.name,
    code: error.code,
    statusCode: error.statusCode,
    details: error.details,
    stack: error.stack
  }, 'Error en módulo colonias');

  // Manejo específico de errores del dominio colonias
  if (error instanceof ColoniaNotFoundError) {
    return reply.status(404).send({
      error: 'Colonia no encontrada',
      message: error.message,
      code: error.code
    });
  }

  if (error instanceof ColoniaByMunicipioNotFoundError) {
    return reply.status(404).send({
      error: 'Colonias no encontradas',
      message: error.message,
      code: error.code
    });
  }

  if (error instanceof ColoniaByCodigoPostalNotFoundError) {
    return reply.status(404).send({
      error: 'Colonias no encontradas',
      message: error.message,
      code: error.code
    });
  }

  if (error instanceof DuplicateColoniaError) {
    return reply.status(409).send({
      error: 'Colonia duplicada',
      message: error.message,
      code: error.code
    });
  }

  if (error instanceof InvalidColoniaDataError) {
    return reply.status(400).send({
      error: 'Datos de colonia inválidos',
      message: error.message,
      code: error.code
    });
  }

  if (error instanceof MunicipioNotFoundError) {
    return reply.status(400).send({
      error: 'Municipio no encontrado',
      message: error.message,
      code: error.code
    });
  }

  if (error instanceof CodigoPostalNotFoundError) {
    return reply.status(400).send({
      error: 'Código postal no encontrado',
      message: error.message,
      code: error.code
    });
  }

  if (error instanceof ColoniaQueryError) {
    return reply.status(500).send({
      error: 'Error en consulta de colonias',
      message: error.message,
      code: error.code
    });
  }

  if (error instanceof ColoniaCommandError) {
    return reply.status(500).send({
      error: 'Error en operación de colonias',
      message: error.message,
      code: error.code
    });
  }

  if (error instanceof SearchColoniasError) {
    return reply.status(400).send({
      error: 'Error en búsqueda de colonias',
      message: error.message,
      code: error.code
    });
  }

  if (error instanceof ColoniaError) {
    return reply.status(error.statusCode || 500).send({
      error: 'Error en colonias',
      message: error.message,
      code: error.code
    });
  }

  // Errores genéricos
  if (error.code === '23505') { // Unique constraint violation
    return reply.status(409).send({
      error: 'Conflicto de datos',
      message: 'Ya existe una colonia con estos datos'
    });
  }

  if (error.code === '23503') { // Foreign key constraint violation
    return reply.status(400).send({
      error: 'Referencia inválida',
      message: 'Los datos referenciados no existen'
    });
  }

  // Error genérico
  logger.error({
    error: error.message,
    stack: error.stack
  }, 'Error no manejado en módulo colonias');

  return reply.status(500).send({
    error: 'Error interno del servidor',
    message: 'Ha ocurrido un error inesperado'
  });
}