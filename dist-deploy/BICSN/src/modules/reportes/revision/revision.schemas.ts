import { z } from 'zod';

const claveOrganica = z.string().regex(/^\d{1,2}$/).transform((value) => value.padStart(2, '0'));

export const ReporteRevisionQuerySchema = z.object({
  periodo: z.string()
    .regex(/^\d{4}$/, 'periodo debe tener formato QQAA')
    .refine((value) => {
      const quincena = Number(value.slice(0, 2));
      return quincena >= 1 && quincena <= 24;
    }, 'periodo debe contener una QNA entre 01 y 24'),
  org0: claveOrganica.optional(),
  org1: claveOrganica.optional(),
  org2: claveOrganica.optional(),
  org3: claveOrganica.optional()
});

export type ReporteRevisionQuery = z.infer<typeof ReporteRevisionQuerySchema>;

const importeRevision = z.number().finite().multipleOf(0.01);

export const GuardarAjusteRevisionBodySchema = z.object({
  periodo: z.string()
    .regex(/^\d{4}$/, 'periodo debe tener formato QQAA')
    .refine((value) => {
      const quincena = Number(value.slice(0, 2));
      return quincena >= 1 && quincena <= 24;
    }, 'periodo debe contener una QNA entre 01 y 24'),
  org0: claveOrganica,
  org1: claveOrganica,
  org2: claveOrganica.optional(),
  org3: claveOrganica.optional(),
  cair: importeRevision,
  fra: importeRevision,
  fre: importeRevision,
  fh: importeRevision,
  fv: importeRevision,
  faa: importeRevision,
  fae: importeRevision,
  fat: importeRevision,
  fai: importeRevision
});

export type GuardarAjusteRevisionBody = z.infer<typeof GuardarAjusteRevisionBodySchema>;
