import assert from 'node:assert/strict';

const { calculateCanonicalHash, validateQnaRetentionSemantics } = await import(
  '../src/modules/liquidacionQna/domain/services/LiquidacionQnaContracts.js'
);
const { QNA_AUXILIARY_PAYLOAD_V1_FIELDS } = await import(
  '../src/modules/liquidacionQna/domain/services/QnaAuxiliaryPayloadV1.js'
);

const source = (dominio: 'PCP' | 'PMP' | 'HIP', identificadorFuente: string) => ({
  dominio, tipoFuente: 'FIREBIRD' as const, estado: 'COMPLETE' as const, requerida: true,
  identificadorFuente, hashFuente: 'A'.repeat(64), sourceScale: 2 as const, registros: 1,
  notApplicableAprobado: false, aprobadoPor: null, evidencia: null, errorCode: null
});
const payload = (domain: 'PCP' | 'PMP' | 'HIP', values: Record<string, unknown>) =>
  Object.fromEntries(QNA_AUXILIARY_PAYLOAD_V1_FIELDS[domain].map((field) => [field, values[field] ?? null]));
const pcpPayload = payload('PCP', { interno: 7, nombre: 'Persona', rfc: null, prestamo: null, letra: null, total_d6: '1.234567' });
const pmpPayload = payload('PMP', { interno: 7, nombre: 'Persona', rfc: null, prestamo: null, letra: null, folio: null, total_d6: '2.345678' });
const hipPayload = payload('HIP', { interno: 8, nombre: 'Otra', rfc: 'RFC', pno_solicitud: null, pano: null, cantidad_d6: '3.456789' });
const detail = (dominio: 'PCP' | 'PMP' | 'HIP', value: Record<string, unknown>, key: unknown[], amount: string) => ({
  dominio, orden: 1, claveFilaHash: calculateCanonicalHash(key), sourceScale: 2 as const,
  importeOficialD6: amount, payloadCanonico: value, hashFila: calculateCanonicalHash(value),
  empleadoClave: String(value.interno), rfc: value.rfc as string | null, nombre: String(value.nombre), payloadVersion: 1 as const
});
const details = [
  detail('PCP', pcpPayload, [7, null, null], '1.234567'),
  detail('PMP', pmpPayload, [7, null, null, null], '2.345678'),
  detail('HIP', hipPayload, [8, null, null], '3.456789')
];
const context = { ambiente: 'DESARROLLO' as const, anio: 2026, quincena: 17, organica0: '04', organica1: '24' };
const sources = [source('PCP', 'FIREBIRD:AP_S_PCP:DESARROLLO:1726:04:24'), source('PMP', 'FIREBIRD:AP_S_VIV:DESARROLLO:1726:04:24'), source('HIP', 'FIREBIRD:AP_S_HIP_QNA:DESARROLLO:1726:04:24')];

validateQnaRetentionSemantics(details, sources, context, ['1526']);
assert.equal(pcpPayload.prestamo, null);
assert.equal(hipPayload.pno_solicitud, null);
assert.throws(() => validateQnaRetentionSemantics([{ ...details[0], empleadoClave: '0' }, ...details.slice(1)], sources, context, []), /Identidad PCP/);
assert.throws(() => validateQnaRetentionSemantics([{ ...details[0], claveFilaHash: 'B'.repeat(64) }, ...details.slice(1)], sources, context, []), /Clave PCP/);
assert.throws(() => validateQnaRetentionSemantics([{ ...details[2], importeOficialD6: '9.000000' }, ...details.slice(0, 2)], sources, context, []), /Importe HIP/);
assert.throws(() => validateQnaRetentionSemantics(details, [source('PCP', 'FIREBIRD:AP_S_VIV:DESARROLLO:1726:04:24'), ...sources.slice(1)], context, []), /Procedencia PCP/);
assert.throws(() => validateQnaRetentionSemantics(details, [sources[0], source('PMP', 'FIREBIRD:AP_S_VIV:CALIDAD:1726:04:24'), sources[2]], context, []), /Procedencia PMP/);
assert.throws(() => validateQnaRetentionSemantics(details, sources, context, ['1726']), /Procedencia HIP/);
validateQnaRetentionSemantics(details, sources, context, null, { retentionProvenanceMode: 'PERSISTED_HISTORICAL' });
validateQnaRetentionSemantics(details, [sources[0], sources[1], source('HIP', 'FIREBIRD:AP_S_COMP_QNA:DESARROLLO:1726:04:24')],
  context, null, { retentionProvenanceMode: 'PERSISTED_HISTORICAL' });
assert.throws(() => validateQnaRetentionSemantics(details,
  [sources[0], sources[1], source('HIP', 'FIREBIRD:OTRO:DESARROLLO:1726:04:24')], context, null,
  { retentionProvenanceMode: 'PERSISTED_HISTORICAL' }), /Procedencia HIP/);
assert.throws(() => validateQnaRetentionSemantics(details, sources, context, null), /Politica HIP no configurada/);
assert.throws(() => validateQnaRetentionSemantics([{ ...details[1], payloadCanonico: { ...pmpPayload, extra: null } }, details[0], details[2]], sources, context, []), /Payload V1 PMP/);
const malformedComponent = { ...pcpPayload, capital_d6: '1.2' };
assert.throws(() => validateQnaRetentionSemantics([
  { ...details[0], payloadCanonico: malformedComponent, hashFila: calculateCanonicalHash(malformedComponent) }, ...details.slice(1)
], sources, context, []), /Componente PCP.capital_d6/);
const invalidInteger = (index: number, field: string, value: unknown, key: unknown[]) => {
  const invalidPayload = { ...details[index].payloadCanonico, [field]: value };
  return { ...details[index], payloadCanonico: invalidPayload, claveFilaHash: calculateCanonicalHash(key), hashFila: calculateCanonicalHash(invalidPayload) };
};
assert.throws(() => validateQnaRetentionSemantics([
  ...details.slice(0, 2), invalidInteger(2, 'pano', 40000, [8, null, 40000])
], sources, context, []), /Entero HIP.pano/);
assert.throws(() => validateQnaRetentionSemantics([
  invalidInteger(0, 'plazo', 'MALFORMADO', [7, null, null]), ...details.slice(1)
], sources, context, []), /Entero PCP.plazo/);
assert.throws(() => validateQnaRetentionSemantics([
  details[0], invalidInteger(1, 'plazo', 2147483648, [7, null, null, null]), details[2]
], sources, context, []), /Entero PMP.plazo/);
assert.throws(() => validateQnaRetentionSemantics([
  invalidInteger(0, 'prestamo', 2147483648, [7, 2147483648, null]), ...details.slice(1)
], sources, context, []), /Entero PCP.prestamo/);
assert.throws(() => validateQnaRetentionSemantics([
  details[0], invalidInteger(1, 'folio', -2147483649, [7, null, null, -2147483649]), details[2]
], sources, context, []), /Entero PMP.folio/);
validateQnaRetentionSemantics(details, sources, context, []);

console.log('QNA_RETENTION_SEMANTICS_TESTS_OK');
