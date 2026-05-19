import { z } from 'zod';

export const HistoricoGrupoParamSchema = z.object({
  grupo: z.enum(['aportaciones', 'retenciones']),
  tipo: z.string().min(1).max(50)
});

export const HistoricoQuerySchema = z.object({
  periodo: z.string().regex(/^\d{4}$/, 'periodo debe tener formato QQAA, ejemplo 0626'),
  org0: z.string().regex(/^[A-Za-z0-9]{1,2}$/).optional(),
  org1: z.string().regex(/^[A-Za-z0-9]{1,2}$/).optional(),
  buscar: z.string().trim().min(1).max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(500).default(100)
});
