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

export const NumerosEmpleadoLookupSchema = z.object({
  internos: z.array(z.number().int().positive()).max(1000).default([]),
  rfcs: z.array(z.string().trim().min(1).max(13)).max(1000).default([])
}).refine((value) => value.internos.length > 0 || value.rfcs.length > 0, {
  message: 'Se requiere al menos un interno o RFC'
});

export const SnapshotCalculoV2ConsultaSchema = z.object({
  entidadId: z.coerce.number().int().positive(),
  anio: z.coerce.number().int().min(2000).max(3000),
  quincena: z.coerce.number().int().min(1).max(24),
  organica0: z.string().length(2),
  organica1: z.string().length(2),
  organica2: z.string().length(2),
  organica3: z.string().length(2),
  fuente: z.enum(['LIQUIDACION_V2', 'HISTORICO_SQL']).default('LIQUIDACION_V2'),
  revision: z.coerce.number().int().positive().optional(),
  incluirDetalles: z.enum(['0', '1']).default('0').transform((value) => value === '1')
});

export const SnapshotCalculoV2BandejaSchema = z.object({
  pagina: z.coerce.number().int().positive().default(1),
  tamanio: z.coerce.number().int().min(1).max(50).default(20),
  anio: z.coerce.number().int().min(2000).max(3000).optional(),
  quincena: z.coerce.number().int().min(1).max(24).optional(),
  entidadId: z.coerce.number().int().positive().optional(),
  organica0: z.string().length(2).optional(),
  organica1: z.string().length(2).optional(),
  fuente: z.enum(['LIQUIDACION_V2', 'HISTORICO_SQL']).optional(),
  estado: z.enum(['COMPLETO', 'AGREGADO_LEGADO', 'INCOMPLETO']).optional()
});

export const SnapshotCalculoV2DecisionParamsSchema = z.object({
  snapshotId: z.string().regex(/^\d+$/)
});

export const SnapshotCalculoV2DecisionSchema = z.object({
  decision: z.enum(['APROBADO', 'OBSERVADO']),
  comentario: z.string().trim().max(500).nullable().optional().transform((value) => value || null)
}).superRefine((value, context) => {
  if (value.decision === 'OBSERVADO' && !value.comentario) {
    context.addIssue({ code: 'custom', path: ['comentario'], message: 'El comentario es requerido para observar' });
  }
});

export const SnapshotCalculoV2OfficialSchema = SnapshotCalculoV2ConsultaSchema.pick({
  entidadId: true,
  anio: true,
  quincena: true,
  organica0: true,
  organica1: true,
  organica2: true,
  organica3: true
}).extend({
  fuente: z.enum(['LIQUIDACION_V2', 'HISTORICO_SQL']),
  revision: z.coerce.number().int().positive()
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
  tipo: z.string(),
  base_cotizacion_quinquenios: z.number().nullable().optional(),
  quinquenios_aplicado: z.number().nullable().optional()
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
export type NumerosEmpleadoLookupInput = z.infer<typeof NumerosEmpleadoLookupSchema>;
export type SnapshotCalculoV2ConsultaInput = z.infer<typeof SnapshotCalculoV2ConsultaSchema>;
export type SnapshotCalculoV2BandejaInput = z.infer<typeof SnapshotCalculoV2BandejaSchema>;
export type SnapshotCalculoV2DecisionInput = z.infer<typeof SnapshotCalculoV2DecisionSchema>;
export type SnapshotCalculoV2OfficialInput = z.infer<typeof SnapshotCalculoV2OfficialSchema>;
export type AportacionFondoResponse = z.infer<typeof AportacionFondoResponseSchema>;
export type AportacionIndividualResponse = z.infer<typeof AportacionIndividualResponseSchema>;
export type AportacionCompletaResponse = z.infer<typeof AportacionCompletaResponseSchema>;
