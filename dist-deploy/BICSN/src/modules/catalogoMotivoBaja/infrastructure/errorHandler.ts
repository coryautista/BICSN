import { FastifyReply } from 'fastify';
import { CatalogoMotivoBajaConflictError, CatalogoMotivoBajaNotFoundError } from '../domain/errors.js';

export function handleCatalogoMotivoBajaError(error: any, reply: FastifyReply) {
  if (error instanceof CatalogoMotivoBajaNotFoundError) {
    return reply.code(404).send({ ok: false, error: { code: 'NOT_FOUND', message: error.message } });
  }

  if (error instanceof CatalogoMotivoBajaConflictError || error?.number === 2627 || error?.number === 2601) {
    return reply.code(409).send({ ok: false, error: { code: 'CONFLICT', message: 'Ya existe un motivo de baja con la misma clave' } });
  }

  return reply.code(500).send({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Error al procesar catalogo de motivos de baja' } });
}
