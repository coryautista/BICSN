import { z } from 'zod';

export const RegisterSchema = z.object({
  username: z.string().min(3).max(100),
  email: z.string().email().optional(),
  password: z.string().min(8)
});

export const LoginSchema = z.object({
  usernameOrEmail: z.string().min(3),
  password: z.string().min(8)
});
// Auth schemas