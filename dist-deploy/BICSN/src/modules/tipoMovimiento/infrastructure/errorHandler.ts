import { FastifyReply } from 'fastify';
import {
  TipoMovimientoNotFoundError,
  TipoMovimientoAlreadyExistsError,
  TipoMovimientoInvalidIdError,
  TipoMovimientoInvalidAbreviaturaError,
  TipoMovimientoInvalidNombreError,
  TipoMovimientoInUseError,
  TipoMovimientoPermissionError,
  TipoMovimientoError
} from '../domain/errors.js';

export function handleTipoMovimientoError(error: any, reply: FastifyReply): void {
  const timestamp = new Date().toISOString();

  if (error instanceof TipoMovimientoNotFoundError) {
    console.error(`[${timestamp}] Error de TipoMovimiento: ${error.message}`, {
      code: error.code,
      statusCode: error.statusCode
    });
    reply.code(error.statusCode).send({
      ok: false,
      error: {
        code: error.code,
        message: error.message
      }
    });
    return;
  }

  if (error instanceof TipoMovimientoAlreadyExistsError) {
    console.error(`[${timestamp}] Error de TipoMovimiento: ${error.message}`, {
      code: error.code,
      statusCode: error.statusCode
    });
    reply.code(error.statusCode).send({
      ok: false,
      error: {
        code: error.code,
        message: error.message
      }
    });
    return;
  }

  if (error instanceof TipoMovimientoInvalidIdError) {
    console.error(`[${timestamp}] Error de TipoMovimiento: ${error.message}`, {
      code: error.code,
      statusCode: error.statusCode
    });
    reply.code(error.statusCode).send({
      ok: false,
      error: {
        code: error.code,
        message: error.message
      }
    });
    return;
  }

  if (error instanceof TipoMovimientoInvalidAbreviaturaError) {
    console.error(`[${timestamp}] Error de TipoMovimiento: ${error.message}`, {
      code: error.code,
      statusCode: error.statusCode
    });
    reply.code(error.statusCode).send({
      ok: false,
      error: {
        code: error.code,
        message: error.message
      }
    });
    return;
  }

  if (error instanceof TipoMovimientoInvalidNombreError) {
    console.error(`[${timestamp}] Error de TipoMovimiento: ${error.message}`, {
      code: error.code,
      statusCode: error.statusCode
    });
    reply.code(error.statusCode).send({
      ok: false,
      error: {
        code: error.code,
        message: error.message
      }
    });
    return;
  }

  if (error instanceof TipoMovimientoInUseError) {
    console.error(`[${timestamp}] Error de TipoMovimiento: ${error.message}`, {
      code: error.code,
      statusCode: error.statusCode
    });
    reply.code(error.statusCode).send({
      ok: false,
      error: {
        code: error.code,
        message: error.message
      }
    });
    return;
  }

  if (error instanceof TipoMovimientoPermissionError) {
    console.error(`[${timestamp}] Error de TipoMovimiento: ${error.message}`, {
      code: error.code,
      statusCode: error.statusCode
    });
    reply.code(error.statusCode).send({
      ok: false,
      error: {
        code: error.code,
        message: error.message
      }
    });
    return;
  }

  if (error instanceof TipoMovimientoError) {
    console.error(`[${timestamp}] Error de TipoMovimiento: ${error.message}`, {
      code: error.code,
      statusCode: error.statusCode
    });
    reply.code(error.statusCode).send({
      ok: false,
      error: {
        code: error.code,
        message: error.message
      }
    });
    return;
  }

  // Error genérico no manejado
  console.error(`[${timestamp}] Error no manejado en TipoMovimiento:`, {
    error: error.message || 'Error desconocido',
    stack: error.stack
  });
  reply.code(500).send({
    ok: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Error interno del servidor'
    }
  });
}