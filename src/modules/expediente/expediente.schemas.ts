import { z } from 'zod';

// CURP validation regex based on the check constraint
const curpRegex = /^[A-Z]{4}[0-9]{6}[HM][A-Z]{5}[0-9A-Z][0-9]$/;

// DocumentType schemas
export const CreateDocumentTypeSchema = z.object({
  code: z.string().min(1, 'Code is required').max(30, 'Code must be at most 30 characters'),
  name: z.string().min(1, 'Name is required').max(120, 'Name must be at most 120 characters'),
  required: z.boolean().default(false),
  validityDays: z.number().int().nullable().optional(),
  active: z.boolean().default(true)
});

export const UpdateDocumentTypeSchema = z.object({
  code: z.string().min(1, 'Code is required').max(30, 'Code must be at most 30 characters').optional(),
  name: z.string().min(1, 'Name is required').max(120, 'Name must be at most 120 characters').optional(),
  required: z.boolean().optional(),
  validityDays: z.number().int().nullable().optional(),
  active: z.boolean().optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update'
});

export const DocumentTypeIdParamSchema = z.object({
  documentTypeId: z.string().transform(val => parseInt(val)).refine(val => !isNaN(val), 'DocumentTypeId must be a valid number')
});

// Expediente schemas
export const CreateExpedienteSchema = z.object({
  curp: z.string().regex(curpRegex, 'Invalid CURP format'),
  afiliadoId: z.number().int().nullable().optional(),
  interno: z.number().int().nullable().optional(),
  estado: z.string().max(20, 'Estado must be at most 20 characters').default('ABIERTO'),
  notas: z.string().max(300, 'Notas must be at most 300 characters').nullable().optional()
});

export const UpdateExpedienteSchema = z.object({
  afiliadoId: z.number().int().nullable().optional(),
  interno: z.number().int().nullable().optional(),
  estado: z.string().max(20, 'Estado must be at most 20 characters').optional(),
  notas: z.string().max(300, 'Notas must be at most 300 characters').nullable().optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update'
});

export const ExpedienteCurpParamSchema = z.object({
  curp: z.string().regex(curpRegex, 'Invalid CURP format')
});

// ExpedienteArchivo schemas
export const CreateExpedienteArchivoSchema = z.object({
  curp: z.string().regex(curpRegex, 'Invalid CURP format'),
  tipoCodigo: z.string().max(30, 'TipoCodigo must be at most 30 characters').nullable().optional(),
  titulo: z.string().min(1, 'Titulo is required').max(200, 'Titulo must be at most 200 characters'),
  fileName: z.string().min(1, 'FileName is required').max(260, 'FileName must be at most 260 characters'),
  mimeType: z.string().min(1, 'MimeType is required').max(120, 'MimeType must be at most 120 characters'),
  byteSize: z.number().int().min(0, 'ByteSize must be non-negative'),
  sha256Hex: z.string().length(64, 'Sha256Hex must be exactly 64 characters'),
  storageProvider: z.string().min(1, 'StorageProvider is required').max(20, 'StorageProvider must be at most 20 characters'),
  storagePath: z.string().min(1, 'StoragePath is required').max(500, 'StoragePath must be at most 500 characters'),
  observaciones: z.string().max(300, 'Observaciones must be at most 300 characters').nullable().optional(),
  documentTypeId: z.number().int().nullable().optional()
});

export const UpdateExpedienteArchivoSchema = z.object({
  tipoCodigo: z.string().max(30, 'TipoCodigo must be at most 30 characters').nullable().optional(),
  titulo: z.string().min(1, 'Titulo is required').max(200, 'Titulo must be at most 200 characters').optional(),
  fileName: z.string().min(1, 'FileName is required').max(260, 'FileName must be at most 260 characters').optional(),
  mimeType: z.string().min(1, 'MimeType is required').max(120, 'MimeType must be at most 120 characters').optional(),
  byteSize: z.number().int().min(0, 'ByteSize must be non-negative').optional(),
  sha256Hex: z.string().length(64, 'Sha256Hex must be exactly 64 characters').optional(),
  storageProvider: z.string().min(1, 'StorageProvider is required').max(20, 'StorageProvider must be at most 20 characters').optional(),
  storagePath: z.string().min(1, 'StoragePath is required').max(500, 'StoragePath must be at most 500 characters').optional(),
  observaciones: z.string().max(300, 'Observaciones must be at most 300 characters').nullable().optional(),
  documentTypeId: z.number().int().nullable().optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update'
});

export const ExpedienteArchivoIdParamSchema = z.object({
  archivoId: z.string().transform(val => parseInt(val)).refine(val => !isNaN(val), 'ArchivoId must be a valid number')
});