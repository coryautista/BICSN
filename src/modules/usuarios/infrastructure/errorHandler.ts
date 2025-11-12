import { FastifyReply } from 'fastify';
import {
  UsuarioNotFoundError,
  UsuarioAlreadyExistsError,
  UsuarioInvalidEmailError,
  UsuarioInvalidUsernameError,
  UsuarioInvalidPasswordError,
  UsuarioInvalidNameError,
  UsuarioInvalidIdError,
  UsuarioInvalidStatusError,
  UsuarioInUseError,
  UsuarioPermissionError,
  UsuarioInvalidRoleError,
  UsuarioError
} from '../domain/errors.js';

export function handleUsuarioError(error: any, reply: FastifyReply): void {
  const timestamp = new Date().toISOString();

  if (error instanceof UsuarioNotFoundError) {
    console.error(`[${timestamp}] Error de Usuario: ${error.message}`, {
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

  if (error instanceof UsuarioAlreadyExistsError) {
    console.error(`[${timestamp}] Error de Usuario: ${error.message}`, {
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

  if (error instanceof UsuarioInvalidEmailError) {
    console.error(`[${timestamp}] Error de Usuario: ${error.message}`, {
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

  if (error instanceof UsuarioInvalidUsernameError) {
    console.error(`[${timestamp}] Error de Usuario: ${error.message}`, {
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

  if (error instanceof UsuarioInvalidPasswordError) {
    console.error(`[${timestamp}] Error de Usuario: ${error.message}`, {
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

  if (error instanceof UsuarioInvalidNameError) {
    console.error(`[${timestamp}] Error de Usuario: ${error.message}`, {
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

  if (error instanceof UsuarioInvalidIdError) {
    console.error(`[${timestamp}] Error de Usuario: ${error.message}`, {
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

  if (error instanceof UsuarioInvalidStatusError) {
    console.error(`[${timestamp}] Error de Usuario: ${error.message}`, {
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

  if (error instanceof UsuarioInUseError) {
    console.error(`[${timestamp}] Error de Usuario: ${error.message}`, {
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

  if (error instanceof UsuarioPermissionError) {
    console.error(`[${timestamp}] Error de Usuario: ${error.message}`, {
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

  if (error instanceof UsuarioInvalidRoleError) {
    console.error(`[${timestamp}] Error de Usuario: ${error.message}`, {
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

  if (error instanceof UsuarioError) {
    console.error(`[${timestamp}] Error de Usuario: ${error.message}`, {
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
  console.error(`[${timestamp}] Error no manejado en Usuario:`, {
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