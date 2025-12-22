import { z } from 'zod';

// Schema for registering an organizational affectation
export const RegisterAfectacionOrgSchema = z.object({
  fecha: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: 'Fecha must be a valid date string'
  }).optional(),
  entidad: z.string().default('AFILIADOS'),
  anio: z.number().int().min(2000).max(2100, 'Anio must be between 2000 and 2100'),
  quincena: z.number().int().min(1).max(24, 'Quincena must be between 1 and 24'),
  orgNivel: z.number().int().min(0).max(3, 'OrgNivel must be between 0 and 3').default(3),
  org0: z.string().length(2, 'Org0 must be exactly 2 characters'),
  org1: z.string().length(2, 'Org1 must be exactly 2 characters').optional(),
  org2: z.string().length(2, 'Org2 must be exactly 2 characters').optional(),
  org3: z.string().length(2, 'Org3 must be exactly 2 characters').optional(),
  accion: z.string().default('APLICAR'),
  resultado: z.string().default('OK'),
  mensaje: z.string().optional(),
  usuario: z.string().min(1, 'Usuario is required'),
  appName: z.string().min(1, 'AppName is required'),
  ip: z.string().min(1, 'IP is required')
}).refine(data => {
  // Validate org levels based on orgNivel
  if (data.orgNivel === 0) {
    return data.org1 === undefined && data.org2 === undefined && data.org3 === undefined;
  } else if (data.orgNivel === 1) {
    return data.org1 !== undefined && data.org2 === undefined && data.org3 === undefined;
  } else if (data.orgNivel === 2) {
    return data.org1 !== undefined && data.org2 !== undefined && data.org3 === undefined;
  } else if (data.orgNivel === 3) {
    return data.org1 !== undefined && data.org2 !== undefined && data.org3 !== undefined;
  }
  return false;
}, {
  message: 'Org levels must match orgNivel constraints'
});

// Query schemas for filters
export const AfectacionOrgQuerySchema = z.object({
  entidad: z.string().optional(),
  anio: z.string().transform(val => val ? parseInt(val) : undefined).optional(),
  orgNivel: z.string().transform(val => val ? parseInt(val) : undefined).optional(),
  org0: z.string().optional(),
  org1: z.string().optional(),
  org2: z.string().optional(),
  org3: z.string().optional(),
  usuario: z.string().optional(),
  limit: z.string().transform(val => val ? parseInt(val) : 100).optional(),
  offset: z.string().transform(val => val ? parseInt(val) : 0).optional()
});

export const AfectacionOrgParamsSchema = z.object({
  entidad: z.string().optional(),
  anio: z.string().transform(val => val ? parseInt(val) : undefined).optional(),
  quincena: z.string().transform(val => val ? parseInt(val) : undefined).optional(),
  orgNivel: z.string().transform(val => val ? parseInt(val) : undefined).optional(),
  org0: z.string().optional(),
  org1: z.string().optional(),
  org2: z.string().optional(),
  org3: z.string().optional()
});

// Schema for calculating quincena from date
export const CalculateQuincenaSchema = z.object({
  fecha: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: 'Fecha must be a valid date string'
  })
});

// Response schema for quincena alta afectacion
export const QuincenaAltaAfectacionResponseSchema = z.object({
  anio: z.number(),
  mes: z.number(),
  quincena: z.number(),
  fechaActual: z.string(),
  descripcion: z.string(),
  esNueva: z.boolean()
});