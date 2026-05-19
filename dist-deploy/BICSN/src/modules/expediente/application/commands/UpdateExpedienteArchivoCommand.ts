import { IExpedienteArchivoRepository } from '../../domain/repositories/IExpedienteRepository.js';
import { UpdateExpedienteArchivoData, ExpedienteArchivo } from '../../domain/entities/Expediente.js';
import {
  ExpedienteArchivoNotFoundError,
  InvalidExpedienteArchivoDataError,
  ExpedienteArchivoCommandError,
  FileTooLargeError,
  InvalidMimeTypeError,
  InvalidFileNameError
} from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'updateExpedienteArchivoCommand',
  level: process.env.LOG_LEVEL || 'info'
});

const MIME_TYPES_PERMITIDOS = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export class UpdateExpedienteArchivoCommand {
  constructor(private expedienteArchivoRepo: IExpedienteArchivoRepository) {}

  async execute(data: UpdateExpedienteArchivoData, userId?: string): Promise<ExpedienteArchivo> {
    // Validaciones de entrada
    this.validateInput(data);

    const logContext = {
      operation: 'updateExpedienteArchivo',
      archivoId: data.archivoId,
      titulo: data.titulo,
      fileName: data.fileName,
      mimeType: data.mimeType,
      byteSize: data.byteSize,
      tipoCodigo: data.tipoCodigo,
      userId: userId
    };

    logger.info(logContext, 'Actualizando archivo de expediente');

    try {
      const expedienteArchivo = await this.expedienteArchivoRepo.update(data, userId);

      logger.info({
        ...logContext,
        updated: true
      }, 'Archivo de expediente actualizado exitosamente');

      return expedienteArchivo;

    } catch (error: any) {
      if (error instanceof ExpedienteArchivoNotFoundError ||
          error instanceof InvalidExpedienteArchivoDataError ||
          error instanceof FileTooLargeError ||
          error instanceof InvalidMimeTypeError ||
          error instanceof InvalidFileNameError) {
        throw error;
      }

      logger.error({
        ...logContext,
        error: error.message,
        stack: error.stack
      }, 'Error al actualizar archivo de expediente');

      throw new ExpedienteArchivoCommandError('actualización', {
        originalError: error.message,
        archivoId: data.archivoId,
        userId: userId
      });
    }
  }

  private validateInput(data: UpdateExpedienteArchivoData): void {
    // Validar archivoId
    if (!data.archivoId || typeof data.archivoId !== 'number' || data.archivoId <= 0) {
      throw new InvalidExpedienteArchivoDataError('archivoId', 'Es requerido y debe ser un número positivo');
    }

    // Validar titulo si se proporciona
    if (data.titulo !== undefined) {
      if (typeof data.titulo !== 'string') {
        throw new InvalidExpedienteArchivoDataError('titulo', 'Debe ser una cadena de texto');
      }
      if (data.titulo.length < 3 || data.titulo.length > 200) {
        throw new InvalidExpedienteArchivoDataError('titulo', 'Debe tener entre 3 y 200 caracteres');
      }
    }

    // Validar fileName si se proporciona
    if (data.fileName !== undefined) {
      if (typeof data.fileName !== 'string') {
        throw new InvalidExpedienteArchivoDataError('fileName', 'Debe ser una cadena de texto');
      }
      // Validar caracteres del nombre de archivo
      const fileNameRegex = /^[a-zA-Z0-9._\-\s]+$/;
      if (!fileNameRegex.test(data.fileName)) {
        throw new InvalidFileNameError(data.fileName);
      }
      if (data.fileName.length < 1 || data.fileName.length > 255) {
        throw new InvalidExpedienteArchivoDataError('fileName', 'Debe tener entre 1 y 255 caracteres');
      }
    }

    // Validar mimeType si se proporciona
    if (data.mimeType !== undefined) {
      if (typeof data.mimeType !== 'string') {
        throw new InvalidExpedienteArchivoDataError('mimeType', 'Debe ser una cadena de texto');
      }
      if (!MIME_TYPES_PERMITIDOS.includes(data.mimeType)) {
        throw new InvalidMimeTypeError(data.mimeType, MIME_TYPES_PERMITIDOS);
      }
    }

    // Validar byteSize si se proporciona
    if (data.byteSize !== undefined) {
      if (typeof data.byteSize !== 'number' || data.byteSize <= 0) {
        throw new InvalidExpedienteArchivoDataError('byteSize', 'Debe ser un número positivo');
      }
      if (data.byteSize > MAX_FILE_SIZE) {
        throw new FileTooLargeError(MAX_FILE_SIZE, data.byteSize);
      }
    }

    // Validar sha256Hex si se proporciona
    if (data.sha256Hex !== undefined) {
      if (data.sha256Hex !== null && typeof data.sha256Hex !== 'string') {
        throw new InvalidExpedienteArchivoDataError('sha256Hex', 'Debe ser una cadena de texto o null');
      }
      // SHA256 hex should be 64 characters
      if (data.sha256Hex && (data.sha256Hex.length !== 64 || !/^[a-f0-9]{64}$/i.test(data.sha256Hex))) {
        throw new InvalidExpedienteArchivoDataError('sha256Hex', 'Debe ser un hash SHA256 válido de 64 caracteres hexadecimales');
      }
    }

    // Validar storageProvider si se proporciona
    if (data.storageProvider !== undefined) {
      if (typeof data.storageProvider !== 'string') {
        throw new InvalidExpedienteArchivoDataError('storageProvider', 'Debe ser una cadena de texto');
      }
      if (data.storageProvider.length < 1 || data.storageProvider.length > 50) {
        throw new InvalidExpedienteArchivoDataError('storageProvider', 'Debe tener entre 1 y 50 caracteres');
      }
    }

    // Validar storagePath si se proporciona
    if (data.storagePath !== undefined) {
      if (typeof data.storagePath !== 'string') {
        throw new InvalidExpedienteArchivoDataError('storagePath', 'Debe ser una cadena de texto');
      }
      if (data.storagePath.length < 1 || data.storagePath.length > 500) {
        throw new InvalidExpedienteArchivoDataError('storagePath', 'Debe tener entre 1 y 500 caracteres');
      }
    }

    // Validar tipoCodigo si se proporciona
    if (data.tipoCodigo !== undefined) {
      if (data.tipoCodigo !== null && typeof data.tipoCodigo !== 'string') {
        throw new InvalidExpedienteArchivoDataError('tipoCodigo', 'Debe ser una cadena de texto o null');
      }
      if (data.tipoCodigo && (data.tipoCodigo.length < 1 || data.tipoCodigo.length > 10)) {
        throw new InvalidExpedienteArchivoDataError('tipoCodigo', 'Debe tener entre 1 y 10 caracteres');
      }
    }

    // Validar observaciones si se proporciona
    if (data.observaciones !== undefined) {
      if (data.observaciones !== null && typeof data.observaciones !== 'string') {
        throw new InvalidExpedienteArchivoDataError('observaciones', 'Debe ser una cadena de texto o null');
      }
      if (data.observaciones && data.observaciones.length > 1000) {
        throw new InvalidExpedienteArchivoDataError('observaciones', 'No debe exceder 1000 caracteres');
      }
    }

    // Validar documentTypeId si se proporciona
    if (data.documentTypeId !== undefined) {
      if (data.documentTypeId !== null && (typeof data.documentTypeId !== 'number' || data.documentTypeId <= 0)) {
        throw new InvalidExpedienteArchivoDataError('documentTypeId', 'Debe ser un número positivo o null');
      }
    }
  }
}
