import { z } from 'zod';

export const OrgPersonalSchema = z.object({
  interno: z.number().int(),
  clave_organica_0: z.string().max(2).nullable(),
  clave_organica_1: z.string().max(2).nullable(),
  clave_organica_2: z.string().max(2).nullable(),
  clave_organica_3: z.string().max(2).nullable(),
  sueldo: z.number().nullable(),
  otras_prestaciones: z.number().nullable(),
  quinquenios: z.number().nullable(),
  activo: z.string().max(1).nullable(),
  fecha_mov_alt: z.string().datetime().nullable(),
  orgs1: z.string().nullable(),
  orgs2: z.string().nullable(),
  orgs3: z.string().nullable(),
  orgs: z.string().nullable(),
  dsueldo: z.number().nullable(),
  dotras_prestaciones: z.number().nullable(),
  daquinquenios: z.number().nullable(),
  aplicar: z.string().max(1).nullable(),
  bc: z.string().max(1).nullable(),
  porcentaje: z.number().int().nullable()
});

export const CreateOrgPersonalSchema = z.object({
  interno: z.number().int(),
  clave_organica_0: z.string().max(2).nullable().optional(),
  clave_organica_1: z.string().max(2).nullable().optional(),
  clave_organica_2: z.string().max(2).nullable().optional(),
  clave_organica_3: z.string().max(2).nullable().optional(),
  sueldo: z.number().nullable().optional(),
  otras_prestaciones: z.number().nullable().optional(),
  quinquenios: z.number().nullable().optional(),
  activo: z.string().max(1).nullable().optional(),
  fecha_mov_alt: z.string().datetime().nullable().optional(),
  dsueldo: z.number().nullable().optional(),
  dotras_prestaciones: z.number().nullable().optional(),
  daquinquenios: z.number().nullable().optional(),
  aplicar: z.string().max(1).nullable().optional(),
  bc: z.string().max(1).nullable().optional(),
  porcentaje: z.number().int().nullable().optional()
});

export const UpdateOrgPersonalSchema = z.object({
  clave_organica_0: z.string().max(2).nullable().optional(),
  clave_organica_1: z.string().max(2).nullable().optional(),
  clave_organica_2: z.string().max(2).nullable().optional(),
  clave_organica_3: z.string().max(2).nullable().optional(),
  sueldo: z.number().nullable().optional(),
  otras_prestaciones: z.number().nullable().optional(),
  quinquenios: z.number().nullable().optional(),
  activo: z.string().max(1).nullable().optional(),
  fecha_mov_alt: z.string().datetime().nullable().optional(),
  dsueldo: z.number().nullable().optional(),
  dotras_prestaciones: z.number().nullable().optional(),
  daquinquenios: z.number().nullable().optional(),
  aplicar: z.string().max(1).nullable().optional(),
  bc: z.string().max(1).nullable().optional(),
  porcentaje: z.number().int().nullable().optional()
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' }
);