import { FastifyReply } from 'fastify';
import {
  RoleMenuNotFoundError,
  RoleMenuAlreadyExistsError,
  RoleMenuInvalidIdError,
  RoleMenuInvalidRoleIdError,
  RoleMenuInvalidMenuIdError,
  RoleMenuRoleNotFoundError,
  RoleMenuMenuNotFoundError,
  RoleMenuInUseError,
  RoleMenuPermissionError
} from '../domain/errors.js';

export function handleRoleMenuError(error: any, reply: FastifyReply): void {
  const timestamp = new Date().toISOString();

  if (error instanceof RoleMenuNotFoundError) {
    console.error(`[${timestamp}] Error de RoleMenu: ${error.message}`, {
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

  if (error instanceof RoleMenuAlreadyExistsError) {
    console.error(`[${timestamp}] Error de RoleMenu: ${error.message}`, {
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

  if (error instanceof RoleMenuInvalidIdError) {
    console.error(`[${timestamp}] Error de RoleMenu: ${error.message}`, {
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

  if (error instanceof RoleMenuInvalidRoleIdError) {
    console.error(`[${timestamp}] Error de RoleMenu: ${error.message}`, {
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

  if (error instanceof RoleMenuInvalidMenuIdError) {
    console.error(`[${timestamp}] Error de RoleMenu: ${error.message}`, {
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

  if (error instanceof RoleMenuRoleNotFoundError) {
    console.error(`[${timestamp}] Error de RoleMenu: ${error.message}`, {
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

  if (error instanceof RoleMenuMenuNotFoundError) {
    console.error(`[${timestamp}] Error de RoleMenu: ${error.message}`, {
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

  if (error instanceof RoleMenuInUseError) {
    console.error(`[${timestamp}] Error de RoleMenu: ${error.message}`, {
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

  if (error instanceof RoleMenuPermissionError) {
    console.error(`[${timestamp}] Error de RoleMenu: ${error.message}`, {
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
  console.error(`[${timestamp}] Error no manejado en RoleMenu:`, {
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