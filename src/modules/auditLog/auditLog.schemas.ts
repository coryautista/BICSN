import { z } from 'zod';

export const GetAuditLogsSchema = z.object({
  fechaInicio: z.string().datetime(),
  fechaFin: z.string().datetime()
});