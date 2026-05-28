import { z } from 'zod';

export const TipoFondoCatalogoSchema = z.enum(['ahorro', 'vivienda', 'prestaciones', 'cair']);

export const ListCatalogoPorcentajeFondoSchema = z.object({
  tipoFondo: TipoFondoCatalogoSchema.optional(),
  anioVigencia: z.coerce.number().int().min(2000).max(2100).optional(),
  vigente: z.coerce.boolean().optional()
});

export const CatalogoPorcentajeFondoIdParamSchema = z.object({
  id: z.coerce.number().int().positive()
});

export const CatalogoPorcentajeFondoTipoParamSchema = z.object({
  tipoFondo: TipoFondoCatalogoSchema
});

export const CreateCatalogoPorcentajeFondoSchema = z.object({
  tipoFondo: TipoFondoCatalogoSchema,
  anioVigencia: z.number().int().min(2000).max(2100),
  porcentajePatron: z.number().min(0).max(1),
  porcentajeAfiliado: z.number().min(0).max(1).nullable().optional(),
  vigente: z.boolean().optional().default(true),
  observaciones: z.string().max(500).nullable().optional()
});

export const UpdateCatalogoPorcentajeFondoSchema = z.object({
  anioVigencia: z.number().int().min(2000).max(2100).optional(),
  porcentajePatron: z.number().min(0).max(1).optional(),
  porcentajeAfiliado: z.number().min(0).max(1).nullable().optional(),
  vigente: z.boolean().optional(),
  observaciones: z.string().max(500).nullable().optional()
}).refine((data) => Object.keys(data).length > 0, {
  message: 'Debe proporcionar al menos un campo para actualizar'
});
