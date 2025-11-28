import { z } from 'zod';

const TipoEventoEnum = z.enum(['FERIADO', 'VACACIONES', 'EVENTO_ESPECIAL', 'DIA_NO_LABORABLE', 'ALTA_BAJA_CAMBIO']);

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
  createdAt: z.string().datetime().optional()
});

export const EventoCalendarioIdSchema = z.object({
  id: z.number().int()
});

// This schema is used in the routes for querystring validation
export const QueryEventoCalendarioByDateRangeSchema = z.object({
  fechaInicio: z.string().date(),
  fechaFin: z.string().date(),
  tipo: z.enum(['FERIADO', 'VACACIONES', 'EVENTO_ESPECIAL', 'DIA_NO_LABORABLE']).optional()
});