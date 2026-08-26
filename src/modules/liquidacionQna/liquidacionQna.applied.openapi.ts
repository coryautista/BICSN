const id = { type: 'string', pattern: '^[1-9]\\d*$' } as const;
const hash = { type: 'string', pattern: '^[0-9A-F]{64}$' } as const;
const moneyA2 = { type: 'string', pattern: '^-?(0|[1-9]\\d*)\\.\\d{2}$' } as const;
const moneyD6 = { type: 'string', pattern: '^-?(0|[1-9]\\d*)\\.\\d{6}$' } as const;
const nullable = (schema: object) => ({ anyOf: [schema, { type: 'null' }] }) as const;
const nullableString = nullable({ type: 'string' });
const domains = ['AHORRO','VIVIENDA','PRESTACIONES','CAIR','GUARDERIAS','TRANSITORIO','AGUINALDO','PCP','PMP','HIP'];
const warning = { type: 'object', additionalProperties: false, required: ['code','message'], properties: {
  code:{type:'string'},message:{type:'string'},dominio:{type:'string',enum:domains},
} } as const;
const publicSource = { type:'object',additionalProperties:false,required:['dominio','tipoFuente','estado','requerida','sourceScale','registros','notApplicableAprobado','errorCode'],properties:{
  dominio:warning.properties.dominio,tipoFuente:{type:'string',enum:['TXT_NOMINA','FIREBIRD','SQL_HISTORICO','MOVIMIENTO']},
  estado:{type:'string',enum:['COMPLETE','EMPTY','NOT_APPLICABLE','ERROR','ABSENT_UNVERIFIED']},requerida:{type:'boolean'},sourceScale:{type:'integer',enum:[2,6]},
  registros:{type:'integer',minimum:0},notApplicableAprobado:{type:'boolean'},errorCode:nullableString,
} } as const;
const adminSource = { type:'object',additionalProperties:false,required:[...publicSource.required,'identificadorFuente','hashFuente','aprobadoPor','evidencia'],properties:{
  ...publicSource.properties,identificadorFuente:{type:'string'},hashFuente:nullable(hash),aprobadoPor:nullableString,evidencia:nullableString,
} } as const;
const source = { oneOf:[publicSource,adminSource] } as const;
const scopeProperties = { entidadId:{type:'integer',minimum:1},anio:{type:'integer'},quincena:{type:'integer',minimum:1,maximum:24},periodo:{type:'string',pattern:'^\\d{4}$'},
  organica0:{type:'string',pattern:'^\\d{2}$'},organica1:{type:'string',pattern:'^\\d{2}$'},organica2:{type:'string',pattern:'^\\d{2}$'},organica3:{type:'string',pattern:'^\\d{2}$'},
  estadoProceso:{const:'TERMINADO'} } as const;
const officialProperties = { ...scopeProperties,liquidacionSnapshotId:id,ambiente:{type:'string',enum:['DESARROLLO','CALIDAD','PRODUCCION']},revision:{type:'integer',minimum:1},
  snapshotCalculoV2Id:id,nominaCargaId:id,formulaCalculoVersionId:id,precisionPolicy:{type:'string'},hashContenido:hash,
  fechaAplicacion:{type:'string',format:'date-time'},fechaCreacion:{type:'string',format:'date-time'},fuente:{const:'SNAPSHOT_OFICIAL'},reconstructionStrategy:{type:'null'} } as const;
const reconstructedProperties = { ...officialProperties,snapshotCalculoV2Id:nullable(id),nominaCargaId:nullable(id),formulaCalculoVersionId:nullable(id),
  fuente:{const:'SNAPSHOT_OFICIAL_RECONSTRUIDO'},reconstructionStrategy:{const:'SNAPSHOT_V3_V4_PERSISTED_V2_FUNDS'} } as const;
const legacyProperties = { ...scopeProperties,liquidacionSnapshotId:{type:'null'},ambiente:{type:'null'},revision:{type:'null'},snapshotCalculoV2Id:{type:'null'},nominaCargaId:{type:'null'},
  formulaCalculoVersionId:{type:'null'},precisionPolicy:{type:'null'},hashContenido:{type:'null'},fechaAplicacion:{type:'string',format:'date-time'},fechaCreacion:nullable({type:'string',format:'date-time'}),
  fuente:{const:'HISTORICO_LEGACY'},reconstructionStrategy:{const:'LEGACY_EXACT_FULL_SCOPE'} } as const;
const metadataVariants = [officialProperties,reconstructedProperties,legacyProperties] as const;
const withMetadata = (extra:Record<string,object>,required:string[]) => ({ oneOf:metadataVariants.map(properties => ({ type:'object',additionalProperties:false,
  required:[...Object.keys(properties),...required],properties:{...properties,...extra} })) });
const totalsNames = ['cairA2','fraA2','freA2','fhA2','fvA2','faaA2','faeA2','fatA2','faiA2','ahorroA2','viviendaA2','prestacionesA2','cairFondoA2',
  'guarderiasA2','transitorioA2','aguinaldoA2','retencionPcpA2','retencionPmpA2','retencionHipA2','totalAportacionesA2','totalRetencionesA2','totalGeneralA2'];
const totals = { type:'object',additionalProperties:false,required:['registros',...totalsNames],properties:{registros:nullable({type:'integer',minimum:0}),
  ...Object.fromEntries(totalsNames.map(key => [key,nullable(moneyA2)]))} } as const;
const totalStrategies = { type:'object',additionalProperties:false,required:totalsNames,properties:Object.fromEntries(totalsNames.map(key => [key,{type:'string',enum:['PERSISTED','PERSISTED_CAIR_CONTROL_FALLBACK','DERIVED_DETAIL','UNAVAILABLE']}])) } as const;
const sources = {type:'array',minItems:10,maxItems:10,items:source} as const;
const warnings = {type:'array',items:warning} as const;
const listItem = withMetadata({fuentes:sources,advertencias:warnings},['fuentes','advertencias']);
const summary = withMetadata({fuentes:sources,totales:totals,totalStrategies,advertencias:warnings},['fuentes','totales','totalStrategies','advertencias']);
const detailPublicProperties = {orden:{type:'integer',minimum:1},empleadoClave:nullableString,rfc:nullableString,nombre:nullableString,sourceScale:{type:'integer',enum:[2,6]},
  importeOficialD6:nullable(moneyD6),payloadVersion:{anyOf:[{const:1},{type:'null'}]},payloadCanonico:nullable({type:'object',additionalProperties:true})} as const;
const detailPublic = {type:'object',additionalProperties:false,required:Object.keys(detailPublicProperties),properties:detailPublicProperties} as const;
const detailAdmin = {type:'object',additionalProperties:false,required:[...Object.keys(detailPublicProperties),'hashFila'],properties:{...detailPublicProperties,claveFilaHash:hash,hashFila:hash}} as const;
const detailResult = withMetadata({dominio:warning.properties.dominio,totalDominioA2:nullable(moneyA2),totalStrategy:{type:'string',enum:['PERSISTED','PERSISTED_CAIR_CONTROL_FALLBACK','DERIVED_DETAIL','UNAVAILABLE']},
  detalles:{type:'array',items:{oneOf:[detailPublic,detailAdmin]}},page:{type:'integer',minimum:1},pageSize:{type:'integer',minimum:1,maximum:500},total:{type:'integer',minimum:0},advertencias:warnings},
  ['dominio','totalDominioA2','totalStrategy','detalles','page','pageSize','total','advertencias']);
const envelope = (data:object) => ({type:'object',additionalProperties:false,required:['ok','data'],properties:{ok:{const:true},data}});
const error = {type:'object',additionalProperties:false,required:['ok','error'],properties:{ok:{const:false},error:{type:'object',additionalProperties:false,required:['message','code'],properties:{message:{type:'string'},code:{type:'string'},details:{}}}}} as const;
const errors = {400:error,401:error,403:error,404:error,409:error,500:error} as const;
export const qnaAppliedListResponses = {200:envelope({type:'object',additionalProperties:false,required:['items','page','pageSize','total'],properties:{items:{type:'array',items:listItem,description:'Cada elemento de la pagina supera validacion semantica de filas y hashes.'},page:{type:'integer',minimum:1},pageSize:{type:'integer',minimum:1,maximum:500},total:{type:'integer',minimum:0,description:'Total estructuralmente recuperable del filtro completo; la validacion semantica se realiza por pagina.'}}}),...errors};
export const qnaAppliedSummaryResponses = {200:envelope(summary),...errors};
export const qnaAppliedDetailResponses = {200:envelope(detailResult),...errors};
export const qnaAppliedMetadataSchema = {oneOf:metadataVariants.map(properties => ({type:'object',additionalProperties:false,required:Object.keys(properties),properties}))};
