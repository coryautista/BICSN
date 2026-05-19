import { z } from 'zod';

export const CreateProcesoSchema = z.object({
  nombre: z.string().min(1).max(4000),
  componente: z.string().min(1).max(4000),
  idModulo: z.number().int(),
  orden: z.number().int().min(0).optional().default(0),
  tipo: z.string().max(50).optional().default('ISSSSPEA')
});

export const UpdateProcesoSchema = z.object({
  nombre: z.string().min(1).max(4000).optional(),
  componente: z.string().min(1).max(4000).optional(),
  idModulo: z.number().int().optional(),
  orden: z.number().int().min(0).optional(),
  tipo: z.string().max(50).optional()
});

export const ProcesoIdSchema = z.object({
  id: z.number().int()
});