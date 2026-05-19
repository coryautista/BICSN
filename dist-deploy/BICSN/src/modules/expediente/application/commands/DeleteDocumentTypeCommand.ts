import { IDocumentTypeRepository } from '../../domain/repositories/IExpedienteRepository.js';
import {
  DocumentTypeNotFoundError,
  InvalidDocumentTypeDataError,
  DocumentTypeCommandError
} from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'deleteDocumentTypeCommand',
  level: process.env.LOG_LEVEL || 'info'
});

export class DeleteDocumentTypeCommand {
  constructor(private documentTypeRepo: IDocumentTypeRepository) {}

  async execute(documentTypeId: number): Promise<void> {
    // Validaciones de entrada
    this.validateInput(documentTypeId);

    const logContext = {
      operation: 'deleteDocumentType',
      documentTypeId: documentTypeId
    };

    logger.info(logContext, 'Eliminando tipo de documento');

    try {
      await this.documentTypeRepo.delete(documentTypeId);

      logger.info({
        ...logContext,
        deleted: true
      }, 'Tipo de documento eliminado exitosamente');

    } catch (error: any) {
      if (error instanceof DocumentTypeNotFoundError ||
          error instanceof InvalidDocumentTypeDataError) {
        throw error;
      }

      logger.error({
        ...logContext,
        error: error.message,
        stack: error.stack
      }, 'Error al eliminar tipo de documento');

      throw new DocumentTypeCommandError('eliminación', {
        originalError: error.message,
        documentTypeId: documentTypeId
      });
    }
  }

  private validateInput(documentTypeId: number): void {
    // Validar documentTypeId
    if (!documentTypeId || typeof documentTypeId !== 'number' || documentTypeId <= 0) {
      throw new InvalidDocumentTypeDataError('documentTypeId', 'Es requerido y debe ser un número positivo');
    }
  }
}
