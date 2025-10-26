import { z } from 'zod';

export const CreateRoleMenuSchema = z.object({
  roleId: z.string().uuid(),
  menuId: z.number().int(),
  createdAt: z.string().datetime().optional().default(() => new Date().toISOString())
});

export const UpdateRoleMenuSchema = z.object({
  roleId: z.string().uuid().optional(),
  menuId: z.number().int().optional(),
  createdAt: z.string().datetime().optional()
});

export const RoleMenuIdSchema = z.object({
  id: z.number().int()
});

export const AssignRoleMenuSchema = z.object({
  roleId: z.string().uuid(),
  menuId: z.number().int()
});

export const UnassignRoleMenuSchema = z.object({
  roleId: z.string().uuid(),
  menuId: z.number().int()
});