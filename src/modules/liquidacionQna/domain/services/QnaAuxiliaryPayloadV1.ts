import type { AportacionGuarderia } from '../../../aportacionesFondos/domain/entities/AportacionGuarderia.js';
import type { Aguinaldo } from '../../../aportacionesFondos/domain/entities/Aguinaldo.js';
import type { PensionNominaTransitorio } from '../../../aportacionesFondos/domain/entities/PensionNominaTransitorio.js';
import type { Prestamo } from '../../../aportacionesFondos/domain/entities/Prestamo.js';
import type { PrestamoHipotecario } from '../../../aportacionesFondos/domain/entities/PrestamoHipotecario.js';
import type { PrestamoMedianoPlazo } from '../../../aportacionesFondos/domain/entities/PrestamoMedianoPlazo.js';
import type { QnaAuxiliaryDomain } from '../entities/QnaTenDomainCapture.js';

export type QnaAuxiliaryRowMap = {
  GUARDERIAS: AportacionGuarderia;
  TRANSITORIO: PensionNominaTransitorio;
  AGUINALDO: Aguinaldo;
  PCP: Prestamo;
  PMP: PrestamoMedianoPlazo;
  HIP: PrestamoHipotecario;
};

export const QNA_AUXILIARY_PAYLOAD_V1_FIELDS = {
  GUARDERIAS: [
    'titular_interno','titular_nombre','titular_no_empleado','titular_monto','titular_rfc','titular_monto_texto',
    'titular_org0','titular_org0_nombre','titular_org1','titular_org1_nombre','titular_org2',
    'titular_org2_nombre','titular_org3','titular_org3_nombre','entidad_monto','recibo_ajuste',
    'recibo_total','recibo_total_d6','recibo_mes_ano','recibo_fecha_venc','recibo_folio',
    'menor_id','menor_nombre','menor_rfc','menor_nivel','menor_sala','estatus',
    'dias_laborados','dias_laborados_origen'
  ],
  TRANSITORIO: [
    'fpension','interno','nombres','nonombre','rfc','norfc','org0','org1','org2','org3',
    'sueldo','oprestaciones','quinquenios','sdo','oprest','quinq','tpension','transitorio',
    'norg0','norg1','norg2','norg3','cconcepto','descripcion','importe','defuncion','pcp',
    'palimenticia','retroactivo','payudaecon','otrosp1','otrosp2','otrosp3','otrosp4','otrosp5',
    'terreno','hipviv','prodental','otrod1','otrod2','otrod3','otrod4','otrod5','otrod6',
    'tpercep','tdeduc','total','total_d6','fin','inicio','anio','sihay','porcentaje','sdoporc',
    'ayudporc','quinqporc','transorg0','transorg1','transnorg0','transnorg1',
    'dias_laborados','dias_laborados_origen'
  ],
  AGUINALDO: [
    'interno','org0','org1','org2','org3','movimiento','noempleado','tipomovimiento','nombres',
    'rfc','curp','fecha','dias_aguinaldo','cuantos','cuantos_ori','nocontar','sdo','op','q',
    'activo','nom_activo','qna_a','porcentaje_a','diario','general','general_d6','porcentaje',
    'proporcion','mensaje','dias_gral_agui','fecha_lf','fecha_li','f_inicio','f_fin','norg0',
    'norg1','norg2','norg3','dias_laborados','dias_laborados_origen'
  ],
  PCP: [
    'interno','rfc','nombre','prestamo','letra','plazo','periodo_c','fecha_c','capital','capital_d6',
    'interes','interes_d6','monto','monto_d6','moratorios','moratorios_d6','total','total_d6',
    'resultado','td','org0','org1','org2','org3','norg0','norg1','norg2','norg3'
  ],
  PMP: [
    'interno','rfc','nombre','prestamo','letra','plazo','periodo_c','fecha_c','capital','capital_d6',
    'moratorios','moratorios_d6','interes','interes_d6','seguro','seguro_d6','total','total_d6',
    'resultado','clase','org0','org1','org2','org3','norg0','norg1','norg2','norg3','desc_clase',
    'desc_prestamo','clave_p','noemple','folio','anio','po','fecha_origen'
  ],
  HIP: [
    'interno','nombre','noempleado','cantidad','cantidad_d6','status','referencia_1','referencia_2',
    'capital_pagar','capital_pagar_d6','interes_pagar','interes_pagar_d6','interes_diferido_pagar',
    'interes_diferido_pagar_d6','seguro_pagar','seguro_pagar_d6','moratorio_pagar',
    'moratorio_pagar_d6','pno_solicitud','pano','pclave_clase_prestamo','pdescripcion','rfc',
    'org0','org1','org2','org3','norg0','norg1','norg2','norg3','pclave_prestamo','prestamo_desc',
    'tipo','periodo_c','descto','descto_d6','fecha_c','resultado','po','fecha_origen','plazo'
  ]
} as const satisfies { [K in QnaAuxiliaryDomain]: readonly (keyof QnaAuxiliaryRowMap[K])[] };

export function createQnaAuxiliaryPayloadV1<D extends QnaAuxiliaryDomain>(
  domain: D,
  row: QnaAuxiliaryRowMap[D]
): Record<string, unknown> {
  const source = row as unknown as Record<string, unknown>;
  return Object.fromEntries(QNA_AUXILIARY_PAYLOAD_V1_FIELDS[domain].map((field) => [
    field,
    canonicalValue(source[field])
  ]));
}

function canonicalValue(value: unknown): unknown {
  if (value === undefined || value === null) return null;
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(canonicalValue);
  if (typeof value === 'object') {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => [key, canonicalValue(item)]));
  }
  return value;
}
