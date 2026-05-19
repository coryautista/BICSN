import { z } from 'zod';

export const CreateIndicadorAnualSchema = z.object({
  idIndicador: z.number().int().positive('idIndicador must be a positive integer'),
  anio: z.number().int().min(2000, 'Anio must be at least 2000').max(2100, 'Anio must be at most 2100'),
  enero: z.number().optional(),
  febrero: z.number().optional(),
  marzo: z.number().optional(),
  abril: z.number().optional(),
  mayo: z.number().optional(),
  junio: z.number().optional(),
  julio: z.number().optional(),
  agosto: z.number().optional(),
  septiembre: z.number().optional(),
  octubre: z.number().optional(),
  noviembre: z.number().optional(),
  diciembre: z.number().optional(),
  metaAnual: z.number().optional(),
  observaciones: z.string().max(2000, 'Observaciones must be at most 2000 characters').optional()
});

export const UpdateIndicadorAnualSchema = z.object({
  enero: z.number().optional(),
  febrero: z.number().optional(),
  marzo: z.number().optional(),
  abril: z.number().optional(),
  mayo: z.number().optional(),
  junio: z.number().optional(),
  julio: z.number().optional(),
  agosto: z.number().optional(),
  septiembre: z.number().optional(),
  octubre: z.number().optional(),
  noviembre: z.number().optional(),
  diciembre: z.number().optional(),
  metaAnual: z.number().optional(),
  observaciones: z.string().max(2000, 'Observaciones must be at most 2000 characters').optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update'
});

export const IndicadorAnualIdParamSchema = z.object({
  indicadorAnualId: z.string().regex(/^\d+$/, 'IndicadorAnualID must be a number').transform(val => parseInt(val))
});

export const IndicadorIdParamSchema = z.object({
  indicadorId: z.string().regex(/^\d+$/, 'IndicadorID must be a number').transform(val => parseInt(val))
});

export const AnioParamSchema = z.object({
  anio: z.string().regex(/^\d{4}$/, 'Anio must be a 4-digit number').transform(val => parseInt(val))
});