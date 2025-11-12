import { DocumentType, CreateDocumentTypeData, UpdateDocumentTypeData } from '../entities/Expediente.js';
import { Expediente, CreateExpedienteData, UpdateExpedienteData } from '../entities/Expediente.js';
import { ExpedienteArchivo, CreateExpedienteArchivoData, UpdateExpedienteArchivoData } from '../entities/Expediente.js';

export interface IDocumentTypeRepository {
  findAll(): Promise<DocumentType[]>;
  findById(documentTypeId: number): Promise<DocumentType | undefined>;
  findByCode(code: string): Promise<DocumentType | undefined>;
  create(data: CreateDocumentTypeData, userId?: string): Promise<DocumentType>;
  update(data: UpdateDocumentTypeData, userId?: string): Promise<DocumentType>;
  delete(documentTypeId: number): Promise<void>;
}

export interface IExpedienteRepository {
  findAll(): Promise<Expediente[]>;
  findByCurp(curp: string): Promise<Expediente | undefined>;
  create(data: CreateExpedienteData, userId?: string): Promise<Expediente>;
  update(data: UpdateExpedienteData, userId?: string): Promise<Expediente>;
  delete(curp: string): Promise<void>;
}

export interface IExpedienteArchivoRepository {
  findById(archivoId: number): Promise<ExpedienteArchivo | undefined>;
  findByCurp(curp: string): Promise<ExpedienteArchivo[]>;
  findByCurpAndSha256(curp: string, sha256Hex: string): Promise<ExpedienteArchivo | undefined>;
  create(data: CreateExpedienteArchivoData, userId?: string): Promise<ExpedienteArchivo>;
  update(data: UpdateExpedienteArchivoData, userId?: string): Promise<ExpedienteArchivo>;
  delete(archivoId: number): Promise<void>;
}
