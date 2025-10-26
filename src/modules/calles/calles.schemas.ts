import { z } from 'zod';

export const CreateCalleSchema = z.object({
  coloniaId: z.number().int().positive('ColoniaID must be a positive integer'),
  nombreCalle: z.string().min(1, 'NombreCalle is required').max(150, 'NombreCalle must be at most 150 characters'),
  esValido: z.boolean().default(false)
});

export const UpdateCalleSchema = z.object({
  nombreCalle: z.string().min(1, 'NombreCalle is required').max(150, 'NombreCalle must be at most 150 characters').optional(),
  esValido: z.boolean().optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update'
});

export const CalleIdParamSchema = z.object({
  calleId: z.string().regex(/^\d+$/, 'CalleID must be a number').transform(val => parseInt(val))
});

export const ColoniaIdParamSchema = z.object({
  coloniaId: z.string().regex(/^\d+$/, 'ColoniaID must be a number').transform(val => parseInt(val))
});

export const CalleQuerySchema = z.object({
  estadoId: z.string().length(2, 'EstadoID must be exactly 2 characters').optional(),
  municipioId: z.string().regex(/^\d+$/, 'MunicipioID must be a number').transform(val => parseInt(val)).optional(),
  coloniaId: z.string().regex(/^\d+$/, 'ColoniaID must be a number').transform(val => parseInt(val)).optional(),
  codigoPostal: z.string().length(5, 'CodigoPostal must be exactly 5 characters').optional(),
  nombreCalle: z.string().min(1, 'NombreCalle must be at least 1 character').optional(),
  esValido: z.string().regex(/^(true|false)$/, 'EsValido must be true or false').transform(val => val === 'true').optional(),
  limit: z.string().regex(/^\d+$/, 'Limit must be a number').transform(val => parseInt(val)).optional(),
  offset: z.string().regex(/^\d+$/, 'Offset must be a number').transform(val => parseInt(val)).optional()
});