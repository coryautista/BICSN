import { z } from 'zod';

export const CreateEstadoSchema = z.object({
  estadoId: z.string().length(2, 'EstadoID must be exactly 2 characters'),
  nombreEstado: z.string().min(1, 'NombreEstado is required').max(50, 'NombreEstado must be at most 50 characters'),
  esValido: z.boolean().default(false)
});

export const UpdateEstadoSchema = z.object({
  nombreEstado: z.string().min(1, 'NombreEstado is required').max(50, 'NombreEstado must be at most 50 characters').optional(),
  esValido: z.boolean().optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update'
});

export const EstadoIdParamSchema = z.object({
  estadoId: z.string().length(2, 'EstadoID must be exactly 2 characters')
});