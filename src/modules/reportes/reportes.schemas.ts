import { z } from 'zod';

// Schema for report filters
export const ReportFiltersSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(new Date().getFullYear() + 1),
  organica0: z.string().max(2).optional(),
  organica1: z.string().max(2).optional()
});

// Schema for monthly personnel report response
export const MonthlyPersonnelReportSchema = z.object({
  month: z.number(),
  year: z.number(),
  organica0: z.string(),
  organica1: z.string(),
  descripcionOrganica1: z.string(),
  sueldoMensual: z.number(),
  afiliados: z.number(),
  primeraQuincena: z.object({
    altas: z.number(),
    bajas: z.number()
  }),
  segundaQuincena: z.object({
    altas: z.number(),
    bajas: z.number()
  })
});

// Schema for personnel movement response
export const PersonnelMovementSchema = z.object({
  interno: z.number(),
  nombreCompleto: z.string(),
  organica0: z.string(),
  organica1: z.string(),
  tipoMovimiento: z.enum(['ALTA', 'BAJA']),
  fechaMovimiento: z.string(),
  quincena: z.union([z.literal(1), z.literal(2)]),
  sueldo: z.number()
});

// Schema for API responses
export const MonthlyReportResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(MonthlyPersonnelReportSchema),
  timestamp: z.string().optional()
});

export const PersonnelMovementsResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(PersonnelMovementSchema),
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

export type ReportFilters = z.infer<typeof ReportFiltersSchema>;
export type MonthlyPersonnelReport = z.infer<typeof MonthlyPersonnelReportSchema>;
export type PersonnelMovement = z.infer<typeof PersonnelMovementSchema>;