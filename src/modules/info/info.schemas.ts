import { z } from 'zod';

export const CreateInfoSchema = z.object({
  nombre: z.string().min(1).max(255),
  icono: z.string().max(255).optional(),
  color: z.string().max(50).optional(),
  colorBotones: z.string().max(50).optional(),
  colorEncabezados: z.string().max(50).optional(),
  colorLetra: z.string().max(50).optional(),
  createdAt: z.string().datetime().optional().default(() => new Date().toISOString()),
  updatedAt: z.string().datetime().optional().default(() => new Date().toISOString()),
  createdBy: z.string().optional(),
  updatedBy: z.string().optional()
});

export const UpdateInfoSchema = z.object({
  nombre: z.string().min(1).max(255).optional(),
  icono: z.string().max(255).optional(),
  color: z.string().max(50).optional(),
  colorBotones: z.string().max(50).optional(),
  colorEncabezados: z.string().max(50).optional(),
  colorLetra: z.string().max(50).optional(),
  updatedAt: z.string().datetime().optional().default(() => new Date().toISOString()),
  updatedBy: z.string().optional()
});

export const InfoIdSchema = z.object({
  id: z.number().int()
});