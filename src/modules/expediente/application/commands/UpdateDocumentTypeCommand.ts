import { IDocumentTypeRepository } from '../../domain/repositories/IExpedienteRepository.js';
import { UpdateDocumentTypeData, DocumentType } from '../../domain/entities/Expediente.js';
import {
  DocumentTypeNotFoundError,
  InvalidDocumentTypeDataError,
  DocumentTypeCommandError
} from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'updateDocumentTypeCommand',
  level: process.env.LOG_LEVEL || 'info'
});

export class UpdateDocumentTypeCommand {
  constructor(private documentTypeRepo: IDocumentTypeRepository) {}

  async execute(data: UpdateDocumentTypeData, userId?: string): Promise<DocumentType> {
    // Validaciones de entrada
    this.validateInput(data);

    const logContext = {
      operation: 'updateDocumentType',
      documentTypeId: data.documentTypeId,
      code: data.code,
      name: data.name,
      required: data.required,
      validityDays: data.validityDays,
      active: data.active,
      userId: userId
    };

    logger.info(logContext, 'Actualizando tipo de documento');

    try {
      const documentType = await this.documentTypeRepo.update(data, userId);

      logger.info({
        ...logContext,
        updated: true
      }, 'Tipo de documento actualizado exitosamente');

      return documentType;

    } catch (error: any) {
      if (error instanceof DocumentTypeNotFoundError ||
          error instanceof InvalidDocumentTypeDataError) {
        throw error;
      }

      logger.error({
        ...logContext,
        error: error.message,
        stack: error.stack
      }, 'Error al actualizar tipo de documento');

      throw new DocumentTypeCommandError('actualización', {
        originalError: error.message,
        documentTypeId: data.documentTypeId,
        userId: userId
      });
    }
  }

  private validateInput(data: UpdateDocumentTypeData): void {
    // Validar documentTypeId
    if (!data.documentTypeId || typeof data.documentTypeId !== 'number' || data.documentTypeId <= 0) {
      throw new InvalidDocumentTypeDataError('documentTypeId', 'Es requerido y debe ser un número positivo');
    }

    // Validar code si se proporciona
    if (data.code !== undefined) {
      if (typeof data.code !== 'string') {
        throw new InvalidDocumentTypeDataError('code', 'Debe ser una cadena de texto');
      }
      if (data.code.length < 2 || data.code.length > 10) {
        throw new InvalidDocumentTypeDataError('code', 'Debe tener entre 2 y 10 caracteres');
      }
      // Solo letras mayúsculas, números y guiones
      const codeRegex = /^[A-Z0-9-]+$/;
      if (!codeRegex.test(data.code)) {
        throw new InvalidDocumentTypeDataError('code', 'Solo puede contener letras mayúsculas, números y guiones');
      }
    }

    // Validar name si se proporciona
    if (data.name !== undefined) {
      if (typeof data.name !== 'string') {
        throw new InvalidDocumentTypeDataError('name', 'Debe ser una cadena de texto');
      }
      if (data.name.length < 3 || data.name.length > 100) {
        throw new InvalidDocumentTypeDataError('name', 'Debe tener entre 3 y 100 caracteres');
      }
    }

    // Validar required si se proporciona
    if (data.required !== undefined && typeof data.required !== 'boolean') {
      throw new InvalidDocumentTypeDataError('required', 'Debe ser un valor booleano');
    }

    // Validar validityDays si se proporciona
    if (data.validityDays !== undefined) {
      if (data.validityDays !== null && (typeof data.validityDays !== 'number' || data.validityDays < 0 || data.validityDays > 3650)) {
        throw new InvalidDocumentTypeDataError('validityDays', 'Debe ser un número entre 0 y 3650 (10 años) o null');
      }
    }

    // Validar active si se proporciona
    if (data.active !== undefined && typeof data.active !== 'boolean') {
      throw new InvalidDocumentTypeDataError('active', 'Debe ser un valor booleano');
    }
  }
}
