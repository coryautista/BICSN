// DocumentType entities
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


// Expediente entities
export interface Expediente {
  curp: string;
  afiliadoId: number | null;
  interno: number | null;
  estado: string;
  notas: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateExpedienteData = Omit<Expediente, 'createdAt' | 'updatedAt'>;

export type UpdateExpedienteData = Partial<Omit<CreateExpedienteData, 'curp'>> & { curp: string };


// ExpedienteArchivo entities
export interface ExpedienteArchivo {
  archivoId: number;
  curp: string;
  tipoCodigo: string | null;
  titulo: string;
  fileName: string;
  mimeType: string;
  byteSize: number;
  sha256Hex: string | null;
  storageProvider: string;
  storagePath: string;
  observaciones: string | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  documentTypeId: number | null;
}

export type CreateExpedienteArchivoData = Omit<ExpedienteArchivo, 'archivoId' | 'createdAt' | 'updatedAt' | 'createdBy'>;

export type UpdateExpedienteArchivoData = Partial<Omit<CreateExpedienteArchivoData, 'curp'>> & { archivoId: number };

