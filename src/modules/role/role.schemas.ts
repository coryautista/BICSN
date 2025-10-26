import { z } from 'zod';

export const CreateRoleSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  isSystem: z.boolean().optional(),
  isEntidad: z.boolean().optional()
});

export const AssignRoleSchema = z.object({
  userId: z.string().uuid(),
  roleName: z.string().min(1).max(100)
});

export const UnassignRoleSchema = z.object({
  userId: z.string().uuid(),
  roleName: z.string().min(1).max(100)
});

export const UpdateRoleSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  isEntidad: z.boolean().optional()
});
// Role schemas
