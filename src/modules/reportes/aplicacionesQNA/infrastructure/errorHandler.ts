import { FastifyReply } from 'fastify';
import { AplicacionesQNAError, AplicacionesQNAErrorCode } from '../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'AplicacionesQNAErrorHandler',
  level: process.env.LOG_LEVEL || 'info'
});

/**
 * Manejador centralizado de errores para el submódulo aplicacionesQNA
 */
export function handleAplicacionesQNAError(error: unknown, reply: FastifyReply): FastifyReply {
  // Log del error usando logger apropiado
  logger.error({
    error: error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name
    } : error
  }, 'Error en módulo aplicacionesQNA');

  // Si es un error del dominio aplicacionesQNA, manejarlo específicamente
  if (error instanceof AplicacionesQNAError) {
    return reply.code(error.statusCode).send({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Detectar errores de conexión a Firebird
  if (error instanceof Error) {
    const errorMessage = error.message || '';
    const errorCode = (error as any).code || '';
    
    // Detectar ECONNREFUSED y otros errores de conexión
    if (errorCode === 'ECONNREFUSED' || 
        errorMessage.includes('ECONNREFUSED') || 
        errorMessage.includes('connection refused') ||
        errorMessage.includes('No se pudo conectar') ||
        errorMessage.includes('Conexión a Firebird no disponible') ||
        errorMessage.includes('Firebird connection not available')) {
      return reply.code(503).send({
        success: false,
        error: {
          code: AplicacionesQNAErrorCode.FIREBIRD_CONNECTION_ERROR,
          message: errorMessage || 'Error de conexión con la base de datos Firebird. Verifique que el servidor esté ejecutándose.',
          timestamp: new Date().toISOString()
        }
      });
    }
    
    // Detectar errores de timeout
    if (errorCode === 'ETIMEDOUT' || 
        errorMessage.includes('timeout') ||
        errorMessage.includes('Tiempo de espera agotado')) {
      return reply.code(504).send({
        success: false,
        error: {
          code: AplicacionesQNAErrorCode.FIREBIRD_QUERY_ERROR,
          message: 'La consulta a la base de datos excedió el tiempo de espera. Intente nuevamente.',
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  // Si es un error de validación de Fastify
  if (error instanceof Error && 'validation' in error) {
    return reply.code(400).send({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Datos de entrada inválidos',
        details: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Error genérico del servidor
  return reply.code(500).send({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: error instanceof Error ? error.message : 'Error interno del servidor',
      timestamp: new Date().toISOString()
    }
  });
}

