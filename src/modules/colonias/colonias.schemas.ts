import { z } from 'zod';

export const CreateColoniaSchema = z.object({
  municipioId: z.number().int().positive('MunicipioID must be a positive integer'),
  codigoPostalId: z.number().int().positive('CodigoPostalID must be a positive integer'),
  nombreColonia: z.string().min(1, 'NombreColonia is required').max(100, 'NombreColonia must be at most 100 characters'),
  tipoAsentamiento: z.string().max(50, 'TipoAsentamiento must be at most 50 characters').optional(),
  esValido: z.boolean().default(false)
});

export const UpdateColoniaSchema = z.object({
  nombreColonia: z.string().min(1, 'NombreColonia is required').max(100, 'NombreColonia must be at most 100 characters').optional(),
  tipoAsentamiento: z.string().max(50, 'TipoAsentamiento must be at most 50 characters').optional(),
  esValido: z.boolean().optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update'
});

export const ColoniaIdParamSchema = z.object({
  coloniaId: z.string().regex(/^\d+$/, 'ColoniaID must be a number').transform(val => parseInt(val))
});

export const MunicipioIdParamSchema = z.object({
  municipioId: z.string().regex(/^\d+$/, 'MunicipioID must be a number').transform(val => parseInt(val))
});

export const CodigoPostalIdParamSchema = z.object({
  codigoPostalId: z.string().regex(/^\d+$/, 'CodigoPostalID must be a number').transform(val => parseInt(val))
});

export const ColoniaQuerySchema = z.object({
  nombreColonia: z.string().min(1, 'NombreColonia must be at least 1 character')
});