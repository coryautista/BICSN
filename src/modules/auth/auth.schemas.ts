import { z } from 'zod';

export const RegisterSchema = z.object({
  username: z.string().min(3).max(100),
  email: z.string().email().optional(),
  password: z.string().min(8),
  displayName: z.string().max(255).optional(),
  photoPath: z.string().max(255).optional(),
  idOrganica0: z.number().int().optional(),
  idOrganica1: z.number().int().optional(),
  idOrganica2: z.number().int().optional(),
  idOrganica3: z.number().int().optional()
});

export const LoginSchema = z.object({
  usernameOrEmail: z.string().min(3),
  password: z.string().min(8)
});
// Auth schemas