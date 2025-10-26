import { z } from 'zod';

// Schema for ORGANICA_2 table (Firebird)
export const Organica2Schema = z.object({
  claveOrganica0: z.string().min(1).max(2),
  claveOrganica1: z.string().min(1).max(2),
  claveOrganica2: z.string().min(1).max(2),
  descripcion: z.string().max(40).optional(),
  titular: z.number().int().optional(),
  fechaRegistro2: z.date(),
  fechaFin2: z.date().optional(),
  usuario: z.string().max(13).optional(),
  estatus: z.string().min(1).max(1)
});

export const CreateOrganica2Schema = z.object({
   claveOrganica0: z.string().min(1).max(2),
   claveOrganica1: z.string().min(1).max(2),
   claveOrganica2: z.string().min(1).max(2),
   descripcion: z.string().max(40).optional(),
   titular: z.number().int().optional(),
   fechaFin2: z.string().datetime().optional().transform((val) => val ? new Date(val) : undefined),
   usuario: z.string().max(13).optional(),
   estatus: z.string().min(1).max(1).default('A')
 });

export const UpdateOrganica2Schema = z.object({
   descripcion: z.string().max(40).optional(),
   titular: z.number().int().optional(),
   fechaFin2: z.string().datetime().optional().transform((val) => val ? new Date(val) : undefined),
   usuario: z.string().max(13).optional(),
   estatus: z.string().min(1).max(1).optional()
 });

export const DynamicQuerySchema = z.object({
  filters: z.record(z.string(), z.unknown()).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['ASC', 'DESC']).optional(),
  limit: z.number().int().min(1).max(1000).optional(),
  offset: z.number().int().min(0).optional()
});

export type Organica2 = z.infer<typeof Organica2Schema>;
export type CreateOrganica2 = z.infer<typeof CreateOrganica2Schema>;
export type UpdateOrganica2 = z.infer<typeof UpdateOrganica2Schema>;
export type DynamicQuery = z.infer<typeof DynamicQuerySchema>;