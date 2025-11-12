import { IDocumentTypeRepository } from '../../domain/repositories/IExpedienteRepository.js';
import { DocumentType } from '../../domain/entities/Expediente.js';

export class GetDocumentTypeByCodeQuery {
  constructor(private documentTypeRepo: IDocumentTypeRepository) {}

  async execute(code: string): Promise<DocumentType> {
    const documentType = await this.documentTypeRepo.findByCode(code);
    if (!documentType) {
      throw new Error('DOCUMENT_TYPE_NOT_FOUND');
    }
    return documentType;
  }
}
