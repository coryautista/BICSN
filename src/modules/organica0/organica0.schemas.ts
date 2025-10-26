import { z } from 'zod';

// Schema for ORGANICA_0 table (Firebird)
export const Organica0Schema = z.object({
  claveOrganica: z.string().min(1).max(2),
  nombreOrganica: z.string().min(1).max(72),
  usuario: z.string().max(13).optional(),
  fechaRegistro: z.date(),
  fechaFin: z.date().optional(),
  estatus: z.string().min(1).max(1)
});

export const CreateOrganica0Schema = z.object({
  claveOrganica: z.string().min(1).max(2),
  nombreOrganica: z.string().min(1).max(72),
  usuario: z.string().max(13).optional(),
  fechaFin: z.date().optional(),
  estatus: z.string().min(1).max(1).default('A')
});

export const UpdateOrganica0Schema = z.object({
  nombreOrganica: z.string().min(1).max(72).optional(),
  usuario: z.string().max(13).optional(),
  fechaFin: z.date().optional(),
  estatus: z.string().min(1).max(1).optional()
});

export type Organica0 = z.infer<typeof Organica0Schema>;
export type CreateOrganica0 = z.infer<typeof CreateOrganica0Schema>;
export type UpdateOrganica0 = z.infer<typeof UpdateOrganica0Schema>;