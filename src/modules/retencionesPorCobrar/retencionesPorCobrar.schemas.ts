import { z } from 'zod';

// Schema para parámetros de Consulta_Int_Moratorio
export const ConsultaIntMoratorioParamsSchema = z.object({
  org0: z.string().min(1).max(2).optional().describe('Clave orgánica 0 (opcional, se toma del token si no se proporciona)'),
  org1: z.string().min(1).max(2).optional().describe('Clave orgánica 1 (opcional, se toma del token si no se proporciona)'),
  QNA: z.string().min(1).max(10).describe('Período en formato QQAA (ej: "2225")')
});

// Schema para la entidad RetencionPorCobrar
export const RetencionPorCobrarSchema = z.object({
  claveOrganica0: z.string(),
  claveOrganica1: z.string(),
  claveOrganica2: z.string().nullable(),
  claveOrganica3: z.string().nullable(),
  periodo: z.string(),
  fechaGeneracion: z.date().nullable(),
  userAlta: z.string().nullable(),
  tipo: z.string()
});

// Schema para la respuesta de Consulta_Int_Moratorio
export const ConsultaIntMoratorioResponseSchema = z.object({
  ok: z.boolean(),
  validado: z.boolean(),
  registros: z.array(RetencionPorCobrarSchema)
});

// Tipos TypeScript inferidos
export type ConsultaIntMoratorioParams = z.infer<typeof ConsultaIntMoratorioParamsSchema>;
export type RetencionPorCobrar = z.infer<typeof RetencionPorCobrarSchema>;
export type ConsultaIntMoratorioResponse = z.infer<typeof ConsultaIntMoratorioResponseSchema>;

