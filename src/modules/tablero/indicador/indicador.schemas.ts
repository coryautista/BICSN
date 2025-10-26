import { z } from 'zod';

export const CreateIndicadorSchema = z.object({
  idPrograma: z.number().int().positive('idPrograma must be a positive integer'),
  idUnidadMedida: z.number().int().positive('idUnidadMedida must be a positive integer').optional(),
  idDimension: z.number().int().positive('idDimension must be a positive integer').optional(),
  nombre: z.string().min(1, 'Nombre is required').max(500, 'Nombre must be at most 500 characters'),
  descripcion: z.string().min(1, 'Descripcion is required').max(5000, 'Descripcion must be at most 5000 characters'),
  tipoIndicador: z.enum(['PORCENTAJE', 'NUMERICO', 'MONETARIO', 'BOOLEANO']),
  frecuenciaMedicion: z.enum(['MENSUAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL']),
  meta: z.number().optional(),
  sentido: z.enum(['ASCENDENTE', 'DESCENDENTE']),
  formula: z.string().max(1000, 'Formula must be at most 1000 characters').optional(),
  fuenteDatos: z.string().max(500, 'FuenteDatos must be at most 500 characters').optional(),
  responsable: z.string().max(200, 'Responsable must be at most 200 characters').optional(),
  observaciones: z.string().max(2000, 'Observaciones must be at most 2000 characters').optional()
});

export const UpdateIndicadorSchema = z.object({
  idUnidadMedida: z.number().int().positive('idUnidadMedida must be a positive integer').optional(),
  idDimension: z.number().int().positive('idDimension must be a positive integer').optional(),
  nombre: z.string().min(1, 'Nombre is required').max(500, 'Nombre must be at most 500 characters').optional(),
  descripcion: z.string().min(1, 'Descripcion is required').max(5000, 'Descripcion must be at most 5000 characters').optional(),
  tipoIndicador: z.enum(['PORCENTAJE', 'NUMERICO', 'MONETARIO', 'BOOLEANO']).optional(),
  frecuenciaMedicion: z.enum(['MENSUAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL']).optional(),
  meta: z.number().optional(),
  sentido: z.enum(['ASCENDENTE', 'DESCENDENTE']).optional(),
  formula: z.string().max(1000, 'Formula must be at most 1000 characters').optional(),
  fuenteDatos: z.string().max(500, 'FuenteDatos must be at most 500 characters').optional(),
  responsable: z.string().max(200, 'Responsable must be at most 200 characters').optional(),
  observaciones: z.string().max(2000, 'Observaciones must be at most 2000 characters').optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update'
});

export const IndicadorIdParamSchema = z.object({
  indicadorId: z.string().regex(/^\d+$/, 'IndicadorID must be a number').transform(val => parseInt(val))
});

export const ProgramaIdParamSchema = z.object({
  programaId: z.string().regex(/^\d+$/, 'ProgramaID must be a number').transform(val => parseInt(val))
});

export const EjeIdParamSchema = z.object({
  ejeId: z.string().regex(/^\d+$/, 'EjeID must be a number').transform(val => parseInt(val))
});

export const LineaEstrategicaIdParamSchema = z.object({
  lineaEstrategicaId: z.string().regex(/^\d+$/, 'LineaEstrategicaID must be a number').transform(val => parseInt(val))
});