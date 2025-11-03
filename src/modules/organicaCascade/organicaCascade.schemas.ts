import { z } from 'zod';

// Schema for Organica0 children (returns Organica1)
export const Organica0ChildrenParamsSchema = z.object({
  claveOrganica0: z.string().min(1, 'claveOrganica0 is required')
});

// Schema for Organica1 children (returns Organica2)
export const Organica1ChildrenParamsSchema = z.object({
  claveOrganica0: z.string().min(1, 'claveOrganica0 is required'),
  claveOrganica1: z.string().min(1, 'claveOrganica1 is required')
});

// Schema for Organica2 children (returns Organica3)
export const Organica2ChildrenParamsSchema = z.object({
  claveOrganica0: z.string().min(1, 'claveOrganica0 is required'),
  claveOrganica1: z.string().min(1, 'claveOrganica1 is required'),
  claveOrganica2: z.string().min(1, 'claveOrganica2 is required')
});

export type Organica0ChildrenParams = z.infer<typeof Organica0ChildrenParamsSchema>;
export type Organica1ChildrenParams = z.infer<typeof Organica1ChildrenParamsSchema>;
export type Organica2ChildrenParams = z.infer<typeof Organica2ChildrenParamsSchema>;
