import { FastifyReply } from 'fastify';
import { RetencionesPorCobrarError } from '../domain/errors.js';

/**
 * Manejador centralizado de errores para el módulo retencionesPorCobrar
 */
export function handleRetencionesPorCobrarError(error: unknown, reply: FastifyReply): FastifyReply {
  // Log del error para debugging
  console.error('[ERROR_HANDLER] Error en módulo retencionesPorCobrar:', {
    error,
    errorType: error?.constructor?.name,
    isRetencionesError: error instanceof RetencionesPorCobrarError,
    errorCode: (error as any)?.code,
    errorMessage: (error as any)?.message
  });

  // Si es un error del dominio retencionesPorCobrar, manejarlo específicamente
  if (error instanceof RetencionesPorCobrarError) {
    console.log('[ERROR_HANDLER] Error reconocido como RetencionesPorCobrarError', {
      code: error.code,
      message: error.message,
      statusCode: error.statusCode
    });

    const response: any = {
      ok: false,
      error: {
        code: error.code,
        message: error.message,
        timestamp: new Date().toISOString()
      }
    };

    // Si el error es que los registros ya existen, incluir registrosExistentes vacío
    if (error.code === 'RECORDS_ALREADY_EXIST') {
      response.registrosExistentes = {};
      console.log('[ERROR_HANDLER] Agregando registrosExistentes vacío a la respuesta');
    }

    console.log('[ERROR_HANDLER] Respuesta completa a enviar:', JSON.stringify(response, null, 2));
    
    // Serializar manualmente ANTES de enviar para evitar problemas con Fastify
    const jsonString = JSON.stringify(response);
    reply.type('application/json');
    const sentResponse = reply.code(error.statusCode).send(jsonString);
    console.log('[ERROR_HANDLER] Respuesta enviada');
    return sentResponse;
  }

  // Si no es RetencionesPorCobrarError pero tiene el código RECORDS_ALREADY_EXIST
  if ((error as any)?.code === 'RECORDS_ALREADY_EXIST') {
    console.log('[ERROR_HANDLER] Error con código RECORDS_ALREADY_EXIST pero no es instancia de RetencionesPorCobrarError');
    const errorResponse = {
      ok: false,
      error: {
        code: 'RECORDS_ALREADY_EXIST',
        message: (error as any)?.message || 'Ya existen registros para estas claves orgánicas y periodo',
        timestamp: new Date().toISOString()
      },
      registrosExistentes: {}
    };
    
    // Serializar manualmente ANTES de enviar
    const jsonString = JSON.stringify(errorResponse);
    reply.type('application/json');
    return reply.code(409).send(jsonString);
  }

  // Si es un error de validación de Fastify
  if (error instanceof Error && 'validation' in error) {
    return reply.code(400).send({
      ok: false,
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
    ok: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Error interno del servidor',
      timestamp: new Date().toISOString()
    }
  });
}

