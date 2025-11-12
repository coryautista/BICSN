import { IDocumentTypeRepository } from '../../domain/repositories/IExpedienteRepository.js';
import { CreateDocumentTypeData, DocumentType } from '../../domain/entities/Expediente.js';
import {
  DocumentTypeNotFoundError,
  InvalidDocumentTypeDataError,
  DocumentTypeCommandError,
  DuplicateDocumentTypeError
} from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'createDocumentTypeCommand',
  level: process.env.LOG_LEVEL || 'info'
});

export class CreateDocumentTypeCommand {
  constructor(private documentTypeRepo: IDocumentTypeRepository) {}

  async execute(data: CreateDocumentTypeData, userId?: string): Promise<DocumentType> {
    // Validaciones de entrada
    this.validateInput(data);

    const logContext = {
      operation: 'createDocumentType',
      code: data.code,
      name: data.name,
      required: data.required,
      validityDays: data.validityDays,
      active: data.active,
      userId: userId
    };

    logger.info(logContext, 'Creando tipo de documento');

    try {
      const documentType = await this.documentTypeRepo.create(data, userId);

      logger.info({
        ...logContext,
        documentTypeId: documentType.documentTypeId,
        created: true
      }, 'Tipo de documento creado exitosamente');

      return documentType;

    } catch (error: any) {
      if (error instanceof DocumentTypeNotFoundError ||
          error instanceof InvalidDocumentTypeDataError ||
          error instanceof DuplicateDocumentTypeError) {
        throw error;
      }

      logger.error({
        ...logContext,
        error: error.message,
        stack: error.stack
      }, 'Error al crear tipo de documento');

      throw new DocumentTypeCommandError('creación', {
        originalError: error.message,
        code: data.code,
        userId: userId
      });
    }
  }

  private validateInput(data: CreateDocumentTypeData): void {
    // Validar code
    if (!data.code || typeof data.code !== 'string') {
      throw new InvalidDocumentTypeDataError('code', 'Es requerido y debe ser una cadena de texto');
    }

    if (data.code.length < 2 || data.code.length > 10) {
      throw new InvalidDocumentTypeDataError('code', 'Debe tener entre 2 y 10 caracteres');
    }

    // Solo letras mayúsculas, números y guiones
    const codeRegex = /^[A-Z0-9-]+$/;
    if (!codeRegex.test(data.code)) {
      throw new InvalidDocumentTypeDataError('code', 'Solo puede contener letras mayúsculas, números y guiones');
    }

    // Validar name
    if (!data.name || typeof data.name !== 'string') {
      throw new InvalidDocumentTypeDataError('name', 'Es requerido y debe ser una cadena de texto');
    }

    if (data.name.length < 3 || data.name.length > 100) {
      throw new InvalidDocumentTypeDataError('name', 'Debe tener entre 3 y 100 caracteres');
    }

    // Validar required
    if (typeof data.required !== 'boolean') {
      throw new InvalidDocumentTypeDataError('required', 'Es requerido y debe ser un valor booleano');
    }

    // Validar validityDays si se proporciona
    if (data.validityDays !== null && data.validityDays !== undefined) {
      if (typeof data.validityDays !== 'number' || data.validityDays < 0 || data.validityDays > 3650) {
        throw new InvalidDocumentTypeDataError('validityDays', 'Debe ser un número entre 0 y 3650 (10 años) o null');
      }
    }

    // Validar active
    if (typeof data.active !== 'boolean') {
      throw new InvalidDocumentTypeDataError('active', 'Es requerido y debe ser un valor booleano');
    }
  }
}
