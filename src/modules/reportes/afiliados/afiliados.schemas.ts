import { z } from 'zod';

// Schema para parámetros de Historial Movimientos Quincenales
export const HistorialMovimientosQuinParamsSchema = z.object({
  periodo: z.string().min(1).max(20).describe('Período en formato específico (ej: "2125")')
});

// Schema para parámetros de Historial Mov Promedio Sueldo
export const HistorialMovPromedioSdoParamsSchema = z.object({
  periodo: z.string().min(1).max(20).describe('Período en formato específico (ej: "2125")'),
  pOrg0: z.string().length(2).describe('Clave orgánica nivel 0 (2 caracteres, ej: "01")'),
  pOrg1: z.string().length(2).describe('Clave orgánica nivel 1 (2 caracteres, ej: "01")'),
  pOrg2: z.string().length(2).describe('Clave orgánica nivel 2 (2 caracteres, ej: "01")'),
  pOrg3: z.string().length(2).describe('Clave orgánica nivel 3 (2 caracteres, ej: "01")')
});

// Schemas para respuestas
export const HistorialMovimientosQuinSchema = z.object({
  org0: z.string(),
  org1: z.string(),
  quincena: z.string(),
  nOrg: z.string(),
  movimientos: z.number(),
  quincena1: z.string(),
  fecha1: z.string(),
  fecha: z.string(),
  nomAl: z.string(),
  nomBa: z.string(),
  nomCs: z.string(),
  al: z.number(),
  ba: z.number(),
  cs: z.number(),
  al1: z.number(),
  ba1: z.number(),
  cs1: z.number(),
  totalInicial: z.number(),
  totalActual: z.number(),
  total: z.number(),
  cveError: z.number(),
  nomError: z.string(),
  pSueldo: z.number(),
  pOtrasPrestaciones: z.number(),
  pQuinquenios: z.number()
});

export const HistorialMovPromedioSdoSchema = z.object({
  aportacion: z.number(),
  tsare: z.number(),
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
  org2: z.string(),
  org3: z.string(),
  tSueldo: z.number(),
  tOtrasPrestaciones: z.number(),
  tQuinquenios: z.number(),
  nOrg0: z.string(),
  nOrg1: z.string(),
  nOrg2: z.string(),
  nOrg3: z.string(),
  pSueldo: z.number(),
  pOtrasPrestaciones: z.number(),
  pQuinquenios: z.number()
});

// Schemas para respuestas de API
export const HistorialMovimientosQuinResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(HistorialMovimientosQuinSchema),
  timestamp: z.string().optional()
});

export const HistorialMovPromedioSdoResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(HistorialMovPromedioSdoSchema),
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
export type HistorialMovimientosQuinParams = z.infer<typeof HistorialMovimientosQuinParamsSchema>;
export type HistorialMovPromedioSdoParams = z.infer<typeof HistorialMovPromedioSdoParamsSchema>;

