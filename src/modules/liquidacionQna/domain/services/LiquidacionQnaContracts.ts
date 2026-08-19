import { createHash } from 'node:crypto';
import {
  PRECISION_POLICY,
  QNA_DOMAINS,
  type CreateQnaCandidateInput,
  type MoneyA2,
  type QnaSource,
  type QnaTotals,
} from '../entities/LiquidacionQna.js';
import { qnaFail } from '../errors.js';

export const MONEY_A2_PATTERN = /^-?(0|[1-9]\d*)\.\d{2}$/;
export const MONEY_D6_PATTERN = /^-?(0|[1-9]\d*)\.\d{6}$/;
export const HASH_PATTERN = /^[0-9A-F]{64}$/;

function a2Units(value: MoneyA2): bigint {
  if (!MONEY_A2_PATTERN.test(value)) qnaFail('Importe A2 invalido', 'QNA_IMPORTE_A2_INVALIDO', 400);
  const negative = value.startsWith('-');
  const [whole, fraction] = (negative ? value.slice(1) : value).split('.');
  const units = BigInt(whole) * 100n + BigInt(fraction);
  return negative ? -units : units;
}

function assertSum(parent: MoneyA2, children: MoneyA2[], code: string): void {
  if (a2Units(parent) !== children.reduce((sum, value) => sum + a2Units(value), 0n)) {
    qnaFail('Total padre A2 inconsistente', code, 400);
  }
}

export function validateQnaTotals(totals: QnaTotals): void {
  for (const [key, value] of Object.entries(totals)) {
    if (key !== 'registros' && (typeof value !== 'string' || !MONEY_A2_PATTERN.test(value))) {
      qnaFail(`Importe ${key} invalido`, 'QNA_IMPORTE_A2_INVALIDO', 400);
    }
  }
  assertSum(totals.totalAportacionesA2, [
    totals.ahorroA2, totals.viviendaA2, totals.prestacionesA2, totals.cairFondoA2,
    totals.guarderiasA2, totals.transitorioA2, totals.aguinaldoA2,
  ], 'QNA_TOTAL_APORTACIONES_INCONSISTENTE');
  assertSum(totals.totalRetencionesA2, [
    totals.retencionPcpA2, totals.retencionPmpA2, totals.retencionHipA2,
  ], 'QNA_TOTAL_RETENCIONES_INCONSISTENTE');
  assertSum(totals.totalGeneralA2, [totals.totalAportacionesA2, totals.totalRetencionesA2], 'QNA_TOTAL_GENERAL_INCONSISTENTE');
}

export function countCompleteQnaSources(sources: QnaSource[]): number {
  const byDomain = new Map(sources.map(source => [source.dominio, source]));
  if (sources.length !== QNA_DOMAINS.length || byDomain.size !== QNA_DOMAINS.length || QNA_DOMAINS.some(domain => !byDomain.has(domain))) {
    qnaFail('Deben recibirse exactamente las diez fuentes requeridas', 'QNA_FUENTES_INCOMPLETAS', 400);
  }
  return QNA_DOMAINS.reduce((count, domain) => {
    const source = byDomain.get(domain)!;
    const complete = source.requerida && source.estado === 'COMPLETE' && source.registros > 0 && !!source.hashFuente;
    const approvedNotApplicable = source.requerida && source.estado === 'NOT_APPLICABLE'
      && source.registros === 0 && source.notApplicableAprobado && !!source.aprobadoPor && !!source.evidencia;
    return count + (complete || approvedNotApplicable ? 1 : 0);
  }, 0);
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value as Record<string, unknown>).sort()
      .map(key => [key, canonicalize((value as Record<string, unknown>)[key])]));
  }
  return value;
}

export function calculateCanonicalHash(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(canonicalize(value)), 'utf8').digest('hex').toUpperCase();
}

export function canonicalQnaContent(input: CreateQnaCandidateInput): string {
  const content = {
    precisionPolicy: PRECISION_POLICY,
    versionEsquema: 3,
    entidadId: input.entidadId,
    anio: input.anio,
    quincena: input.quincena,
    periodo: `${String(input.quincena).padStart(2, '0')}${String(input.anio).slice(-2)}`,
    organica0: input.organica0,
    organica1: input.organica1,
    organica2: input.organica2,
    organica3: input.organica3,
    ambiente: input.ambiente,
    snapshotCalculoV2Id: input.snapshotCalculoV2Id,
    nominaCargaId: input.nominaCargaId,
    formulaCalculoVersionId: input.formulaCalculoVersionId,
    fuentes: [...input.fuentes].sort((a, b) => a.dominio < b.dominio ? -1 : a.dominio > b.dominio ? 1 : 0),
    totales: input.totales,
    detalles: [...input.detalles].sort((a, b) => (a.dominio < b.dominio ? -1 : a.dominio > b.dominio ? 1 : 0) || a.orden - b.orden),
  };
  return JSON.stringify(canonicalize(content));
}

export function calculateQnaHash(input: CreateQnaCandidateInput): string {
  return createHash('sha256').update(canonicalQnaContent(input), 'utf8').digest('hex').toUpperCase();
}

export function validateQnaCandidate(input: CreateQnaCandidateInput): { completas: number; hashContenido: string } {
  validateQnaTotals(input.totales);
  const completas = countCompleteQnaSources(input.fuentes);
  const detailTotalNames = {
    GUARDERIAS: 'guarderiasA2', TRANSITORIO: 'transitorioA2', AGUINALDO: 'aguinaldoA2',
    PCP: 'retencionPcpA2', PMP: 'retencionPmpA2', HIP: 'retencionHipA2',
  } as const;
  for (const detail of input.detalles) {
    if (!MONEY_D6_PATTERN.test(detail.importeOficialD6) || !HASH_PATTERN.test(detail.claveFilaHash) || !HASH_PATTERN.test(detail.hashFila)) {
      qnaFail('Detalle de fuente invalido', 'QNA_DETALLE_INVALIDO', 400);
    }
    if (detail.hashFila !== calculateCanonicalHash(detail.payloadCanonico)) {
      qnaFail('Hash de fila no coincide con su payload', 'QNA_HASH_FILA_INCONSISTENTE', 400);
    }
  }
  for (const [domain, totalName] of Object.entries(detailTotalNames)) {
    const source = input.fuentes.find(item => item.dominio === domain)!;
    const details = input.detalles.filter(item => item.dominio === domain);
    if (details.length !== source.registros || details.some(item => item.sourceScale !== source.sourceScale)) {
      qnaFail(`Detalle ${domain} no coincide con su fuente`, 'QNA_DETALLE_FUENTE_INCONSISTENTE', 400);
    }
    if (d6ValuesToA2(details.map(item => item.importeOficialD6)) !== input.totales[totalName]) {
      qnaFail(`Total ${domain} no coincide con su detalle`, 'QNA_DETALLE_TOTAL_INCONSISTENTE', 400);
    }
    if (source.estado === 'COMPLETE') {
      const sourceHash = calculateCanonicalHash([...details]
        .sort((left, right) => left.claveFilaHash.localeCompare(right.claveFilaHash) || left.hashFila.localeCompare(right.hashFila))
        .map(item => [item.claveFilaHash, item.hashFila]));
      if (source.hashFuente !== sourceHash) qnaFail(`Hash de fuente ${domain} inconsistente`, 'QNA_HASH_FUENTE_INCONSISTENTE', 400);
    }
  }
  return { completas, hashContenido: calculateQnaHash(input) };
}

function d6ValuesToA2(values: string[]): string {
  const micros = values.reduce((sum, value) => {
    const negative = value.startsWith('-');
    const [whole, fraction] = (negative ? value.slice(1) : value).split('.');
    const units = BigInt(whole) * 1_000_000n + BigInt(fraction);
    return sum + (negative ? -units : units);
  }, 0n);
  const cents = micros / 10_000n;
  const negative = cents < 0n;
  const absolute = negative ? -cents : cents;
  return `${negative ? '-' : ''}${absolute / 100n}.${String(absolute % 100n).padStart(2, '0')}`;
}
