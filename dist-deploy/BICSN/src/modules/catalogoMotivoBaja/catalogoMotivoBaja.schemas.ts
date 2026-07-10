import { z } from 'zod';

const BooleanQuerySchema = z.preprocess((value) => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
}, z.boolean());

export const ListCatalogoMotivoBajaSchema = z.object({
  activo: BooleanQuerySchema.optional(),
  aplicaBajaPermanente: BooleanQuerySchema.optional(),
  aplicaSuspension: BooleanQuerySchema.optional(),
  requiereObservaciones: BooleanQuerySchema.optional(),
  search: z.string().trim().min(1).max(100).optional()
});

export const CatalogoMotivoBajaIdParamSchema = z.object({
  id: z.coerce.number().int().positive()
});

export const CreateCatalogoMotivoBajaSchema = z.object({
  clave: z.string().trim().min(1).max(30).regex(/^[A-Z0-9_]+$/i),
  nombre: z.string().trim().min(1).max(100),
  descripcion: z.string().trim().max(500).nullable().optional(),
  aplicaBajaPermanente: z.boolean().optional(),
  aplicaSuspension: z.boolean().optional(),
  requiereObservaciones: z.boolean().optional(),
  activo: z.boolean().optional(),
  orden: z.number().int().min(0).optional()
});

export const UpdateCatalogoMotivoBajaSchema = z.object({
  clave: z.string().trim().min(1).max(30).regex(/^[A-Z0-9_]+$/i).optional(),
  nombre: z.string().trim().min(1).max(100).optional(),
  descripcion: z.string().trim().max(500).nullable().optional(),
  aplicaBajaPermanente: z.boolean().optional(),
  aplicaSuspension: z.boolean().optional(),
  requiereObservaciones: z.boolean().optional(),
  activo: z.boolean().optional(),
  orden: z.number().int().min(0).optional()
});
