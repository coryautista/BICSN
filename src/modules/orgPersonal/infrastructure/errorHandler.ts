import { FastifyReply } from 'fastify';
import { OrgPersonalError } from '../domain/errors.js';

export function handleOrgPersonalError(error: any, reply: FastifyReply): FastifyReply {
  // Log del error con contexto
  console.error('Error en módulo orgPersonal:', error);

  // Si es un error del dominio orgPersonal, manejarlo específicamente
  if (error instanceof OrgPersonalError) {
    return reply.status(error.statusCode).send({
      ok: false,
      error: {
        code: error.code,
        message: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Error genérico para errores no manejados
  console.error('Error no manejado en orgPersonal:', error);
  return reply.code(500).send({
    ok: false,
    error: {
      code: 'ORG_PERSONAL_INTERNAL_ERROR',
      message: 'Error interno del servidor en el módulo orgPersonal.'
    }
  });
}