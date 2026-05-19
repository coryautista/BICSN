import { z } from 'zod';

export const TipoMovimientoSchema = z.object({
  id: z.number().int(),
  abreviatura: z.string().max(1).nullable(),
  nombre: z.string().min(1).max(64)
});

export const CreateTipoMovimientoSchema = z.object({
  id: z.number().int(),
  abreviatura: z.string().max(1).nullable().optional(),
  nombre: z.string().min(1).max(64)
});

export const UpdateTipoMovimientoSchema = z.object({
  abreviatura: z.string().max(1).nullable().optional(),
  nombre: z.string().min(1).max(64).optional()
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' }
);