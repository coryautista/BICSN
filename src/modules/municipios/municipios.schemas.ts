import { z } from 'zod';

export const CreateMunicipioSchema = z.object({
  estadoId: z.string().length(2, 'EstadoID must be exactly 2 characters'),
  claveMunicipio: z.string().length(3, 'ClaveMunicipio must be exactly 3 characters'),
  nombreMunicipio: z.string().min(1, 'NombreMunicipio is required').max(100, 'NombreMunicipio must be at most 100 characters'),
  esValido: z.boolean().default(false)
});

export const UpdateMunicipioSchema = z.object({
  nombreMunicipio: z.string().min(1, 'NombreMunicipio is required').max(100, 'NombreMunicipio must be at most 100 characters').optional(),
  esValido: z.boolean().optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update'
});

export const MunicipioIdParamSchema = z.object({
  municipioId: z.string().regex(/^\d+$/, 'MunicipioID must be a number').transform(val => parseInt(val))
});

export const EstadoIdParamSchema = z.object({
  estadoId: z.string().length(2, 'EstadoID must be exactly 2 characters')
});