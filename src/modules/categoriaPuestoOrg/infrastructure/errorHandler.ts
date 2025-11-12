import { FastifyReply } from 'fastify';
import { DomainError } from '../../../utils/errors.js';
import pino from 'pino';
import { fail } from '../../../utils/http.js';
import {
  CategoriaPuestoOrgNotFoundError,
  InvalidCategoriaPuestoOrgDataError,
  InvalidOrgHierarchyError,
  InvalidNivelError,
  InvalidIngresoBrutoError,
  InvalidVigenciaDatesError,
  DuplicateCategoriaPuestoOrgError,
  CategoriaPuestoOrgInUseError,
  CategoriaPuestoOrgRegistrationError,
  CategoriaPuestoOrgUpdateError,
  CategoriaPuestoOrgDeletionError,
  CategoriaPuestoOrgQueryError
} from '../domain/errors.js';

const logger = pino({
  name: 'categoriaPuestoOrg-errorHandler',
  level: process.env.LOG_LEVEL || 'info'
});

/**
 * Handler centralizado para errores del módulo CategoriaPuestoOrg
 * Mapea errores de dominio a respuestas HTTP apropiadas con logging estructurado
 */
export function handleCategoriaPuestoOrgError(error: any, reply: FastifyReply): FastifyReply {
  const logContext = {
    module: 'categoriaPuestoOrg',
    errorType: error.constructor.name,
    errorCode: error.code || 'UNKNOWN_ERROR',
    timestamp: new Date().toISOString()
  };

  // Logging estructurado según tipo de error
  if (error instanceof CategoriaPuestoOrgNotFoundError) {
    logger.warn({ ...logContext, categoriaPuestoOrgId: (error as any).details?.categoriaPuestoOrgId }, 'Categoría de puesto orgánico no encontrada');
    return reply.code(404).send(fail('CATEGORIA_PUESTO_ORG_NOT_FOUND', error.message));
  }

  if (error instanceof InvalidCategoriaPuestoOrgDataError) {
    logger.warn({
      ...logContext,
      field: (error as any).details?.field,
      reason: (error as any).details?.reason
    }, 'Datos de categoría de puesto orgánico inválidos');
    return reply.code(400).send(fail('INVALID_CATEGORIA_PUESTO_ORG_DATA', error.message));
  }

  if (error instanceof InvalidOrgHierarchyError) {
    logger.warn({ ...logContext }, 'Jerarquía orgánica inválida');
    return reply.code(400).send(fail('INVALID_ORG_HIERARCHY', error.message));
  }

  if (error instanceof InvalidNivelError) {
    logger.warn({ ...logContext, nivel: (error as any).details?.nivel }, 'Nivel inválido');
    return reply.code(400).send(fail('INVALID_NIVEL', error.message));
  }

  if (error instanceof InvalidIngresoBrutoError) {
    logger.warn({ ...logContext, ingreso: (error as any).details?.ingreso }, 'Ingreso bruto inválido');
    return reply.code(400).send(fail('INVALID_INGRESO_BRUTO', error.message));
  }

  if (error instanceof InvalidVigenciaDatesError) {
    logger.warn({
      ...logContext,
      vigenciaInicio: (error as any).details?.vigenciaInicio,
      vigenciaFin: (error as any).details?.vigenciaFin
    }, 'Fechas de vigencia inválidas');
    return reply.code(400).send(fail('INVALID_VIGENCIA_DATES', error.message));
  }

  if (error instanceof DuplicateCategoriaPuestoOrgError) {
    logger.warn({
      ...logContext,
      categoria: (error as any).details?.categoria,
      org0: (error as any).details?.org0,
      org1: (error as any).details?.org1
    }, 'Categoría de puesto orgánico duplicada');
    return reply.code(409).send(fail('DUPLICATE_CATEGORIA_PUESTO_ORG', error.message));
  }

  if (error instanceof CategoriaPuestoOrgInUseError) {
    logger.warn({ ...logContext, categoriaPuestoOrgId: (error as any).details?.categoriaPuestoOrgId }, 'Categoría de puesto orgánico en uso');
    return reply.code(409).send(fail('CATEGORIA_PUESTO_ORG_IN_USE', error.message));
  }

  if (error instanceof CategoriaPuestoOrgRegistrationError) {
    logger.error({
      ...logContext,
      stack: error.stack
    }, 'Error al registrar categoría de puesto orgánico');
    return reply.code(500).send(fail('CATEGORIA_PUESTO_ORG_REGISTRATION_ERROR', error.message));
  }

  if (error instanceof CategoriaPuestoOrgUpdateError) {
    logger.error({
      ...logContext,
      categoriaPuestoOrgId: (error as any).details?.categoriaPuestoOrgId,
      stack: error.stack
    }, 'Error al actualizar categoría de puesto orgánico');
    return reply.code(500).send(fail('CATEGORIA_PUESTO_ORG_UPDATE_ERROR', error.message));
  }

  if (error instanceof CategoriaPuestoOrgDeletionError) {
    logger.error({
      ...logContext,
      categoriaPuestoOrgId: (error as any).details?.categoriaPuestoOrgId,
      stack: error.stack
    }, 'Error al eliminar categoría de puesto orgánico');
    return reply.code(500).send(fail('CATEGORIA_PUESTO_ORG_DELETION_ERROR', error.message));
  }

  if (error instanceof CategoriaPuestoOrgQueryError) {
    logger.error({
      ...logContext,
      operation: (error as any).details?.operation,
      stack: error.stack
    }, 'Error en consulta de categorías de puesto orgánico');
    return reply.code(500).send(fail('CATEGORIA_PUESTO_ORG_QUERY_ERROR', error.message));
  }

  // Errores de dominio genéricos
  if (error instanceof DomainError) {
    logger.error({
      ...logContext,
      stack: error.stack
    }, 'Error de dominio no manejado específicamente');
    return reply.code(500).send(fail(error.code, error.message));
  }

  // Errores genéricos no tipados
  logger.error({
    ...logContext,
    errorMessage: error.message,
    stack: error.stack
  }, 'Error inesperado en módulo categoriaPuestoOrg');

  return reply.code(500).send(fail('CATEGORIA_PUESTO_ORG_INTERNAL_ERROR', 'Error interno del servidor'));
}