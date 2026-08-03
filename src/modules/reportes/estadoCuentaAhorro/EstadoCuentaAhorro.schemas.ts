import { z } from 'zod';

const claveOrganica = z.string().regex(/^\d{1,2}$/).transform((value) => value.padStart(2, '0'));

export const EstadoCuentaAhorroParamsSchema = z.object({
  quincena: z.coerce.number().int().min(1).max(24),
  anio: z.coerce.number().int().min(2000).max(2100),
  org0: claveOrganica.optional(),
  org1: claveOrganica.optional(),
  org2: claveOrganica.optional(),
  org3: claveOrganica.optional()
});

export const EstadoCuentaAhorroOrganicasParamsSchema = z.object({
  org0: claveOrganica.optional(),
  org1: claveOrganica.optional(),
  org2: claveOrganica.optional(),
  org3: claveOrganica.optional()
});

export const AplicarEstadoCuentaAhorroParamsSchema = EstadoCuentaAhorroOrganicasParamsSchema.extend({
  periodo: z.string().regex(/^\d{4}$/, 'periodo debe tener formato QQAA')
});

export const EstadoCuentaAhorroHistoricoParamsSchema = z.object({
  idHistorico: z.coerce.number().int().positive()
});

export type EstadoCuentaAhorroParams = z.infer<typeof EstadoCuentaAhorroParamsSchema>;
