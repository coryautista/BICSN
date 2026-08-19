import type { FastifyReply, FastifyRequest } from 'fastify';
import { fail } from '../../../utils/http.js';
import { LiquidacionQnaError } from '../domain/errors.js';

export function handleLiquidacionQnaError(error: unknown, request: FastifyRequest, reply: FastifyReply) {
  if (error instanceof LiquidacionQnaError) {
    return reply.code(error.statusCode).send(fail(error.message, error.code));
  }
  request.log.error({ err: error }, 'Error no controlado en liquidacion QNA');
  return reply.code(500).send(fail('Error interno en liquidacion QNA', 'QNA_INTERNAL_ERROR'));
}
