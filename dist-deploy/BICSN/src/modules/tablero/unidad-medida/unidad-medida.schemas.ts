import { z } from 'zod';

export const CreateUnidadMedidaSchema = z.object({
  nombre: z.string().min(1, 'Nombre is required').max(100, 'Nombre must be at most 100 characters'),
  simbolo: z.string().min(1, 'Simbolo is required').max(20, 'Simbolo must be at most 20 characters'),
  descripcion: z.string().min(1, 'Descripcion is required').max(500, 'Descripcion must be at most 500 characters'),
  categoria: z.enum(['CANTIDAD', 'PORCENTAJE', 'MONETARIA', 'TIEMPO', 'PESO', 'VOLUMEN', 'AREA', 'DISTANCIA', 'VELOCIDAD', 'TEMPERATURA']),
  esActiva: z.boolean().default(true)
});

export const UpdateUnidadMedidaSchema = z.object({
  nombre: z.string().min(1, 'Nombre is required').max(100, 'Nombre must be at most 100 characters').optional(),
  simbolo: z.string().min(1, 'Simbolo is required').max(20, 'Simbolo must be at most 20 characters').optional(),
  descripcion: z.string().min(1, 'Descripcion is required').max(500, 'Descripcion must be at most 500 characters').optional(),
  categoria: z.enum(['CANTIDAD', 'PORCENTAJE', 'MONETARIA', 'TIEMPO', 'PESO', 'VOLUMEN', 'AREA', 'DISTANCIA', 'VELOCIDAD', 'TEMPERATURA']).optional(),
  esActiva: z.boolean().optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update'
});

export const UnidadMedidaIdParamSchema = z.object({
  unidadMedidaId: z.string().regex(/^\d+$/, 'UnidadMedidaID must be a number').transform(val => parseInt(val))
});

export const CategoriaParamSchema = z.object({
  categoria: z.enum(['CANTIDAD', 'PORCENTAJE', 'MONETARIA', 'TIEMPO', 'PESO', 'VOLUMEN', 'AREA', 'DISTANCIA', 'VELOCIDAD', 'TEMPERATURA'])
});