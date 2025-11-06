import { z } from 'zod';

export const CreateUsuarioSchema = z.object({
  usuarioId: z.string().uuid('UsuarioID must be a valid UUID').optional(),
  nombre: z.string().min(1, 'Nombre is required').max(100, 'Nombre must be at most 100 characters'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  roleId: z.string().uuid('RoleID must be a valid UUID'),
  esActivo: z.boolean().default(true),
  phoneNumber: z.string().min(1, 'PhoneNumber is required'),
  idOrganica0: z.string().min(1, 'IdOrganica0 is required'),
  idOrganica1: z.string().min(1, 'IdOrganica1 is required'),
  idOrganica2: z.string().optional(),
  idOrganica3: z.string().optional()
});

export const UpdateUsuarioSchema = z.object({
  nombre: z.string().min(1, 'Nombre is required').max(100, 'Nombre must be at most 100 characters').optional(),
  email: z.string().email('Invalid email format').optional(),
  roleId: z.string().uuid('RoleID must be a valid UUID').optional(),
  esActivo: z.boolean().optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update'
});

export const UsuarioIdParamSchema = z.object({
  usuarioId: z.string().min(1, 'UsuarioID is required')
});

export const LoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
});