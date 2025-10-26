import { z } from 'zod';

export const CreateMenuSchema = z.object({
  nombre: z.string().min(1).max(255),
  componente: z.string().max(255).optional(),
  parentId: z.number().int().optional(),
  icono: z.string().max(255).optional(),
  orden: z.number().int().min(0)
});

export const UpdateMenuSchema = z.object({
  nombre: z.string().min(1).max(255),
  componente: z.string().max(255).optional(),
  parentId: z.number().int().optional(),
  icono: z.string().max(255).optional(),
  orden: z.number().int().min(0).optional()
});

export const MenuIdSchema = z.object({
  id: z.number().int()
});