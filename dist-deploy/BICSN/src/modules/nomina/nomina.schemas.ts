import { z } from 'zod';

const organicaSchema = z.string().trim().min(1).max(2).transform((value) => value.padStart(2, '0'));

export const CargarNominaAplicacionQnalTxtFieldsSchema = z.object({
  entidadId: z.coerce.number().int().positive().default(1),
  anio: z.coerce.number().int().min(2000).max(2100),
  quincena: z.coerce.number().int().min(1).max(24),
  organica0: organicaSchema.optional(),
  organica1: organicaSchema.optional(),
  organica2: organicaSchema.optional(),
  organica3: organicaSchema.optional()
});

export const GetNominaAplicacionQnalTxtRegistrosSchema = CargarNominaAplicacionQnalTxtFieldsSchema.extend({
  buscar: z.string().trim().min(1).max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50)
});
