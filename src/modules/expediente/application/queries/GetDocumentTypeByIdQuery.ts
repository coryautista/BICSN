import { IDocumentTypeRepository } from '../../domain/repositories/IExpedienteRepository.js';
import { DocumentType } from '../../domain/entities/Expediente.js';
import {
  DocumentTypeNotFoundError,
  InvalidDocumentTypeDataError,
  DocumentTypeQueryError
} from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'getDocumentTypeByIdQuery',
  level: process.env.LOG_LEVEL || 'info'
});

export class GetDocumentTypeByIdQuery {
  constructor(private documentTypeRepo: IDocumentTypeRepository) {}

  async execute(documentTypeId: number): Promise<DocumentType> {
    // Validaciones de entrada
    this.validateInput(documentTypeId);

    const logContext = {
      operation: 'getDocumentTypeById',
      documentTypeId: documentTypeId
    };

    logger.info(logContext, 'Consultando tipo de documento por ID');

    try {
      const documentType = await this.documentTypeRepo.findById(documentTypeId);

      if (!documentType) {
        logger.warn(logContext, 'Tipo de documento no encontrado');
        throw new DocumentTypeNotFoundError(documentTypeId);
      }

      logger.info({
        ...logContext,
        found: true,
        code: documentType.code,
        name: documentType.name,
        active: documentType.active
      }, 'Tipo de documento encontrado exitosamente');

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
      }, 'Error al consultar tipo de documento por ID');

      throw new DocumentTypeQueryError('consulta por ID', {
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
