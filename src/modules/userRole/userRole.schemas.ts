import { z } from 'zod';

export const CreateUserRoleSchema = z.object({
  usuarioId: z.string().min(1, 'UsuarioID is required'),
  roleId: z.string().min(1, 'RoleID is required'),
  esActivo: z.boolean().default(true)
});

export const UpdateUserRoleSchema = z.object({
  esActivo: z.boolean().optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update'
});

export const UserRoleIdParamSchema = z.object({
  usuarioId: z.string().min(1, 'UsuarioID is required'),
  roleId: z.string().min(1, 'RoleID is required')
});

export const UsuarioIdParamSchema = z.object({
  usuarioId: z.string().min(1, 'UsuarioID is required')
});