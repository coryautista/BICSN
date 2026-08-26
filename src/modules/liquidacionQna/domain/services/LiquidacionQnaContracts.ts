import { createHash } from 'node:crypto';
import {
  PRECISION_POLICY,
  QNA_DOMAINS,
  type CreateQnaCandidateInput,
  type MoneyA2,
  type QnaEmployeeDetail,
  type QnaSource,
  type QnaSourceDetail,
  type QnaTotals,
} from '../entities/LiquidacionQna.js';
import { qnaFail } from '../errors.js';
import { QNA_AUXILIARY_PAYLOAD_V1_FIELDS } from './QnaAuxiliaryPayloadV1.js';
import { env } from '../../../../config/env.js';

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
  assertSum(totals.fatA2, [totals.faaA2, totals.faeA2], 'QNA_TOTAL_FAT_INCONSISTENTE');
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
    versionEsquema: input.versionEsquema ?? 4,
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
    ...((input.versionEsquema ?? 4) >= 5
      ? { detallesEmpleado: [...(input.detallesEmpleado ?? [])].sort((a, b) => a.orden - b.orden) }
      : {}),
  };
  return JSON.stringify(canonicalize(content));
}

export function calculateQnaHash(input: CreateQnaCandidateInput): string {
  return createHash('sha256').update(canonicalQnaContent(input), 'utf8').digest('hex').toUpperCase();
}

export type QnaValidationOptions = { retentionProvenanceMode?: 'CURRENT_POLICY' | 'PERSISTED_HISTORICAL' };

export function validateQnaCandidate(input: CreateQnaCandidateInput, options: QnaValidationOptions = {}): { completas: number; hashContenido: string } {
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
  if ((input.versionEsquema ?? 4) >= 5) {
    if (!input.detallesEmpleado || input.detallesEmpleado.length !== input.totales.registros) {
      qnaFail('Proyeccion legible V5 incompleta', 'QNA_DETALLE_V5_INCOMPLETO', 400);
    }
    for (const detail of input.detallesEmpleado) {
      if (!HASH_PATTERN.test(detail.empleadoClaveHash) || !HASH_PATTERN.test(detail.hashFila)
          || detail.hashFila !== calculateQnaEmployeeDetailHash(detail)) {
        qnaFail('Hash de proyeccion V5 inconsistente', 'QNA_HASH_DETALLE_V5_INCONSISTENTE', 400);
      }
    }
    validateQnaAuxiliaryEmployeeProjection(input.detalles, input.detallesEmpleado);
    validateQnaRetentionSemantics(input.detalles, input.fuentes, {
      ambiente: input.ambiente, anio: input.anio, quincena: input.quincena,
      organica0: input.organica0, organica1: input.organica1,
    }, env.qna.hipLegacyPeriods, options);
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

export type QnaRetentionProvenanceContext = Pick<CreateQnaCandidateInput,
  'ambiente' | 'anio' | 'quincena' | 'organica0' | 'organica1'>;

export function validateQnaRetentionSemantics(
  details: QnaSourceDetail[],
  sources: QnaSource[],
  context: QnaRetentionProvenanceContext,
  hipLegacyPeriods: string[] | null,
  options: QnaValidationOptions = {},
): void {
  const sqlInt = { min: -2147483648, max: 2147483647 } as const;
  const sqlSmallInt = { min: -32768, max: 32767 } as const;
  const definitions = {
    PCP: { procedure: 'AP_S_PCP', key: ['interno', 'prestamo', 'letra'], amount: 'total_d6',
      components: ['capital_d6', 'interes_d6', 'monto_d6', 'moratorios_d6'],
      integers: [['prestamo', sqlInt], ['letra', sqlInt], ['plazo', sqlInt]] },
    PMP: { procedure: 'AP_S_VIV', key: ['interno', 'prestamo', 'letra', 'folio'], amount: 'total_d6',
      components: ['capital_d6', 'moratorios_d6', 'interes_d6', 'seguro_d6'],
      integers: [['prestamo', sqlInt], ['letra', sqlInt], ['plazo', sqlInt], ['folio', sqlInt]] },
    HIP: { procedure: null, key: ['interno', 'pno_solicitud', 'pano'], amount: 'cantidad_d6',
      components: ['descto_d6', 'capital_pagar_d6', 'interes_pagar_d6', 'interes_diferido_pagar_d6', 'seguro_pagar_d6', 'moratorio_pagar_d6'],
      integers: [['pno_solicitud', sqlInt], ['pano', sqlSmallInt], ['plazo', sqlInt]] },
  } as const;
  const historical = options.retentionProvenanceMode === 'PERSISTED_HISTORICAL';
  if (!historical && hipLegacyPeriods === null) qnaFail('Politica HIP no configurada', 'QNA_HIP_POLICY_NOT_CONFIGURED', 500);
  const periodo = `${String(context.quincena).padStart(2, '0')}${String(context.anio).slice(-2)}`;
  for (const [domain, definition] of Object.entries(definitions)) {
    const source = sources.find((item) => item.dominio === domain);
    if (!source) qnaFail(`Fuente ${domain} faltante`, 'QNA_RETENCION_SEMANTICA_INVALIDA', 400);
    if (source.sourceScale !== 2 || source.tipoFuente !== 'FIREBIRD') {
      qnaFail(`Fuente ${domain} incompatible`, 'QNA_RETENCION_SEMANTICA_INVALIDA', 400);
    }
    const procedure = domain === 'HIP'
      ? (historical ? null : (hipLegacyPeriods!.includes(periodo) ? 'AP_S_COMP_QNA' : 'AP_S_HIP_QNA'))
      : definition.procedure;
    const expectedIdentifiers = domain === 'HIP' && historical
      ? ['AP_S_HIP_QNA','AP_S_COMP_QNA'].map(item => `FIREBIRD:${item}:${context.ambiente}:${periodo}:${context.organica0}:${context.organica1}`)
      : [`FIREBIRD:${procedure}:${context.ambiente}:${periodo}:${context.organica0}:${context.organica1}`];
    if (!expectedIdentifiers.includes(source.identificadorFuente)) {
      qnaFail(`Procedencia ${domain} inconsistente`, domain === 'HIP'
        ? 'QNA_RETENCION_HIP_PROCEDIMIENTO_INVALIDO' : 'QNA_RETENCION_PROCEDENCIA_INVALIDA', 400);
    }
    const expectedFields = [...QNA_AUXILIARY_PAYLOAD_V1_FIELDS[domain as keyof typeof definitions]].sort();
    for (const detail of details.filter((item) => item.dominio === domain)) {
      const payload = detail.payloadCanonico;
      if (detail.payloadVersion !== 1 || detail.sourceScale !== 2
          || Object.keys(payload).sort().join('|') !== expectedFields.join('|')) {
        qnaFail(`Payload V1 ${domain} incompatible`, 'QNA_RETENCION_PAYLOAD_INVALIDO', 400);
      }
      const interno = payload.interno;
      if (!isSqlInteger(interno, sqlInt) || Number(interno) <= 0 || detail.empleadoClave !== String(interno)
          || detail.nombre !== payload.nombre || (detail.rfc ?? null) !== (payload.rfc ?? null)) {
        qnaFail(`Identidad ${domain} inconsistente`, 'QNA_RETENCION_IDENTIDAD_INVALIDA', 400);
      }
      for (const [field, range] of definition.integers) {
        const value = payload[field];
        if (value !== null && !isSqlInteger(value, range)) {
          qnaFail(`Entero ${domain}.${field} fuera del tipo SQL destino`, 'QNA_RETENCION_ENTERO_SQL_INVALIDO', 400);
        }
      }
      const key = definition.key.map((field) => payload[field]);
      if (definition.key.slice(1).some((field) => payload[field] !== null && !Number.isInteger(payload[field]))) {
        qnaFail(`Clave ${domain} invalida`, 'QNA_RETENCION_CLAVE_INVALIDA', 400);
      }
      if (detail.claveFilaHash !== calculateCanonicalHash(key)) {
        qnaFail(`Clave ${domain} inconsistente`, 'QNA_RETENCION_CLAVE_INVALIDA', 400);
      }
      if (detail.importeOficialD6 !== payload[definition.amount]) {
        qnaFail(`Importe ${domain} inconsistente`, 'QNA_RETENCION_IMPORTE_INVALIDO', 400);
      }
      for (const component of definition.components) {
        const value = payload[component];
        if (value !== null && (typeof value !== 'string' || !MONEY_D6_PATTERN.test(value))) {
          qnaFail(`Componente ${domain}.${component} invalido`, 'QNA_RETENCION_COMPONENTE_INVALIDO', 400);
        }
      }
    }
  }
}

function isSqlInteger(value: unknown, range: { readonly min: number; readonly max: number }): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= range.min && value <= range.max;
}

export function calculateQnaEmployeeDetailHash(detail: import('../entities/LiquidacionQna.js').QnaEmployeeDetail): string {
  const { hashFila: _hashFila, ...businessProjection } = detail;
  return calculateCanonicalHash(businessProjection);
}

export function validateQnaAuxiliaryEmployeeProjection(
  details: QnaSourceDetail[],
  employeeDetails: QnaEmployeeDetail[]
): void {
  const fields = {
    GUARDERIAS: 'guarderiasD6', TRANSITORIO: 'transitorioD6', AGUINALDO: 'aguinaldoD6',
    PCP: 'retencionPcpD6', PMP: 'retencionPmpD6', HIP: 'retencionHipD6'
  } as const;
  for (const employee of employeeDetails) {
    for (const [domain, field] of Object.entries(fields)) {
      const amounts = details
        .filter((detail) => detail.dominio === domain && detail.empleadoClave === employee.empleadoClave)
        .map((detail) => detail.importeOficialD6);
      if (sumD6(amounts) !== employee[field]) {
        qnaFail(`Proyeccion auxiliar ${domain} inconsistente para ${employee.empleadoClave}`,
          'QNA_DETALLE_AUXILIAR_EMPLEADO_INCONSISTENTE', 400);
      }
    }
  }
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

function sumD6(values: string[]): string {
  const micros = values.reduce((sum, value) => {
    if (!MONEY_D6_PATTERN.test(value)) qnaFail('Importe D6 invalido', 'QNA_DETALLE_INVALIDO', 400);
    const negative = value.startsWith('-');
    const [whole, fraction] = (negative ? value.slice(1) : value).split('.');
    const units = BigInt(whole) * 1_000_000n + BigInt(fraction);
    return sum + (negative ? -units : units);
  }, 0n);
  const negative = micros < 0n;
  const absolute = negative ? -micros : micros;
  return `${negative ? '-' : ''}${absolute / 1_000_000n}.${String(absolute % 1_000_000n).padStart(6, '0')}`;
}
