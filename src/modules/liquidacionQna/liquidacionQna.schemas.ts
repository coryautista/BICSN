import { z } from 'zod';
import { HASH_PATTERN, MONEY_A2_PATTERN, MONEY_D6_PATTERN } from './domain/services/LiquidacionQnaContracts.js';
import { QNA_DOMAINS } from './domain/entities/LiquidacionQna.js';

const id = z.string().regex(/^[1-9]\d*$/);
const organica = z.string().regex(/^\d{2}$/);
const moneyA2 = z.string().regex(MONEY_A2_PATTERN);
const hash = z.string().regex(HASH_PATTERN);

const sourceSchema = z.object({
  dominio: z.enum(QNA_DOMAINS),
  tipoFuente: z.enum(['TXT_NOMINA', 'FIREBIRD', 'SQL_HISTORICO', 'MOVIMIENTO']),
  estado: z.enum(['COMPLETE', 'EMPTY', 'NOT_APPLICABLE', 'ERROR']),
  requerida: z.boolean(),
  identificadorFuente: z.string().min(1).max(300),
  hashFuente: hash.nullable(),
  sourceScale: z.union([z.literal(2), z.literal(6)]),
  registros: z.number().int().min(0),
  notApplicableAprobado: z.boolean(),
  aprobadoPor: z.string().min(1).max(100).nullable(),
  evidencia: z.string().min(1).max(500).nullable(),
  errorCode: z.string().min(1).max(100).nullable(),
}).strict().superRefine((source, context) => {
  const valid = (source.estado === 'COMPLETE' && source.registros > 0 && source.hashFuente !== null)
    || (source.estado === 'EMPTY' && source.registros === 0)
    || (source.estado === 'NOT_APPLICABLE' && source.registros === 0 && source.notApplicableAprobado
      && source.aprobadoPor !== null && source.evidencia !== null)
    || (source.estado === 'ERROR' && source.errorCode !== null);
  if (!valid) context.addIssue({ code: 'custom', message: 'Contrato de estado de fuente invalido' });
});

const totalsSchema = z.object({
  registros: z.number().int().min(0),
  cairA2: moneyA2, fraA2: moneyA2, freA2: moneyA2, fhA2: moneyA2, fvA2: moneyA2,
  faaA2: moneyA2, faeA2: moneyA2, fatA2: moneyA2, faiA2: moneyA2,
  ahorroA2: moneyA2, viviendaA2: moneyA2, prestacionesA2: moneyA2, cairFondoA2: moneyA2,
  guarderiasA2: moneyA2, transitorioA2: moneyA2, aguinaldoA2: moneyA2,
  retencionPcpA2: moneyA2, retencionPmpA2: moneyA2, retencionHipA2: moneyA2,
  totalAportacionesA2: moneyA2, totalRetencionesA2: moneyA2, totalGeneralA2: moneyA2,
}).strict();

const detailSchema = z.object({
  dominio: z.enum(['GUARDERIAS', 'TRANSITORIO', 'AGUINALDO', 'PCP', 'PMP', 'HIP']),
  orden: z.number().int().positive(),
  claveFilaHash: hash,
  sourceScale: z.union([z.literal(2), z.literal(6)]),
  importeOficialD6: z.string().regex(MONEY_D6_PATTERN),
  payloadCanonico: z.record(z.string(), z.unknown()),
  hashFila: hash,
}).strict();

export const CreateQnaCandidateSchema = z.object({
  entidadId: z.number().int().positive(),
  anio: z.number().int().min(2000).max(9999),
  quincena: z.number().int().min(1).max(24),
  organica0: organica, organica1: organica, organica2: organica, organica3: organica,
  ambiente: z.enum(['DESARROLLO', 'CALIDAD', 'PRODUCCION']),
  snapshotCalculoV2Id: id.nullish().transform(value => value ?? null),
  nominaCargaId: id.nullish().transform(value => value ?? null),
  formulaCalculoVersionId: id.nullish().transform(value => value ?? null),
  fuentes: z.array(sourceSchema).length(10),
  totales: totalsSchema,
  detalles: z.array(detailSchema).max(100000).default([]),
}).strict();

export const QnaIdParamsSchema = z.object({ id }).strict();
export const QnaDecisionSchema = z.object({
  decision: z.enum(['APROBADO', 'OBSERVADO']),
  comentario: z.string().trim().min(1).max(1000).nullable().default(null),
}).strict().superRefine((value, context) => {
  if (value.decision === 'OBSERVADO' && value.comentario === null) {
    context.addIssue({ code: 'custom', message: 'OBSERVADO requiere comentario' });
  }
});
export const QnaPromoteSchema = z.object({ motivo: z.string().trim().min(1).max(500).nullable().default(null) }).strict();
export const QnaListSchema = z.object({
  pagina: z.coerce.number().int().positive().default(1),
  tamanio: z.coerce.number().int().min(1).max(100).default(20),
  entidadId: z.coerce.number().int().positive().optional(),
  anio: z.coerce.number().int().min(2000).max(9999).optional(),
  quincena: z.coerce.number().int().min(1).max(24).optional(),
  estado: z.enum(['COMPLETO', 'INCOMPLETO']).optional(),
}).strict();
