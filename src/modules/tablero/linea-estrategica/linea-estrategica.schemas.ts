import { z } from 'zod';

export const CreateLineaEstrategicaSchema = z.object({
  idEje: z.number().int().positive('idEje must be a positive integer'),
  nombre: z.string().min(1, 'Nombre is required').max(500, 'Nombre must be at most 500 characters'),
  descripcion: z.string().min(1, 'Descripcion is required').max(5000, 'Descripcion must be at most 5000 characters')
});

export const UpdateLineaEstrategicaSchema = z.object({
  nombre: z.string().min(1, 'Nombre is required').max(500, 'Nombre must be at most 500 characters').optional(),
  descripcion: z.string().min(1, 'Descripcion is required').max(5000, 'Descripcion must be at most 5000 characters').optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update'
});

export const LineaEstrategicaIdParamSchema = z.object({
  lineaEstrategicaId: z.string().regex(/^\d+$/, 'LineaEstrategicaID must be a number').transform(val => parseInt(val))
});

export const EjeIdParamSchema = z.object({
  ejeId: z.string().regex(/^\d+$/, 'EjeID must be a number').transform(val => parseInt(val))
});