import { z } from 'zod';

// Must match SQL Server CHECK constraint dbo.EventoCalendario.tipo (plus any newly-added values)
const TipoEventoEnum = z.enum([
  'ARCHIVO_APLICACION',
  'ASUETO',
  'ALTA_BAJA_CAMBIO',
  'BA_MOVIMIENTO',
  'PAGO',
  'HIPOTECARIO',
  'INTERESES_MORATORIOS',
  'REPORTES'
]);

export const CreateEventoCalendarioSchema = z.object({
  fecha: z.string().date(), // YYYY-MM-DD
  tipo: TipoEventoEnum,
  anio: z.number().int(),
  createdAt: z.string().datetime().optional().default(() => new Date().toISOString())
});

export const UpdateEventoCalendarioSchema = z.object({
  fecha: z.string().date().optional(),
  tipo: TipoEventoEnum.optional(),
  anio: z.number().int().optional(),
  createdAt: z.string().datetime().optional(),
  confirmarImpactoBA: z.boolean().optional()
});

export const EventoCalendarioIdSchema = z.object({
  id: z.number().int()
});

// This schema is used in the routes for querystring validation
export const QueryEventoCalendarioByDateRangeSchema = z.object({
  fechaInicio: z.string().date(),
  fechaFin: z.string().date(),
  tipo: TipoEventoEnum.optional()
});
