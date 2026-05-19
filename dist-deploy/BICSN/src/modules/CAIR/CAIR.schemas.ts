import { z } from 'zod';

// Schema para parámetros de SAR_DEVOLUCION
export const SARDevolucionParamsSchema = z.object({
  interno: z.string().min(1).max(50).describe('Número interno del afiliado'),
  tipo: z.string().min(1).max(10).describe('Tipo de devolución')
});

// Schemas para respuestas
export const DevueltoTipoSchema = z.object({
  tipo: z.string(),
  descripcion: z.string(),
  generaCheque: z.string(),
  status: z.string()
});

export const ChequeLeyendaSchema = z.object({
  cveLeyenda: z.string(),
  leyenda: z.string()
});

export const SARDevolucionSchema = z.object({
  noAporta: z.number(),
  aportacion: z.number(),
  aportacionInteres: z.number(),
  voluntario: z.number(),
  voluntarioInteres: z.number(),
  recuperado: z.number(),
  interes: z.number(),
  total: z.number(),
  error: z.string(),
  nerror: z.string()
});

// Schemas para respuestas de API
export const DevueltoTiposResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(DevueltoTipoSchema),
  timestamp: z.string().optional()
});

export const ChequesLeyendasResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(ChequeLeyendaSchema),
  timestamp: z.string().optional()
});

export const SARDevolucionResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(SARDevolucionSchema),
  timestamp: z.string().optional()
});

export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    timestamp: z.string().optional()
  })
});

// Tipos TypeScript inferidos
export type SARDevolucionParams = z.infer<typeof SARDevolucionParamsSchema>;

