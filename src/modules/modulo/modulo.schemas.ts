import { z } from 'zod';

export const CreateModuloSchema = z.object({
  nombre: z.string().min(1).max(255),
  tipo: z.enum(['top', 'center', 'bottom']),
  icono: z.string().max(255).optional(),
  orden: z.number().int().min(0).optional().default(0)
});

export const UpdateModuloSchema = z.object({
  nombre: z.string().min(1).max(255),
  tipo: z.enum(['top', 'center', 'bottom']),
  icono: z.string().max(255).optional(),
  orden: z.number().int().min(0).optional()
});

export const ModuloIdSchema = z.object({
  id: z.number().int().positive()
});