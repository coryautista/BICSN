import { z } from 'zod';

export const MovimientoSchema = z.object({
  id: z.number().int(),
  quincenaId: z.string().max(30).nullable(),
  tipoMovimientoId: z.number().int(),
  afiliadoId: z.number().int(),
  fecha: z.string().date().nullable(),
  observaciones: z.string().max(1024).nullable(),
  folio: z.string().max(100).nullable(),
  estatus: z.string().max(30).nullable(),
  creadoPor: z.number().int().nullable(),
  creadoPorUid: z.string().uuid().nullable(),
  createdAt: z.string().datetime()
});

export const CreateMovimientoSchema = z.object({
  quincenaId: z.string().max(30).nullable().optional(),
  tipoMovimientoId: z.number().int(),
  afiliadoId: z.number().int(),
  fecha: z.string().date().nullable().optional(),
  observaciones: z.string().max(1024).nullable().optional(),
  folio: z.string().max(100).nullable().optional(),
  estatus: z.string().max(30).nullable().optional(),
  creadoPor: z.number().int().nullable().optional(),
  creadoPorUid: z.string().uuid().optional()
});

export const UpdateMovimientoSchema = z.object({
  quincenaId: z.string().max(30).nullable().optional(),
  tipoMovimientoId: z.number().int().optional(),
  afiliadoId: z.number().int().optional(),
  fecha: z.string().date().nullable().optional(),
  observaciones: z.string().max(1024).nullable().optional(),
  folio: z.string().max(100).nullable().optional(),
  estatus: z.string().max(30).nullable().optional(),
  creadoPor: z.number().int().nullable().optional(),
  creadoPorUid: z.string().uuid().optional()
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' }
);