import { z } from 'zod';

export const CreateCodigoPostalSchema = z.object({
  codigoPostal: z.string().length(5, 'CodigoPostal must be exactly 5 characters'),
  esValido: z.boolean().default(false)
});

export const UpdateCodigoPostalSchema = z.object({
  esValido: z.boolean().optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update'
});

export const CodigoPostalIdParamSchema = z.object({
  codigoPostalId: z.string().regex(/^\d+$/, 'CodigoPostalID must be a number').transform(val => parseInt(val))
});