import { FastifyReply } from 'fastify';
import {
  UserRoleNotFoundError,
  UserRoleAlreadyExistsError,
  UserRoleInvalidUsuarioIdError,
  UserRoleInvalidRoleIdError,
  UserRoleUsuarioNotFoundError,
  UserRoleRoleNotFoundError,
  UserRoleInUseError,
  UserRolePermissionError
} from '../domain/errors.js';

export function handleUserRoleError(error: any, reply: FastifyReply): void {
  const timestamp = new Date().toISOString();

  if (error instanceof UserRoleNotFoundError) {
    console.error(`[${timestamp}] Error de UserRole: ${error.message}`, {
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

  if (error instanceof UserRoleAlreadyExistsError) {
    console.error(`[${timestamp}] Error de UserRole: ${error.message}`, {
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

  if (error instanceof UserRoleInvalidUsuarioIdError) {
    console.error(`[${timestamp}] Error de UserRole: ${error.message}`, {
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

  if (error instanceof UserRoleInvalidRoleIdError) {
    console.error(`[${timestamp}] Error de UserRole: ${error.message}`, {
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

  if (error instanceof UserRoleUsuarioNotFoundError) {
    console.error(`[${timestamp}] Error de UserRole: ${error.message}`, {
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

  if (error instanceof UserRoleRoleNotFoundError) {
    console.error(`[${timestamp}] Error de UserRole: ${error.message}`, {
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

  if (error instanceof UserRoleInUseError) {
    console.error(`[${timestamp}] Error de UserRole: ${error.message}`, {
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

  if (error instanceof UserRolePermissionError) {
    console.error(`[${timestamp}] Error de UserRole: ${error.message}`, {
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
  console.error(`[${timestamp}] Error no manejado en UserRole:`, {
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