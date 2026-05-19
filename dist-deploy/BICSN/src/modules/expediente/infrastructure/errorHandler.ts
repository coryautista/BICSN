import { FastifyReply } from 'fastify';
import {
  DocumentTypeError,
  DocumentTypeNotFoundError,
  DocumentTypeByCodeNotFoundError,
  DuplicateDocumentTypeError,
  InvalidDocumentTypeDataError,
  DocumentTypeQueryError,
  DocumentTypeCommandError,
  DocumentTypesNotFoundError,
  ExpedienteError,
  ExpedienteNotFoundError,
  DuplicateExpedienteError,
  InvalidExpedienteDataError,
  InvalidCURPError,
  ExpedienteQueryError,
  ExpedienteCommandError,
  ExpedientesNotFoundError,
  ExpedienteArchivoError,
  ExpedienteArchivoNotFoundError,
  DuplicateExpedienteArchivoError,
  InvalidExpedienteArchivoDataError,
  FileTooLargeError,
  InvalidMimeTypeError,
  InvalidFileNameError,
  ExpedienteArchivoQueryError,
  ExpedienteArchivoCommandError,
  ExpedienteArchivosNotFoundError
} from '../domain/errors.js';
import { badRequest, notFound, internalError } from '../../../utils/http.js';
import pino from 'pino';

const logger = pino({
  name: 'expedienteErrorHandler',
  level: process.env.LOG_LEVEL || 'info'
});

export function handleExpedienteError(error: any, reply: FastifyReply): FastifyReply {
  // Log del error con contexto
  logger.error({
    error: error.message,
    code: error.code,
    details: error.details,
    stack: error.stack
  }, 'Error en módulo expediente');

  // Mapeo de errores específicos a respuestas HTTP
  if (error instanceof DocumentTypeNotFoundError ||
      error instanceof DocumentTypeByCodeNotFoundError) {
    return reply.code(404).send(notFound('DocumentType', error.details?.documentTypeId?.toString() || error.details?.code));
  }

  if (error instanceof ExpedienteNotFoundError) {
    return reply.code(404).send(notFound('Expediente', error.details?.curp));
  }

  if (error instanceof ExpedienteArchivoNotFoundError) {
    return reply.code(404).send(notFound('ExpedienteArchivo', error.details?.archivoId?.toString()));
  }

  if (error instanceof DuplicateDocumentTypeError ||
      error instanceof DuplicateExpedienteError ||
      error instanceof DuplicateExpedienteArchivoError) {
    return reply.code(409).send(badRequest(error.message));
  }

  if (error instanceof InvalidDocumentTypeDataError ||
      error instanceof InvalidExpedienteDataError ||
      error instanceof InvalidExpedienteArchivoDataError ||
      error instanceof InvalidCURPError ||
      error instanceof FileTooLargeError ||
      error instanceof InvalidMimeTypeError ||
      error instanceof InvalidFileNameError) {
    return reply.code(400).send(badRequest(error.message));
  }

  if (error instanceof DocumentTypesNotFoundError ||
      error instanceof ExpedientesNotFoundError ||
      error instanceof ExpedienteArchivosNotFoundError) {
    return reply.code(404).send(notFound('Resource', 'No se encontraron registros'));
  }

  // Errores de consulta y comando
  if (error instanceof DocumentTypeQueryError ||
      error instanceof ExpedienteQueryError ||
      error instanceof ExpedienteArchivoQueryError ||
      error instanceof DocumentTypeCommandError ||
      error instanceof ExpedienteCommandError ||
      error instanceof ExpedienteArchivoCommandError) {
    return reply.code(500).send(internalError(error.message));
  }

  // Errores genéricos del dominio
  if (error instanceof DocumentTypeError ||
      error instanceof ExpedienteError ||
      error instanceof ExpedienteArchivoError) {
    return reply.code(500).send(internalError(error.message));
  }

  // Error desconocido
  logger.error({
    error: error.message,
    stack: error.stack
  }, 'Error desconocido en módulo expediente');

  return reply.code(500).send(internalError('Error interno del servidor'));
}