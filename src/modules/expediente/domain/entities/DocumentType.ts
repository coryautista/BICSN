export interface DocumentType {
  documentTypeId: number;
  code: string;
  name: string;
  required: boolean;
  validityDays: number | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
}

export type CreateDocumentTypeData = Omit<DocumentType, 'documentTypeId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>;

export type UpdateDocumentTypeData = Partial<CreateDocumentTypeData> & { documentTypeId: number };
