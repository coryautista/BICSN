import { FastifyReply } from 'fastify';
import { fail } from '../../../utils/http.js';
import { CatalogoPorcentajeFondoConflictError, CatalogoPorcentajeFondoNotFoundError } from '../domain/errors.js';

export function handleCatalogoPorcentajeFondoError(error: any, reply: FastifyReply) {
  if (error instanceof CatalogoPorcentajeFondoNotFoundError) {
    return reply.code(404).send(fail(error.message));
  }
  if (error instanceof CatalogoPorcentajeFondoConflictError || error?.number === 2627 || error?.number === 2601) {
    return reply.code(409).send(fail(error.message || 'Ya existe un porcentaje para ese fondo y año de vigencia'));
  }
  return reply.code(500).send(fail(error?.message || 'Error interno del servidor'));
}
