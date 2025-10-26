import { z } from 'zod';

// Schema for ORGANICA_3 table (Firebird)
export const Organica3Schema = z.object({
  claveOrganica0: z.string().min(1).max(2),
  claveOrganica1: z.string().min(1).max(2),
  claveOrganica2: z.string().min(1).max(2),
  claveOrganica3: z.string().min(1).max(2),
  descripcion: z.string().max(40).optional(),
  titular: z.number().int().optional(),
  calleNum: z.string().max(40).optional(),
  fraccionamiento: z.string().max(40).optional(),
  codigoPostal: z.string().max(5).optional(),
  telefono: z.string().max(15).optional(),
  fax: z.string().max(15).optional(),
  localidad: z.string().max(25).optional(),
  municipio: z.number().int().optional(),
  estado: z.number().int().optional(),
  fechaRegistro3: z.date(),
  fechaFin3: z.date().optional(),
  usuario: z.string().max(13).optional(),
  estatus: z.string().min(1).max(1)
});

export const CreateOrganica3Schema = z.object({
   claveOrganica0: z.string().min(1).max(2),
   claveOrganica1: z.string().min(1).max(2),
   claveOrganica2: z.string().min(1).max(2),
   claveOrganica3: z.string().min(1).max(2),
   descripcion: z.string().max(40).optional(),
   titular: z.number().int().optional(),
   calleNum: z.string().max(40).optional(),
   fraccionamiento: z.string().max(40).optional(),
   codigoPostal: z.string().max(5).optional(),
   telefono: z.string().max(15).optional(),
   fax: z.string().max(15).optional(),
   localidad: z.string().max(25).optional(),
   municipio: z.number().int().optional(),
   estado: z.number().int().optional(),
   fechaFin3: z.string().datetime().optional().transform((val) => val ? new Date(val) : undefined),
   usuario: z.string().max(13).optional(),
   estatus: z.string().min(1).max(1).default('A')
 });

export const UpdateOrganica3Schema = z.object({
   descripcion: z.string().max(40).optional(),
   titular: z.number().int().optional(),
   calleNum: z.string().max(40).optional(),
   fraccionamiento: z.string().max(40).optional(),
   codigoPostal: z.string().max(5).optional(),
   telefono: z.string().max(15).optional(),
   fax: z.string().max(15).optional(),
   localidad: z.string().max(25).optional(),
   municipio: z.number().int().optional(),
   estado: z.number().int().optional(),
   fechaFin3: z.string().datetime().optional().transform((val) => val ? new Date(val) : undefined),
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

export type Organica3 = z.infer<typeof Organica3Schema>;
export type CreateOrganica3 = z.infer<typeof CreateOrganica3Schema>;
export type UpdateOrganica3 = z.infer<typeof UpdateOrganica3Schema>;
export type DynamicQuery = z.infer<typeof DynamicQuerySchema>;