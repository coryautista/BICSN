import { IExpedienteArchivoRepository } from '../../domain/repositories/IExpedienteRepository.js';
import { CreateExpedienteArchivoData, ExpedienteArchivo } from '../../domain/entities/Expediente.js';
import {
  ExpedienteArchivoNotFoundError,
  InvalidExpedienteArchivoDataError,
  InvalidCURPError,
  ExpedienteArchivoCommandError,
  DuplicateExpedienteArchivoError,
  FileTooLargeError,
  InvalidMimeTypeError,
  InvalidFileNameError
} from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'createExpedienteArchivoCommand',
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

export class CreateExpedienteArchivoCommand {
  constructor(private expedienteArchivoRepo: IExpedienteArchivoRepository) {}

  async execute(data: CreateExpedienteArchivoData, userId?: string): Promise<ExpedienteArchivo> {
    // Validaciones de entrada
    this.validateInput(data);

    const logContext = {
      operation: 'createExpedienteArchivo',
      curp: data.curp,
      titulo: data.titulo,
      fileName: data.fileName,
      mimeType: data.mimeType,
      byteSize: data.byteSize,
      tipoCodigo: data.tipoCodigo,
      userId: userId
    };

    logger.info(logContext, 'Creando archivo de expediente');

    try {
      const expedienteArchivo = await this.expedienteArchivoRepo.create(data, userId);

      logger.info({
        ...logContext,
        archivoId: expedienteArchivo.archivoId,
        created: true
      }, 'Archivo de expediente creado exitosamente');

      return expedienteArchivo;

    } catch (error: any) {
      if (error instanceof ExpedienteArchivoNotFoundError ||
          error instanceof InvalidExpedienteArchivoDataError ||
          error instanceof InvalidCURPError ||
          error instanceof DuplicateExpedienteArchivoError ||
          error instanceof FileTooLargeError ||
          error instanceof InvalidMimeTypeError ||
          error instanceof InvalidFileNameError) {
        throw error;
      }

      logger.error({
        ...logContext,
        error: error.message,
        stack: error.stack
      }, 'Error al crear archivo de expediente');

      throw new ExpedienteArchivoCommandError('creación', {
        originalError: error.message,
        curp: data.curp,
        fileName: data.fileName,
        userId: userId
      });
    }
  }

  private validateInput(data: CreateExpedienteArchivoData): void {
    // Validar CURP
    if (!data.curp || typeof data.curp !== 'string') {
      throw new InvalidExpedienteArchivoDataError('curp', 'Es requerida y debe ser una cadena de texto');
    }

    // Validar formato de CURP (18 caracteres alfanuméricos)
    const curpRegex = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/;
    if (!curpRegex.test(data.curp)) {
      throw new InvalidCURPError(data.curp);
    }

    // Validar titulo
    if (!data.titulo || typeof data.titulo !== 'string') {
      throw new InvalidExpedienteArchivoDataError('titulo', 'Es requerido y debe ser una cadena de texto');
    }

    if (data.titulo.length < 3 || data.titulo.length > 200) {
      throw new InvalidExpedienteArchivoDataError('titulo', 'Debe tener entre 3 y 200 caracteres');
    }

    // Validar fileName
    if (!data.fileName || typeof data.fileName !== 'string') {
      throw new InvalidExpedienteArchivoDataError('fileName', 'Es requerido y debe ser una cadena de texto');
    }

    // Validar caracteres del nombre de archivo
    const fileNameRegex = /^[a-zA-Z0-9._\-\s]+$/;
    if (!fileNameRegex.test(data.fileName)) {
      throw new InvalidFileNameError(data.fileName);
    }

    if (data.fileName.length < 1 || data.fileName.length > 255) {
      throw new InvalidExpedienteArchivoDataError('fileName', 'Debe tener entre 1 y 255 caracteres');
    }

    // Validar mimeType
    if (!data.mimeType || typeof data.mimeType !== 'string') {
      throw new InvalidExpedienteArchivoDataError('mimeType', 'Es requerido y debe ser una cadena de texto');
    }

    if (!MIME_TYPES_PERMITIDOS.includes(data.mimeType)) {
      throw new InvalidMimeTypeError(data.mimeType, MIME_TYPES_PERMITIDOS);
    }

    // Validar byteSize
    if (typeof data.byteSize !== 'number' || data.byteSize <= 0) {
      throw new InvalidExpedienteArchivoDataError('byteSize', 'Es requerido y debe ser un número positivo');
    }

    if (data.byteSize > MAX_FILE_SIZE) {
      throw new FileTooLargeError(MAX_FILE_SIZE, data.byteSize);
    }

    // Validar sha256Hex si se proporciona
    if (data.sha256Hex !== null && data.sha256Hex !== undefined) {
      if (typeof data.sha256Hex !== 'string') {
        throw new InvalidExpedienteArchivoDataError('sha256Hex', 'Debe ser una cadena de texto o null');
      }
      // SHA256 hex should be 64 characters
      if (data.sha256Hex.length !== 64 || !/^[a-f0-9]{64}$/i.test(data.sha256Hex)) {
        throw new InvalidExpedienteArchivoDataError('sha256Hex', 'Debe ser un hash SHA256 válido de 64 caracteres hexadecimales');
      }
    }

    // Validar storageProvider
    if (!data.storageProvider || typeof data.storageProvider !== 'string') {
      throw new InvalidExpedienteArchivoDataError('storageProvider', 'Es requerido y debe ser una cadena de texto');
    }

    if (data.storageProvider.length < 1 || data.storageProvider.length > 50) {
      throw new InvalidExpedienteArchivoDataError('storageProvider', 'Debe tener entre 1 y 50 caracteres');
    }

    // Validar storagePath
    if (!data.storagePath || typeof data.storagePath !== 'string') {
      throw new InvalidExpedienteArchivoDataError('storagePath', 'Es requerido y debe ser una cadena de texto');
    }

    if (data.storagePath.length < 1 || data.storagePath.length > 500) {
      throw new InvalidExpedienteArchivoDataError('storagePath', 'Debe tener entre 1 y 500 caracteres');
    }

    // Validar tipoCodigo si se proporciona
    if (data.tipoCodigo !== null && data.tipoCodigo !== undefined) {
      if (typeof data.tipoCodigo !== 'string') {
        throw new InvalidExpedienteArchivoDataError('tipoCodigo', 'Debe ser una cadena de texto o null');
      }
      if (data.tipoCodigo.length < 1 || data.tipoCodigo.length > 10) {
        throw new InvalidExpedienteArchivoDataError('tipoCodigo', 'Debe tener entre 1 y 10 caracteres');
      }
    }

    // Validar observaciones si se proporciona
    if (data.observaciones !== null && data.observaciones !== undefined) {
      if (typeof data.observaciones !== 'string') {
        throw new InvalidExpedienteArchivoDataError('observaciones', 'Debe ser una cadena de texto o null');
      }
      if (data.observaciones.length > 1000) {
        throw new InvalidExpedienteArchivoDataError('observaciones', 'No debe exceder 1000 caracteres');
      }
    }

    // Validar documentTypeId si se proporciona
    if (data.documentTypeId !== null && data.documentTypeId !== undefined) {
      if (typeof data.documentTypeId !== 'number' || data.documentTypeId <= 0) {
        throw new InvalidExpedienteArchivoDataError('documentTypeId', 'Debe ser un número positivo o null');
      }
    }
  }
}
