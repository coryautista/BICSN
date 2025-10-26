import { z } from 'zod';

export const CreateEjeSchema = z.object({
  nombre: z.string().min(1, 'Nombre is required').max(500, 'Nombre must be at most 500 characters')
});

export const UpdateEjeSchema = z.object({
  nombre: z.string().min(1, 'Nombre is required').max(500, 'Nombre must be at most 500 characters')
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update'
});

export const EjeIdParamSchema = z.object({
  ejeId: z.string().regex(/^\d+$/, 'EjeID must be a number').transform(val => parseInt(val))
});