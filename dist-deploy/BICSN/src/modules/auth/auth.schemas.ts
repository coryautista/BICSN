import { z } from 'zod';

const organicaSchema = z.union([z.string(), z.number()]).refine((value) => /^[A-Za-z0-9]{1,2}$/.test(String(value).trim()), {
  message: 'La clave orgánica debe ser alfanumérica de 1 a 2 caracteres'
});

export const RegisterSchema = z.object({
  username: z.string().min(3).max(100),
  email: z.string().email().optional(),
  password: z.string().min(8),
  displayName: z.string().max(255).optional(),
  photoPath: z.string().max(255).optional(),
  idOrganica0: organicaSchema.optional(),
  idOrganica1: organicaSchema.optional(),
  idOrganica2: organicaSchema.optional(),
  idOrganica3: organicaSchema.optional()
});

export const LoginSchema = z.object({
  usernameOrEmail: z.string().min(3),
  password: z.string().min(1)
});
// Auth schemas
