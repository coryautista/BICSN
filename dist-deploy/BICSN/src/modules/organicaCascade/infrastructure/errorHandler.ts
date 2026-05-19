import { FastifyReply } from 'fastify';
import { OrganicaCascadeError } from '../domain/errors.js';

export function handleOrganicaCascadeError(error: any, reply: FastifyReply): FastifyReply {
  // Log del error con contexto
  console.error('Error en módulo organicaCascade:', error);

  // Si es un error del dominio organicaCascade, manejarlo específicamente
  if (error instanceof OrganicaCascadeError) {
    return reply.code(error.statusCode).send({
      ok: false,
      error: {
        code: error.code,
        message: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Error genérico para errores no manejados
  console.error('Error no manejado en organicaCascade:', error);
  return reply.code(500).send({
    ok: false,
    error: {
      code: 'ORGANICA_CASCADE_INTERNAL_ERROR',
      message: 'Error interno del servidor en el módulo organica cascade.'
    }
  });
}