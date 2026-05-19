import { z } from 'zod';

export const CreateCategoriaPuestoOrgSchema = z.object({
  nivel: z.number().int().min(0).max(3, 'El nivel debe estar entre 0 y 3'),
  org0: z.string().length(2, 'Org0 debe tener exactamente 2 caracteres'),
  org1: z.string().length(2, 'Org1 debe tener exactamente 2 caracteres'),
  org2: z.string().length(2, 'Org2 debe tener exactamente 2 caracteres').optional(),
  org3: z.string().length(2, 'Org3 debe tener exactamente 2 caracteres').optional(),
  categoria: z.string().max(200, 'La categoría no debe exceder 200 caracteres'),
  nombreCategoria: z.string().max(200, 'El nombre de categoría no debe exceder 200 caracteres'),
  ingresoBrutoMensual: z.number().positive('El ingreso bruto mensual debe ser mayor a 0'),
  vigenciaInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha de inicio de vigencia debe tener formato YYYY-MM-DD'),
  vigenciaFin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha de fin de vigencia debe tener formato YYYY-MM-DD').optional(),
  baseConfianza: z.string().length(1, 'BaseConfianza debe tener exactamente 1 carácter').optional(),
  porcentaje: z.number().int().min(0).max(100, 'El porcentaje debe estar entre 0 y 100').optional()
}).refine(data => {
  if (data.nivel === 0) {
    return (data.org2 === undefined || data.org2 === "") && (data.org3 === undefined || data.org3 === "");
  } else if (data.nivel === 1) {
    return (data.org2 === undefined || data.org2 === "") && (data.org3 === undefined || data.org3 === "");
  } else if (data.nivel === 2) {
    return data.org2 !== undefined && data.org2 !== "" && (data.org3 === undefined || data.org3 === "");
  } else if (data.nivel === 3) {
    return data.org2 !== undefined && data.org2 !== "" && data.org3 !== undefined && data.org3 !== "";
  }
  return false;
}, {
  message: 'Los campos org deben coincidir con las restricciones del nivel'
});

export const UpdateCategoriaPuestoOrgSchema = z.object({
  nombreCategoria: z.string().max(200, 'El nombre de categoría no debe exceder 200 caracteres').optional(),
  ingresoBrutoMensual: z.number().positive('El ingreso bruto mensual debe ser mayor a 0').optional(),
  vigenciaFin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha de fin de vigencia debe tener formato YYYY-MM-DD').optional(),
  baseConfianza: z.string().length(1, 'BaseConfianza debe tener exactamente 1 carácter').optional(),
  porcentaje: z.number().int().min(0).max(100, 'El porcentaje debe estar entre 0 y 100').optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'Debe proporcionar al menos un campo para actualizar'
});

export const CategoriaPuestoOrgIdParamSchema = z.object({
  categoriaPuestoOrgId: z.number().int().positive('El ID de categoría de puesto orgánico debe ser un número entero positivo')
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