import { z } from 'zod';

export const CreateDimensionSchema = z.object({
  nombre: z.string().min(1, 'Nombre is required').max(200, 'Nombre must be at most 200 characters'),
  descripcion: z.string().min(1, 'Descripcion is required').max(1000, 'Descripcion must be at most 1000 characters'),
  tipoDimension: z.enum(['GEOGRAFICA', 'TEMPORAL', 'DEMOGRAFICA', 'ECONOMICA', 'SOCIAL', 'AMBIENTAL', 'INSTITUCIONAL']),
  esActiva: z.boolean().default(true)
});

export const UpdateDimensionSchema = z.object({
  nombre: z.string().min(1, 'Nombre is required').max(200, 'Nombre must be at most 200 characters').optional(),
  descripcion: z.string().min(1, 'Descripcion is required').max(1000, 'Descripcion must be at most 1000 characters').optional(),
  tipoDimension: z.enum(['GEOGRAFICA', 'TEMPORAL', 'DEMOGRAFICA', 'ECONOMICA', 'SOCIAL', 'AMBIENTAL', 'INSTITUCIONAL']).optional(),
  esActiva: z.boolean().optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update'
});

export const DimensionIdParamSchema = z.object({
  dimensionId: z.string().regex(/^\d+$/, 'DimensionID must be a number').transform(val => parseInt(val))
});

export const TipoDimensionParamSchema = z.object({
  tipoDimension: z.enum(['GEOGRAFICA', 'TEMPORAL', 'DEMOGRAFICA', 'ECONOMICA', 'SOCIAL', 'AMBIENTAL', 'INSTITUCIONAL'])
});