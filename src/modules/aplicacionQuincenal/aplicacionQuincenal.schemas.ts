import { z } from 'zod';

// Schema para parámetros de AportacionQuincenalResumen
export const AportacionQuincenalResumenParamsSchema = z.object({
  org0: z.string().min(1).max(2).optional().describe('Clave orgánica 0 (requerido para admin, opcional para usuarios normales)'),
  org1: z.string().min(1).max(2).optional().describe('Clave orgánica 1 (requerido para admin, opcional para usuarios normales)'),
  PERIODO: z.string().min(1).max(10).describe('Período en formato QQAA (ej: "2125")')
});

// Tipos TypeScript inferidos
export type AportacionQuincenalResumenParams = z.infer<typeof AportacionQuincenalResumenParamsSchema>;

