import { z } from 'zod';

// Schema para parámetros de Movimientos Quincenales
export const MovimientosQuincenalesParamsSchema = z.object({
  periodo: z.string().min(1).max(20).describe('Período en formato específico (ej: "2125")'),
  pOrg0: z.string().length(2).describe('Clave orgánica nivel 0 (2 caracteres, ej: "01")'),
  pOrg1: z.string().length(2).describe('Clave orgánica nivel 1 (2 caracteres, ej: "01")')
});

// Schema para parámetros de Aplicación Aportaciones
export const AplicacionAportacionesParamsSchema = z.object({
  pOrg0: z.string().length(2).describe('Clave orgánica nivel 0 (2 caracteres, ej: "01")'),
  pOrg1: z.string().length(2).describe('Clave orgánica nivel 1 (2 caracteres, ej: "01")'),
  periodo: z.string().min(1).max(20).describe('Período en formato específico (ej: "2125")')
});

// Schema para parámetros de Aplicación PCP
export const AplicacionPCPParamsSchema = z.object({
  pOrg0: z.string().length(2).describe('Clave orgánica nivel 0 (2 caracteres, ej: "01")'),
  pOrg1: z.string().length(2).describe('Clave orgánica nivel 1 (2 caracteres, ej: "01")'),
  pPeriodo: z.string().min(1).max(20).describe('Período en formato específico (ej: "2125")')
});

// Schema para parámetros de Aplicación PMP
export const AplicacionPMPParamsSchema = z.object({
  pOrg0: z.string().length(2).describe('Clave orgánica nivel 0 (2 caracteres, ej: "01")'),
  pOrg1: z.string().length(2).describe('Clave orgánica nivel 1 (2 caracteres, ej: "01")'),
  pPeriodo: z.string().min(1).max(20).describe('Período en formato específico (ej: "2125")')
});

// Schema para parámetros de Aplicación HIP
export const AplicacionHIPParamsSchema = z.object({
  org0: z.string().length(2).describe('Clave orgánica nivel 0 (2 caracteres, ej: "01")'),
  org1: z.string().length(2).describe('Clave orgánica nivel 1 (2 caracteres, ej: "01")'),
  quincena: z.string().min(1).max(20).describe('Quincena en formato específico')
});

// Schema para parámetros de Concentrado
export const ConcentradoParamsSchema = z.object({
  org0: z.string().length(2).describe('Clave orgánica nivel 0 (2 caracteres, ej: "01")'),
  org1: z.string().length(2).describe('Clave orgánica nivel 1 (2 caracteres, ej: "01")'),
  org2: z.string().length(2).describe('Clave orgánica nivel 2 (2 caracteres, ej: "01")'),
  org3: z.string().length(2).describe('Clave orgánica nivel 3 (2 caracteres, ej: "01")'),
  periodo: z.string().min(1).max(20).describe('Período en formato específico (ej: "2125")')
});

// Schemas para respuestas
export const MovimientoQuincenalSchema = z.object({
  interno: z.number(),
  consecutivo: z.number(),
  cveMovimiento: z.string(),
  nomMovimiento: z.string(),
  nombre: z.string(),
  noEmpleado: z.string(),
  rfc: z.string(),
  sA: z.number(),
  opA: z.number(),
  qA: z.number(),
  sN: z.number(),
  opN: z.number(),
  qN: z.number(),
  retroactivas: z.number(),
  sR: z.number(),
  opR: z.number(),
  qR: z.number(),
  org0: z.string(),
  org1: z.string(),
  org2: z.string(),
  org3: z.string(),
  nOrg0: z.string(),
  nOrg1: z.string(),
  nOrg2: z.string(),
  nOrg3: z.string(),
  usuario: z.string(),
  fRealm: z.string()
});

export const AplicacionAportacionesSchema = z.object({
  interno: z.number(),
  nombre: z.string(),
  sueldom: z.number(),
  otrasPrestaciones: z.number(),
  quinquenios: z.number(),
  sueldoq: z.number(),
  opq: z.number(),
  qq: z.number(),
  sare: z.number(),
  fra: z.number(),
  fre: z.number(),
  fhe: z.number(),
  fve: z.number(),
  faa: z.number(),
  fae: z.number(),
  fat: z.number(),
  fai: z.number(),
  sFra: z.number(),
  sFre: z.number(),
  sFhe: z.number(),
  sFve: z.number(),
  sFaa: z.number(),
  sFae: z.number(),
  sFat: z.number(),
  sFai: z.number(),
  tFra: z.number(),
  tFre: z.number(),
  tFhe: z.number(),
  tFve: z.number(),
  tFaa: z.number(),
  tFae: z.number(),
  tFat: z.number(),
  tFai: z.number(),
  org0: z.string(),
  org1: z.string(),
  rfc: z.string()
});

export const AplicacionPCPSchema = z.object({
  interno: z.number(),
  rfc: z.string(),
  nombre: z.string(),
  prestamo: z.string(),
  letra: z.number(),
  plazo: z.number(),
  periodoC: z.string(),
  fechaC: z.string(),
  capital: z.number(),
  interes: z.number(),
  monto: z.number(),
  moratorios: z.number(),
  total: z.number(),
  resultado: z.string(),
  td: z.string(),
  org0: z.string(),
  org1: z.string(),
  org2: z.string(),
  org3: z.string(),
  nOrg0: z.string(),
  nOrg1: z.string(),
  nOrg2: z.string(),
  nOrg3: z.string()
});

export const AplicacionPMPSchema = z.object({
  interno: z.number(),
  rfc: z.string(),
  nombre: z.string(),
  prestamo: z.string(),
  letra: z.number(),
  plazo: z.number(),
  periodoC: z.string(),
  fechaC: z.string(),
  capital: z.number(),
  moratorios: z.number(),
  interes: z.number(),
  seguro: z.number(),
  total: z.number(),
  resultado: z.string(),
  clase: z.string(),
  org0: z.string(),
  org1: z.string(),
  org2: z.string(),
  org3: z.string(),
  nOrg0: z.string(),
  nOrg1: z.string(),
  nOrg2: z.string(),
  nOrg3: z.string(),
  descClase: z.string(),
  descPrestamo: z.string(),
  claveP: z.string(),
  noEmple: z.string(),
  folio: z.string(),
  anio: z.number(),
  po: z.string(),
  fechaOrigen: z.string()
});

export const AplicacionHIPSchema = z.object({
  interno: z.number(),
  nombre: z.string(),
  noEmpleado: z.string(),
  cantidad: z.number(),
  status: z.string(),
  referencia1: z.string(),
  referencia2: z.string(),
  capitalPagar: z.number(),
  interesPagar: z.number(),
  interesDiferidoPagar: z.number(),
  seguroPagar: z.number(),
  moratorioPagar: z.number(),
  pnoSolicitud: z.string(),
  pano: z.number(),
  pclaveClasePrestamo: z.string(),
  pdescripcion: z.string(),
  rfc: z.string(),
  org0: z.string(),
  org1: z.string(),
  org2: z.string(),
  org3: z.string(),
  nOrg0: z.string(),
  nOrg1: z.string(),
  nOrg2: z.string(),
  nOrg3: z.string(),
  pclavePrestamo: z.string(),
  prestamoDesc: z.string(),
  tipo: z.string(),
  periodoC: z.string(),
  descto: z.number(),
  fechaC: z.string(),
  resultado: z.string(),
  po: z.string(),
  fechaOrigen: z.string(),
  plazo: z.number()
});

export const ConcentradoSchema = z.object({
  tipo: z.string(),
  concepto: z.string(),
  parcial: z.number(),
  total: z.number(),
  tipoFondo: z.string()
});

// Schemas para respuestas de API
export const MovimientosQuincenalesResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(MovimientoQuincenalSchema),
  timestamp: z.string().optional()
});

export const AplicacionAportacionesResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(AplicacionAportacionesSchema),
  timestamp: z.string().optional()
});

export const AplicacionPCPResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(AplicacionPCPSchema),
  timestamp: z.string().optional()
});

export const AplicacionPMPResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(AplicacionPMPSchema),
  timestamp: z.string().optional()
});

export const AplicacionHIPResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(AplicacionHIPSchema),
  timestamp: z.string().optional()
});

export const ConcentradoResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(ConcentradoSchema),
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
export type MovimientosQuincenalesParams = z.infer<typeof MovimientosQuincenalesParamsSchema>;
export type AplicacionAportacionesParams = z.infer<typeof AplicacionAportacionesParamsSchema>;
export type AplicacionPCPParams = z.infer<typeof AplicacionPCPParamsSchema>;
export type AplicacionPMPParams = z.infer<typeof AplicacionPMPParamsSchema>;
export type AplicacionHIPParams = z.infer<typeof AplicacionHIPParamsSchema>;
export type ConcentradoParams = z.infer<typeof ConcentradoParamsSchema>;

