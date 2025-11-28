import { z } from 'zod';

// Schema para parámetros de Estado de Cuenta CAIR
export const EstadoCuentaCAIRParamsSchema = z.object({
  quincena: z.string().min(1).max(20).describe('Quincena en formato específico (ej: "2125")')
});

// Schema para parámetros de CAIR Entregado
export const CAIREntregadoParamsSchema = z.object({
  fi: z.string().min(1).max(20).describe('Fecha inicial en formato específico'),
  ff: z.string().min(1).max(20).describe('Fecha final en formato específico'),
  tipo: z.string().min(1).max(10).describe('Tipo de reporte')
});

// Schemas para respuestas
export const EstadoCuentaCAIRSchema = z.object({
  org0: z.string(),
  org1: z.string(),
  periodo: z.string(),
  entidad: z.string(),
  ap: z.number(),
  sar: z.number(),
  cantidad: z.number(),
  apr: z.number(),
  recuperado: z.number(),
  api: z.number(),
  apc: z.number(),
  interes: z.number(),
  apv: z.number(),
  voluntario: z.number(),
  afiliados: z.number(),
  apcs: z.number(),
  cancelados: z.number(),
  apcv: z.number(),
  canceladoV: z.number(),
  apes: z.number(),
  entregados: z.number(),
  apev: z.number(),
  entregadoV: z.number(),
  rendimientos: z.number()
});

export const CAIREntregadoSchema = z.object({
  interno: z.number(),
  nombre: z.string(),
  rfc: z.string(),
  noAportaciones: z.number(),
  aportacion: z.number(),
  voluntario: z.number(),
  recuperado: z.number(),
  aportacionInteres: z.number(),
  voluntarioInteres: z.number(),
  entregado: z.number(),
  periodo: z.string(),
  fechaEntrega: z.string(),
  motivo: z.string(),
  nmotivo: z.string(),
  titulo: z.string(),
  leyenda: z.string(),
  status: z.string(),
  cheque: z.string(),
  cveBanco: z.string(),
  cuenta: z.string(),
  fechaEmision: z.string(),
  numBenef: z.string(),
  nombreBenef: z.string(),
  entregadoBenef: z.number(),
  chequeBenef: z.string(),
  cveBancoBenef: z.string(),
  cuentaBenef: z.string(),
  fechaEmisionBenef: z.string(),
  org00: z.string(),
  org11: z.string(),
  org22: z.string(),
  org33: z.string(),
  nOrg0: z.string(),
  nOrg1: z.string(),
  nOrg2: z.string(),
  nOrg3: z.string(),
  activo: z.string(),
  fecha: z.string(),
  fechaPaso: z.string(),
  fechaPa: z.string(),
  org0: z.string(),
  org1: z.string(),
  org2: z.string(),
  org3: z.string()
});

// Schemas para respuestas de API
export const EstadoCuentaCAIRResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(EstadoCuentaCAIRSchema),
  timestamp: z.string().optional()
});

export const CAIREntregadoResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(CAIREntregadoSchema),
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
export type EstadoCuentaCAIRParams = z.infer<typeof EstadoCuentaCAIRParamsSchema>;
export type CAIREntregadoParams = z.infer<typeof CAIREntregadoParamsSchema>;

