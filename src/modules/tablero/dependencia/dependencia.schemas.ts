import { z } from 'zod';

export const CreateDependenciaSchema = z.object({
  nombre: z.string().min(1, 'Nombre is required').max(200, 'Nombre must be at most 200 characters'),
  descripcion: z.string().min(1, 'Descripcion is required').max(1000, 'Descripcion must be at most 1000 characters'),
  tipoDependencia: z.enum(['SECRETARIA', 'DIRECCION_GENERAL', 'DIRECCION', 'DEPARTAMENTO', 'UNIDAD', 'OFICINA']),
  idDependenciaPadre: z.number().int().positive().optional(),
  claveDependencia: z.string().min(1, 'ClaveDependencia is required').max(20, 'ClaveDependencia must be at most 20 characters'),
  responsable: z.string().max(200, 'Responsable must be at most 200 characters').optional(),
  telefono: z.string().max(50, 'Telefono must be at most 50 characters').optional(),
  email: z.string().email('Email must be a valid email address').optional(),
  esActiva: z.boolean().default(true)
});

export const UpdateDependenciaSchema = z.object({
  nombre: z.string().min(1, 'Nombre is required').max(200, 'Nombre must be at most 200 characters').optional(),
  descripcion: z.string().min(1, 'Descripcion is required').max(1000, 'Descripcion must be at most 1000 characters').optional(),
  tipoDependencia: z.enum(['SECRETARIA', 'DIRECCION_GENERAL', 'DIRECCION', 'DEPARTAMENTO', 'UNIDAD', 'OFICINA']).optional(),
  idDependenciaPadre: z.number().int().positive().optional(),
  claveDependencia: z.string().min(1, 'ClaveDependencia is required').max(20, 'ClaveDependencia must be at most 20 characters').optional(),
  responsable: z.string().max(200, 'Responsable must be at most 200 characters').optional(),
  telefono: z.string().max(50, 'Telefono must be at most 50 characters').optional(),
  email: z.string().email('Email must be a valid email address').optional(),
  esActiva: z.boolean().optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update'
});

export const DependenciaIdParamSchema = z.object({
  dependenciaId: z.string().regex(/^\d+$/, 'DependenciaID must be a number').transform(val => parseInt(val))
});

export const TipoDependenciaParamSchema = z.object({
  tipoDependencia: z.enum(['SECRETARIA', 'DIRECCION_GENERAL', 'DIRECCION', 'DEPARTAMENTO', 'UNIDAD', 'OFICINA'])
});