import { FastifyReply } from 'fastify';
import { AportacionFondoDomainError } from '../domain/errors.js';

export function handleAportacionesFondosError(error: any, reply: FastifyReply): FastifyReply {
  // Log del error con contexto
  console.error('[APORTACIONES_FONDOS] Error:', error);

  // Si es un error del dominio aportaciones fondos, manejarlo específicamente
  if (error instanceof AportacionFondoDomainError) {
    const statusCode = getStatusCode(error.code);
    return reply.code(statusCode).send({
      ok: false,
      error: {
        code: error.code,
        message: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Error genérico para errores no manejados
  console.error('[APORTACIONES_FONDOS] Error no manejado:', error);
  return reply.code(500).send({
    ok: false,
    error: {
      code: 'APORTACIONES_FONDOS_INTERNAL_ERROR',
      message: 'Error interno del servidor en el módulo aportaciones fondos.'
    }
  });
}

function getStatusCode(errorCode: string): number {
  switch (errorCode) {
    case 'TIPO_FONDO_INVALIDO':
      return 400;
    case 'CLAVE_ORGANICA_REQUERIDA':
      return 400;
    case 'CLAVE_ORGANICA_INVALIDA':
      return 400;
    case 'PARAMETRO_INVALIDO':
      return 400;
    case 'USUARIO_NO_AUTORIZADO':
      return 403;
    case 'DATOS_NO_ENCONTRADOS':
      return 404;
    case 'PERIODO_NO_ENCONTRADO':
      return 404;
    case 'ERROR_FIREBIRD_CONEXION':
      return 503; // Service Unavailable
    case 'ERROR_FIREBIRD_PROCEDIMIENTO':
      return 500;
    case 'ERROR_CALCULO_APORTACION':
      return 500;
    default:
      return 500;
  }
}