import { IDocumentTypeRepository } from '../../domain/repositories/IExpedienteRepository.js';
import { DocumentType } from '../../domain/entities/Expediente.js';
import { DocumentTypeQueryError } from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'getAllDocumentTypesQuery',
  level: process.env.LOG_LEVEL || 'info'
});

export class GetAllDocumentTypesQuery {
  constructor(private documentTypeRepo: IDocumentTypeRepository) {}

  async execute(): Promise<DocumentType[]> {
    const logContext = {
      operation: 'getAllDocumentTypes'
    };

    logger.info(logContext, 'Consultando todos los tipos de documento');

    try {
      const documentTypes = await this.documentTypeRepo.findAll();

      logger.info({
        ...logContext,
        count: documentTypes.length
      }, 'Tipos de documento consultados exitosamente');

      return documentTypes;

    } catch (error: any) {
      logger.error({
        ...logContext,
        error: error.message,
        stack: error.stack
      }, 'Error al consultar todos los tipos de documento');

      throw new DocumentTypeQueryError('consulta general', {
        originalError: error.message
      });
    }
  }
}
