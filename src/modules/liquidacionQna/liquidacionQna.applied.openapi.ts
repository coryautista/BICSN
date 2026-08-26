import { QNA_AUXILIARY_PAYLOAD_V1_FIELDS } from './domain/services/QnaAuxiliaryPayloadV1.js';

const id = { type: 'string', pattern: '^[1-9]\\d*$' } as const;
const hash = { type: 'string', pattern: '^[0-9A-F]{64}$' } as const;
const moneyA2 = { type: 'string', pattern: '^-?(0|[1-9]\\d*)\\.\\d{2}$' } as const;
const moneyD6 = { type: 'string', pattern: '^-?(0|[1-9]\\d*)\\.\\d{6}$' } as const;
const nullableString = { anyOf: [{ type: 'string' }, { type: 'null' }] } as const;
const nullableHash = { anyOf: [hash, { type: 'null' }] } as const;
const warning = { type: 'object', additionalProperties: false, required: ['code', 'message'], properties: {
  code: { type: 'string' }, message: { type: 'string' }, dominio: { type: 'string', enum: ['AHORRO','VIVIENDA','PRESTACIONES','CAIR','GUARDERIAS','TRANSITORIO','AGUINALDO','PCP','PMP','HIP'] },
} } as const;
const publicSource = { type: 'object', additionalProperties: false,
  required: ['dominio','tipoFuente','estado','requerida','sourceScale','registros','notApplicableAprobado','errorCode'], properties: {
    dominio: warning.properties.dominio, tipoFuente: { type: 'string', enum: ['TXT_NOMINA','FIREBIRD','SQL_HISTORICO','MOVIMIENTO'] },
    estado: { type: 'string', enum: ['COMPLETE','EMPTY','NOT_APPLICABLE','ERROR'] }, requerida: { type: 'boolean' }, sourceScale: { type: 'integer', enum: [2,6] },
    registros: { type: 'integer', minimum: 0 }, notApplicableAprobado: { type: 'boolean' }, errorCode: nullableString,
  } } as const;
const adminSource = { type: 'object', additionalProperties: false,
  required: [...publicSource.required,'identificadorFuente','hashFuente','aprobadoPor','evidencia'], properties: {
    ...publicSource.properties, identificadorFuente: { type: 'string' }, hashFuente: nullableHash, aprobadoPor: nullableString, evidencia: nullableString,
  } } as const;
const source = { oneOf: [publicSource, adminSource] } as const;
const metadataProperties = {
  liquidacionSnapshotId: id, snapshotCalculoV2Id: id, nominaCargaId: id, formulaCalculoVersionId: id,
  entidadId: { type: 'integer', minimum: 1 }, anio: { type: 'integer' }, quincena: { type: 'integer', minimum: 1, maximum: 24 }, periodo: { type: 'string', pattern: '^\\d{4}$' },
  organica0: { type: 'string', pattern: '^\\d{2}$' }, organica1: { type: 'string', pattern: '^\\d{2}$' }, organica2: { type: 'string', pattern: '^\\d{2}$' }, organica3: { type: 'string', pattern: '^\\d{2}$' },
  ambiente: { type: 'string', enum: ['DESARROLLO','CALIDAD','PRODUCCION'] }, revision: { type: 'integer', minimum: 1 }, precisionPolicy: { type: 'string' }, hashContenido: hash,
  fechaAplicacion: { type: 'string', format: 'date-time' }, fechaCreacion: { type: 'string', format: 'date-time' }, fuente: { const: 'SNAPSHOT_OFICIAL' },
  estadoProceso: { const: 'TERMINADO' }, reconstructionStrategy: { type: 'null' },
} as const;
const metadataRequired = Object.keys(metadataProperties);
const totalsProperties = Object.fromEntries(['cairA2','fraA2','freA2','fhA2','fvA2','faaA2','faeA2','fatA2','faiA2','ahorroA2','viviendaA2','prestacionesA2',
  'cairFondoA2','guarderiasA2','transitorioA2','aguinaldoA2','retencionPcpA2','retencionPmpA2','retencionHipA2','totalAportacionesA2','totalRetencionesA2','totalGeneralA2']
  .map(key => [key, moneyA2]));
const totals = { type: 'object', additionalProperties: false, required: ['registros',...Object.keys(totalsProperties)], properties: {
  registros: { type: 'integer', minimum: 0 }, ...totalsProperties,
} } as const;
const metadata = { type: 'object', additionalProperties: false, required: metadataRequired, properties: metadataProperties } as const;
const listItem = { type: 'object', additionalProperties: false, required: [...metadataRequired,'fuentes','advertencias'], properties: {
  ...metadataProperties, fuentes: { type: 'array', minItems: 10, maxItems: 10, items: source }, advertencias: { type: 'array', items: warning },
} } as const;
const summary = { type: 'object', additionalProperties: false, required: [...metadataRequired,'fuentes','totales','advertencias'], properties: {
  ...metadataProperties, fuentes: { type: 'array', minItems: 10, maxItems: 10, items: source }, totales: totals, advertencias: { type: 'array', items: warning },
} } as const;
const payloadValue = { anyOf: [{ type: 'string' },{ type: 'number' },{ type: 'integer' },{ type: 'boolean' },{ type: 'null' }] } as const;
const auxiliaryPayloads = Object.entries(QNA_AUXILIARY_PAYLOAD_V1_FIELDS).map(([domain, fields]) => ({ type: 'object', additionalProperties: false,
  required: [...fields], properties: Object.fromEntries(fields.map(field => [field, payloadValue])), title: `${domain}PayloadV1` }));
const fundFields = ['interno','diasLaborados','diasOrigen','sueldoD6','otrasPrestacionesD6','quinqueniosD6','faaD6','faeD6','fatD6','faiD6','fhD6','fvD6',
  'viviendaD6','baseCotizacionSueldoD6','baseCotizacionQuinqueniosD6','fraD6','freD6','prestacionesD6','cairD6','cairFondoD6'];
const fundProperties = Object.fromEntries(fundFields.map(field => [field,
  field === 'interno' || field === 'diasOrigen' ? { type: 'string' }
    : field === 'diasLaborados' ? { type: 'string', pattern: '^\\d+\\.\\d{2}$' }
      : { anyOf: [moneyD6,{ type: 'null' }] }
]));
const fundPayload = { type: 'object', additionalProperties: false, properties: fundProperties, required: ['interno','diasLaborados','diasOrigen'] } as const;
const detailPublicProperties = { orden: { type: 'integer', minimum: 1 }, empleadoClave: { type: 'string' }, rfc: nullableString, nombre: { type: 'string' },
  sourceScale: { type: 'integer', enum: [2,6] }, importeOficialD6: moneyD6, payloadVersion: { const: 1 }, payloadCanonico: { oneOf: [fundPayload,...auxiliaryPayloads] } } as const;
const detailPublic = { type: 'object', additionalProperties: false, required: Object.keys(detailPublicProperties), properties: detailPublicProperties } as const;
const detailAdmin = { type: 'object', additionalProperties: false, required: [...Object.keys(detailPublicProperties),'hashFila'], properties: {
  ...detailPublicProperties, claveFilaHash: hash, hashFila: hash,
} } as const;
const detailResult = { type: 'object', additionalProperties: false,
  required: [...metadataRequired,'dominio','totalDominioA2','detalles','page','pageSize','total','advertencias'], properties: {
    ...metadataProperties, dominio: warning.properties.dominio, totalDominioA2: moneyA2, detalles: { type: 'array', items: { oneOf: [detailPublic,detailAdmin] } },
    page: { type: 'integer', minimum: 1 }, pageSize: { type: 'integer', minimum: 1, maximum: 500 }, total: { type: 'integer', minimum: 0 }, advertencias: { type: 'array', items: warning },
  } } as const;
const envelope = (data: object) => ({ type: 'object', additionalProperties: false, required: ['ok','data'], properties: { ok: { const: true }, data } });
const error = { type: 'object', additionalProperties: false, required: ['ok','error'], properties: { ok: { const: false }, error: {
  type: 'object', additionalProperties: false, required: ['message','code'], properties: { message: { type: 'string' }, code: { type: 'string' }, details: {} },
} } } as const;
const errors = { 400: error, 401: error, 403: error, 404: error, 409: error, 500: error } as const;

export const qnaAppliedListResponses = { 200: envelope({ type: 'object', additionalProperties: false, required: ['items','page','pageSize','total'], properties: {
  items: { type: 'array', items: listItem }, page: { type: 'integer', minimum: 1 }, pageSize: { type: 'integer', minimum: 1, maximum: 500 }, total: { type: 'integer', minimum: 0 },
} }), ...errors };
export const qnaAppliedSummaryResponses = { 200: envelope(summary), ...errors };
export const qnaAppliedDetailResponses = { 200: envelope(detailResult), ...errors };
export const qnaAppliedMetadataSchema = metadata;
