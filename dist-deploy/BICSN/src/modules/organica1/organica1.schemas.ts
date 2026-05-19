import { z } from 'zod';

// Schema for ORGANICA_1 table (Firebird)
export const Organica1Schema = z.object({
  claveOrganica0: z.string().min(1).max(2),
  claveOrganica1: z.string().min(1).max(2),
  descripcion: z.string().max(40).optional(),
  titular: z.number().int().optional(),
  rfc: z.string().max(13).optional(),
  imss: z.string().max(11).optional(),
  infonavit: z.string().max(10).optional(),
  bancoSar: z.string().max(4).optional(),
  cuentaSar: z.string().max(13).optional(),
  tipoEmpresaSar: z.string().max(8).optional(),
  pcp: z.string().max(8).optional(),
  ph: z.string().max(8).optional(),
  fv: z.string().max(8).optional(),
  fg: z.string().max(8).optional(),
  di: z.string().max(8).optional(),
  fechaRegistro1: z.date(),
  fechaFin1: z.date().optional(),
  usuario: z.string().max(13).optional(),
  estatus: z.string().min(1).max(1),
  sar: z.string().max(12).optional()
});

export const CreateOrganica1Schema = z.object({
  claveOrganica0: z.string().min(1).max(2),
  claveOrganica1: z.string().min(1).max(2),
  descripcion: z.string().max(40).optional(),
  titular: z.number().int().optional(),
  rfc: z.string().max(13).optional(),
  imss: z.string().max(11).optional(),
  infonavit: z.string().max(10).optional(),
  bancoSar: z.string().max(4).optional(),
  cuentaSar: z.string().max(13).optional(),
  tipoEmpresaSar: z.string().max(8).optional(),
  pcp: z.string().max(8).optional(),
  ph: z.string().max(8).optional(),
  fv: z.string().max(8).optional(),
  fg: z.string().max(8).optional(),
  di: z.string().max(8).optional(),
  fechaFin1: z.date().optional(),
  usuario: z.string().max(13).optional(),
  estatus: z.string().min(1).max(1).default('A'),
  sar: z.string().max(12).optional()
});

export const UpdateOrganica1Schema = z.object({
  descripcion: z.string().max(40).optional(),
  titular: z.number().int().optional(),
  rfc: z.string().max(13).optional(),
  imss: z.string().max(11).optional(),
  infonavit: z.string().max(10).optional(),
  bancoSar: z.string().max(4).optional(),
  cuentaSar: z.string().max(13).optional(),
  tipoEmpresaSar: z.string().max(8).optional(),
  pcp: z.string().max(8).optional(),
  ph: z.string().max(8).optional(),
  fv: z.string().max(8).optional(),
  fg: z.string().max(8).optional(),
  di: z.string().max(8).optional(),
  fechaFin1: z.date().optional(),
  usuario: z.string().max(13).optional(),
  estatus: z.string().min(1).max(1).optional(),
  sar: z.string().max(12).optional()
});

export const DynamicQuerySchema = z.object({
  filters: z.record(z.string(), z.unknown()).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['ASC', 'DESC']).optional(),
  limit: z.number().int().min(1).max(1000).optional(),
  offset: z.number().int().min(0).optional()
});

export type Organica1 = z.infer<typeof Organica1Schema>;
export type CreateOrganica1 = z.infer<typeof CreateOrganica1Schema>;
export type UpdateOrganica1 = z.infer<typeof UpdateOrganica1Schema>;
export type DynamicQuery = z.infer<typeof DynamicQuerySchema>;