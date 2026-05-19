import { FastifyReply } from 'fastify';
import { OrgPersonalError } from '../domain/errors.js';

export function handleOrgPersonalError(error: any, reply: FastifyReply): FastifyReply {
  const timestamp = new Date().toISOString();
  
  // Log del error con contexto completo
  console.error(`[${timestamp}] Error en módulo orgPersonal:`, {
    error: error.message || 'Error desconocido',
    code: error.code,
    statusCode: error.statusCode,
    stack: error.stack,
    name: error.name
  });

  // Si es un error del dominio orgPersonal, manejarlo específicamente
  if (error instanceof OrgPersonalError) {
    return reply.code(error.statusCode).send({
      ok: false,
      error: {
        code: error.code,
        message: error.message,
        timestamp: timestamp
      }
    });
  }

  // Error genérico para errores no manejados
  console.error(`[${timestamp}] Error no manejado en orgPersonal:`, {
    error: error.message || 'Error desconocido',
    stack: error.stack,
    name: error.name
  });
  
  return reply.code(500).send({
    ok: false,
    error: {
      code: 'ORG_PERSONAL_INTERNAL_ERROR',
      message: error.message || 'Error interno del servidor en el módulo orgPersonal.',
      timestamp: timestamp
    }
  });
}