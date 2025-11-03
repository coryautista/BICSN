import { z } from 'zod';

export const CreateCategoriaPuestoOrgSchema = z.object({
  nivel: z.number().int().min(0).max(3, 'Nivel must be between 0 and 3'),
  org0: z.string().length(2, 'Org0 must be exactly 2 characters'),
  org1: z.string().length(2, 'Org1 must be exactly 2 characters'),
  org2: z.string().length(2, 'Org2 must be exactly 2 characters').optional(),
  org3: z.string().length(2, 'Org3 must be exactly 2 characters').optional(),
  categoria: z.string().max(10, 'Categoria must be at most 10 characters'),
  nombreCategoria: z.string().max(80, 'NombreCategoria must be at most 80 characters'),
  ingresoBrutoMensual: z.number().positive('IngresoBrutoMensual must be positive'),
  vigenciaInicio: z.string().datetime({ offset: true }),
  vigenciaFin: z.string().datetime({ offset: true }).optional()
}).refine(data => {
  if (data.nivel === 0) {
    return data.org2 === undefined && data.org3 === undefined;
  } else if (data.nivel === 1) {
    return data.org2 === undefined && data.org3 === undefined;
  } else if (data.nivel === 2) {
    return data.org2 !== undefined && data.org3 === undefined;
  } else if (data.nivel === 3) {
    return data.org2 !== undefined && data.org3 !== undefined;
  }
  return false;
}, {
  message: 'Org fields must match the nivel constraints'
});

export const UpdateCategoriaPuestoOrgSchema = z.object({
  nombreCategoria: z.string().max(80, 'NombreCategoria must be at most 80 characters').optional(),
  ingresoBrutoMensual: z.number().positive('IngresoBrutoMensual must be positive').optional(),
  vigenciaFin: z.string().datetime({ offset: true }).optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update'
});

export const CategoriaPuestoOrgIdParamSchema = z.object({
  categoriaPuestoOrgId: z.number().int().positive('CategoriaPuestoOrgId must be a positive integer')
});

export const ListCategoriaPuestoOrgQuerySchema = z.object({
  nivel: z.string().optional(),
  org0: z.string().optional(),
  org1: z.string().optional(),
  org2: z.string().optional(),
  org3: z.string().optional(),
  vigenciaInicio: z.string().optional(),
  categoria: z.string().optional()
});