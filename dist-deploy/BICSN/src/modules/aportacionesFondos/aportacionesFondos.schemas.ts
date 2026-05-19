import { z } from 'zod';

// Esquemas para validación de parámetros de consulta
export const AportacionesIndividualesSchema = z.object({
  tipo: z.enum(['ahorro', 'vivienda', 'prestaciones', 'cair']),
  clave_organica_0: z.string().min(1).max(2).optional(),
  clave_organica_1: z.string().min(1).max(2).optional()
});

export const AportacionesCompletasSchema = z.object({
  clave_organica_0: z.string().min(1).max(2).optional(),
  clave_organica_1: z.string().min(1).max(2).optional()
});

// Esquemas para respuestas de la API
export const AportacionFondoResponseSchema = z.object({
  interno: z.number(),
  nombre: z.string().nullable().default(null),
  sueldo: z.number().nullable(),
  quinquenios: z.number().nullable(),
  otras_prestaciones: z.number().nullable(),
  sueldo_base: z.number(),
  afae: z.number().optional(),
  afaa: z.number().optional(),
  afe: z.number().optional(),
  afpe: z.number().optional(),
  afpa: z.number().optional(),
  total: z.number(),
  tipo: z.string()
});

export const AportacionIndividualResponseSchema = z.object({
  tipo: z.enum(['ahorro', 'vivienda', 'prestaciones', 'cair']),
  clave_organica_0: z.string(),
  clave_organica_1: z.string(),
  datos: z.array(AportacionFondoResponseSchema),
  resumen: z.object({
    total_empleados: z.number(),
    total_contribucion: z.number(),
    total_sueldo_base: z.number()
  })
});

export const AportacionCompletaResponseSchema = z.object({
  clave_organica_0: z.string(),
  clave_organica_1: z.string(),
  ahorro: AportacionIndividualResponseSchema.optional(),
  vivienda: AportacionIndividualResponseSchema.optional(),
  prestaciones: AportacionIndividualResponseSchema.optional(),
  cair: AportacionIndividualResponseSchema.optional(),
  resumen_general: z.object({
    total_empleados: z.number(),
    total_contribucion_general: z.number(),
    total_sueldo_base_general: z.number(),
    fondos_incluidos: z.array(z.string())
  })
});

export type AportacionesIndividualesInput = z.infer<typeof AportacionesIndividualesSchema>;
export type AportacionesCompletasInput = z.infer<typeof AportacionesCompletasSchema>;
export type AportacionFondoResponse = z.infer<typeof AportacionFondoResponseSchema>;
export type AportacionIndividualResponse = z.infer<typeof AportacionIndividualResponseSchema>;
export type AportacionCompletaResponse = z.infer<typeof AportacionCompletaResponseSchema>;