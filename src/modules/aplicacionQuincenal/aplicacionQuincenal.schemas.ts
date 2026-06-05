import { z } from 'zod';

// Schema para parámetros de AportacionQuincenalResumen
export const AportacionQuincenalResumenParamsSchema = z.object({
  org0: z.string().min(1).max(2).optional().describe('Clave orgánica 0 (requerido para admin, opcional para usuarios normales)'),
  org1: z.string().min(1).max(2).optional().describe('Clave orgánica 1 (requerido para admin, opcional para usuarios normales)'),
  PERIODO: z.string().min(1).max(10).describe('Período en formato QQAA (ej: "2125")')
});

// Schema para parámetros de ResumenOrgQnaAll
export const ResumenOrgQnaAllParamsSchema = z.object({
  org0: z.string().min(1).max(2).optional().describe('Clave orgánica 0 (requerido para admin, opcional para usuarios normales)'),
  org1: z.string().min(1).max(2).optional().describe('Clave orgánica 1 (requerido para admin, opcional para usuarios normales)'),
  PERIODO: z.string().min(1).max(10).describe('Período en formato QQAA (ej: "2125")')
});

// Schema para parámetros de AQ_ENTIDADES_RPT_PDF_INSERTA
export const EntidadesRptPdfInsertaParamsSchema = z.object({
  organica0: z.string().min(1).max(2).optional().describe('Clave orgánica 0 (opcional si viene en token)'),
  organica1: z.string().min(1).max(2).optional().describe('Clave orgánica 1 (opcional si viene en token)'),
  periodo: z.string().min(1).max(10).describe('Período enviado al SP (ej: "1026")')
});

// Schema para validar aplicacion QNA terminada y obtener historicos de aportaciones
export const ValidarAplicacionQnaAportacionesParamsSchema = z.object({
  organica0: z.string().min(1).max(2).optional().describe('Clave orgánica 0 (solo admin puede enviarla)'),
  organica1: z.string().min(1).max(2).optional().describe('Clave orgánica 1 (solo admin puede enviarla)'),
  periodo: z.string().regex(/^\d{4}$/, 'Período debe tener formato QQAA, ejemplo 1026')
});

// Tipos TypeScript inferidos
export type AportacionQuincenalResumenParams = z.infer<typeof AportacionQuincenalResumenParamsSchema>;
export type ResumenOrgQnaAllParams = z.infer<typeof ResumenOrgQnaAllParamsSchema>;
export type EntidadesRptPdfInsertaParams = z.infer<typeof EntidadesRptPdfInsertaParamsSchema>;
export type ValidarAplicacionQnaAportacionesParams = z.infer<typeof ValidarAplicacionQnaAportacionesParamsSchema>;

// ============================================================================
// Schemas para Guardar Histórico de Aportaciones
// ============================================================================

// Schema base para campos comunes
const claveOrganicaSchema = z.string().length(2, 'Clave orgánica debe tener 2 caracteres');
const quincenaSchema = z.number().int().min(1).max(24);
const anioSchema = z.number().int().min(2000).max(3000);
const usuarioIdSchema = z.string().min(1).max(100);
const decimalSchema = z.number().nullable().optional();
const stringSchema = z.string().nullable().optional();
const intSchema = z.number().int().nullable().optional();

// Ahorro
export const AhorroHeaderSchema = z.object({
  clave_organica_0: claveOrganicaSchema,
  clave_organica_1: claveOrganicaSchema,
  quincena: quincenaSchema,
  anio: anioSchema,
  usuario_id: usuarioIdSchema,
  total_empleados: z.number().int().min(0),
  total_contribucion: z.number(),
  total_sueldo_base: z.number()
});

export const AhorroDetalleSchema = z.object({
  clave_organica_0: claveOrganicaSchema,
  clave_organica_1: claveOrganicaSchema,
  quincena: quincenaSchema,
  anio: anioSchema,
  interno: z.number().int(),
  nombre: z.string().min(1),
  sueldo: z.number(),
  quinquenios: z.number(),
  otras_prestaciones: decimalSchema,
  sueldo_base: z.number(),
  afae: z.number(),
  afaa: z.number(),
  total: z.number()
});

// Vivienda
export const ViviendaHeaderSchema = z.object({
  clave_organica_0: claveOrganicaSchema,
  clave_organica_1: claveOrganicaSchema,
  quincena: quincenaSchema,
  anio: anioSchema,
  usuario_id: usuarioIdSchema,
  total_empleados: z.number().int().min(0).optional(),
  total_contribucion: z.number().optional(),
  total_sueldo_base: z.number().optional()
});

export const ViviendaDetalleSchema = z.object({
  clave_organica_0: claveOrganicaSchema,
  clave_organica_1: claveOrganicaSchema,
  quincena: quincenaSchema,
  anio: anioSchema,
  interno: z.number().int(),
  nombre: z.string().min(1),
  sueldo: z.number(),
  quinquenios: z.number(),
  otras_prestaciones: decimalSchema,
  sueldo_base: z.number(),
  afe: z.number(),
  total: z.number()
});

// Prestaciones
export const PrestacionesHeaderSchema = z.object({
  clave_organica_0: claveOrganicaSchema,
  clave_organica_1: claveOrganicaSchema,
  quincena: quincenaSchema,
  anio: anioSchema,
  usuario_id: usuarioIdSchema,
  total_empleados: z.number().int().min(0).optional(),
  total_contribucion: z.number().optional(),
  total_sueldo_base: z.number().optional()
});

export const PrestacionesDetalleSchema = z.object({
  clave_organica_0: claveOrganicaSchema,
  clave_organica_1: claveOrganicaSchema,
  quincena: quincenaSchema,
  anio: anioSchema,
  interno: z.number().int(),
  nombre: z.string().min(1),
  sueldo: z.number(),
  quinquenios: z.number(),
  otras_prestaciones: decimalSchema,
  sueldo_base: z.number(),
  afpe: z.number(),
  afpa: z.number(),
  total: z.number()
});

// Cair
export const CairHeaderSchema = z.object({
  clave_organica_0: claveOrganicaSchema,
  clave_organica_1: claveOrganicaSchema,
  quincena: quincenaSchema,
  anio: anioSchema,
  usuario_id: usuarioIdSchema,
  total_empleados: z.number().int().min(0).optional(),
  total_contribucion: z.number().optional(),
  total_sueldo_base: z.number().optional()
});

export const CairDetalleSchema = z.object({
  clave_organica_0: claveOrganicaSchema,
  clave_organica_1: claveOrganicaSchema,
  quincena: quincenaSchema,
  anio: anioSchema,
  interno: z.number().int(),
  nombre: z.string().min(1),
  sueldo: z.number(),
  quinquenios: z.number(),
  otras_prestaciones: decimalSchema,
  sueldo_base: z.number(),
  afe: z.number(),
  total: z.number()
});

// Transitorio
export const TransitorioHeaderSchema = z.object({
  clave_organica_0: claveOrganicaSchema,
  clave_organica_1: claveOrganicaSchema,
  quincena: quincenaSchema,
  anio: anioSchema,
  usuario_id: usuarioIdSchema,
  total_empleados: z.number().int().min(0).optional(),
  total_contribucion: z.number().optional(),
  total_sueldo_base: z.number().optional()
});

export const TransitorioDetalleSchema = z.object({
  clave_organica_0: claveOrganicaSchema,
  clave_organica_1: claveOrganicaSchema,
  quincena: quincenaSchema,
  anio: anioSchema,
  fpension: z.number().int(),
  interno: z.number().int(),
  nombres: z.string().min(0).max(200),
  nonombre: stringSchema,
  rfc: z.string().min(0).max(20),
  norfc: stringSchema,
  org0: claveOrganicaSchema,
  org1: claveOrganicaSchema,
  org2: claveOrganicaSchema,
  org3: claveOrganicaSchema,
  sueldo: decimalSchema,
  oprestaciones: decimalSchema,
  quinquenios: decimalSchema,
  sdo: z.number(),
  oprest: decimalSchema,
  quinq: decimalSchema,
  tpension: decimalSchema,
  transitorio: z.number(),
  norg0: stringSchema,
  norg1: stringSchema,
  norg2: stringSchema,
  norg3: stringSchema,
  cconcepto: z.string().min(0).max(50),
  descripcion: z.string().min(0).max(200),
  importe: z.number(),
  defuncion: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha debe ser YYYY-MM-DD').optional().nullable(),
  pcp: decimalSchema,
  palimenticia: decimalSchema,
  retroactivo: decimalSchema,
  payudaecon: decimalSchema,
  otrosp1: decimalSchema,
  otrosp2: decimalSchema,
  otrosp3: decimalSchema,
  otrosp4: decimalSchema,
  otrosp5: decimalSchema,
  terreno: decimalSchema,
  hipviv: decimalSchema,
  prodental: decimalSchema,
  otrod1: decimalSchema,
  otrod2: decimalSchema,
  otrod3: decimalSchema,
  otrod4: decimalSchema,
  otrod5: decimalSchema,
  otrod6: decimalSchema,
  tpercep: z.number(),
  tdeduc: z.number(),
  total: z.number(),
  inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha debe ser YYYY-MM-DD'),
  fin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha debe ser YYYY-MM-DD'),
  anio_detalle: intSchema,
  sihay: stringSchema,
  porcentaje: decimalSchema,
  sdoporc: decimalSchema,
  ayudporc: decimalSchema,
  quinqporc: decimalSchema,
  transorg0: claveOrganicaSchema,
  transorg1: claveOrganicaSchema,
  transnorg0: stringSchema,
  transnorg1: stringSchema
});

// Guarderias
export const GuarderiasHeaderSchema = z.object({
  clave_organica_0: claveOrganicaSchema,
  clave_organica_1: claveOrganicaSchema,
  quincena: quincenaSchema,
  anio: anioSchema,
  usuario_id: usuarioIdSchema,
  total_empleados: z.number().int().min(0).optional(),
  total_contribucion: z.number().optional(),
  total_sueldo_base: z.number().optional()
});

export const GuarderiasDetalleSchema = z.object({
  clave_organica_0: claveOrganicaSchema,
  clave_organica_1: claveOrganicaSchema,
  quincena: quincenaSchema,
  anio: anioSchema,
  titular_nombre: z.string().min(0).max(200),
  titular_no_empleado: z.string().min(0).max(50),
  titular_monto: z.number(),
  titular_rfc: z.string().min(0).max(20),
  titular_monto_texto: stringSchema,
  titular_org0: claveOrganicaSchema.optional().nullable(),
  titular_org0_nombre: stringSchema,
  titular_org1: claveOrganicaSchema.optional().nullable(),
  titular_org1_nombre: stringSchema,
  titular_org2: claveOrganicaSchema.optional().nullable(),
  titular_org2_nombre: stringSchema,
  titular_org3: claveOrganicaSchema.optional().nullable(),
  titular_org3_nombre: stringSchema,
  entidad_monto: decimalSchema,
  recibo_ajuste: decimalSchema,
  recibo_total: z.number(),
  recibo_mes_ano: z.string().min(0).max(50),
  recibo_fecha_venc: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha debe ser YYYY-MM-DD'),
  recibo_folio: z.string().min(0).max(50),
  menor_id: z.number().int(),
  menor_nombre: z.string().min(0).max(200),
  menor_rfc: stringSchema,
  menor_nivel: z.string().min(0).max(100),
  menor_sala: z.string().min(0).max(100),
  estatus: z.string().min(0).max(50)
});

// Aguinaldo
export const AguinaldoHeaderSchema = z.object({
  clave_organica_0: claveOrganicaSchema,
  clave_organica_1: claveOrganicaSchema,
  quincena: quincenaSchema,
  anio: anioSchema,
  usuario_id: usuarioIdSchema,
  total_empleados: z.number().int().min(0).optional(),
  total_contribucion: z.number().optional(),
  total_sueldo_base: z.number().optional()
});

export const AguinaldoDetalleSchema = z.object({
  clave_organica_0: claveOrganicaSchema,
  clave_organica_1: claveOrganicaSchema,
  quincena: quincenaSchema,
  anio: anioSchema,
  interno: z.number().int(),
  movimiento: stringSchema,
  noempleado: z.string().min(0).max(50),
  tipomovimiento: stringSchema,
  nombres: z.string().min(0).max(200),
  rfc: z.string().min(0).max(20),
  curp: z.string().min(0).max(20),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha debe ser YYYY-MM-DD'),
  dias_aguinaldo: intSchema,
  cuantos: intSchema,
  cuantos_ori: intSchema,
  nocontar: stringSchema,
  sdo: z.number(),
  op: decimalSchema,
  q: decimalSchema,
  activo: stringSchema,
  nom_activo: stringSchema,
  qna_a: intSchema,
  porcentaje_a: decimalSchema,
  diario: decimalSchema,
  general: z.number(),
  porcentaje: decimalSchema,
  proporcion: z.number(),
  mensaje: stringSchema,
  dias_gral_agui: intSchema,
  fecha_lf: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha debe ser YYYY-MM-DD').optional().nullable(),
  fecha_li: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha debe ser YYYY-MM-DD').optional().nullable(),
  f_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha debe ser YYYY-MM-DD').optional().nullable(),
  f_fin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha debe ser YYYY-MM-DD').optional().nullable(),
  org0: claveOrganicaSchema,
  org1: claveOrganicaSchema,
  org2: claveOrganicaSchema,
  org3: claveOrganicaSchema,
  norg0: z.string().min(0).max(200),
  norg1: z.string().min(0).max(200),
  norg2: z.string().min(0).max(200),
  norg3: z.string().min(0).max(200)
});

// Schema principal que agrupa todos los tipos
export const GuardarHistoricoAportacionesSchema = z.object({
  ahorro: z.object({
    header: AhorroHeaderSchema,
    detalle: z.array(AhorroDetalleSchema).min(0) // Permitir arrays vacíos
  }).optional(),
  vivienda: z.object({
    header: ViviendaHeaderSchema,
    detalle: z.array(ViviendaDetalleSchema).min(0) // Permitir arrays vacíos
  }).optional(),
  prestaciones: z.object({
    header: PrestacionesHeaderSchema,
    detalle: z.array(PrestacionesDetalleSchema).min(0) // Permitir arrays vacíos
  }).optional(),
  cair: z.object({
    header: CairHeaderSchema,
    detalle: z.array(CairDetalleSchema).min(0) // Permitir arrays vacíos
  }).optional(),
  transitorio: z.object({
    header: TransitorioHeaderSchema,
    detalle: z.array(TransitorioDetalleSchema).min(0) // Permitir arrays vacíos
  }).optional(),
  guarderias: z.object({
    header: GuarderiasHeaderSchema,
    detalle: z.array(GuarderiasDetalleSchema).min(0) // Permitir arrays vacíos
  }).optional(),
  aguinaldo: z.object({
    header: AguinaldoHeaderSchema,
    detalle: z.array(AguinaldoDetalleSchema).min(0) // Permitir arrays vacíos
  }).optional()
}).refine(
  (data) => {
    // Validar que al menos un tipo esté presente (aunque tenga 0 registros)
    return !!(
      data.ahorro ||
      data.vivienda ||
      data.prestaciones ||
      data.cair ||
      data.transitorio ||
      data.guarderias ||
      data.aguinaldo
    );
  },
  {
    message: 'Debe proporcionar al menos un tipo de aportación'
  }
);

// Tipos TypeScript inferidos
export type AhorroHeader = z.infer<typeof AhorroHeaderSchema>;
export type AhorroDetalle = z.infer<typeof AhorroDetalleSchema>;
export type ViviendaHeader = z.infer<typeof ViviendaHeaderSchema>;
export type ViviendaDetalle = z.infer<typeof ViviendaDetalleSchema>;
export type PrestacionesHeader = z.infer<typeof PrestacionesHeaderSchema>;
export type PrestacionesDetalle = z.infer<typeof PrestacionesDetalleSchema>;
export type CairHeader = z.infer<typeof CairHeaderSchema>;
export type CairDetalle = z.infer<typeof CairDetalleSchema>;
export type TransitorioHeader = z.infer<typeof TransitorioHeaderSchema>;
export type TransitorioDetalle = z.infer<typeof TransitorioDetalleSchema>;
export type GuarderiasHeader = z.infer<typeof GuarderiasHeaderSchema>;
export type GuarderiasDetalle = z.infer<typeof GuarderiasDetalleSchema>;
export type AguinaldoHeader = z.infer<typeof AguinaldoHeaderSchema>;
export type AguinaldoDetalle = z.infer<typeof AguinaldoDetalleSchema>;
export type GuardarHistoricoAportaciones = z.infer<typeof GuardarHistoricoAportacionesSchema>;

// ============================================================================
// Schemas para Guardar Histórico de Retenciones (Préstamos)
// ============================================================================

// PrestamosCortoPlazo
export const PrestamosCortoPlazoHeaderSchema = z.object({
  clave_organica_0: claveOrganicaSchema,
  clave_organica_1: claveOrganicaSchema,
  quincena: quincenaSchema,
  anio: anioSchema,
  usuario_id: usuarioIdSchema,
  total_empleados: z.number().int().min(0).optional(),
  total_contribucion: z.number().optional(),
  total_sueldo_base: z.number().optional()
});

export const PrestamosCortoPlazoDetalleSchema = z.object({
  clave_organica_0: claveOrganicaSchema,
  clave_organica_1: claveOrganicaSchema,
  quincena: quincenaSchema,
  anio: anioSchema,
  interno: z.number().int(),
  rfc: z.string().min(1),
  nombre: z.string().min(1),
  prestamo: z.number().int(),
  letra: z.number().int(),
  plazo: z.number().int(),
  periodo_c: z.string().min(1),
  fecha_c: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha debe ser YYYY-MM-DD'),
  capital: z.number(),
  interes: z.number(),
  monto: z.number(),
  moratorios: z.number(),
  total: z.number(),
  resultado: z.string().min(1),
  td: z.string().min(1),
  org0: claveOrganicaSchema,
  org1: claveOrganicaSchema,
  org2: claveOrganicaSchema,
  org3: claveOrganicaSchema,
  norg0: z.string().min(1),
  norg1: z.string().min(1),
  norg2: z.string().min(1),
  norg3: z.string().min(1)
});

// PrestamosMedianoPlazo
export const PrestamosMedianoPlazoHeaderSchema = z.object({
  clave_organica_0: claveOrganicaSchema,
  clave_organica_1: claveOrganicaSchema,
  quincena: quincenaSchema,
  anio: anioSchema,
  usuario_id: usuarioIdSchema,
  total_empleados: z.number().int().min(0).optional(),
  total_contribucion: z.number().optional(),
  total_sueldo_base: z.number().optional()
});

export const PrestamosMedianoPlazoDetalleSchema = z.object({
  clave_organica_0: claveOrganicaSchema,
  clave_organica_1: claveOrganicaSchema,
  quincena: quincenaSchema,
  anio: anioSchema,
  interno: z.number().int(),
  rfc: z.string().min(1),
  nombre: z.string().min(1),
  prestamo: z.number().int(),
  letra: z.number().int(),
  plazo: z.number().int(),
  periodo_c: z.string().min(1),
  fecha_c: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha debe ser YYYY-MM-DD'),
  capital: z.number(),
  moratorios: z.number(),
  interes: z.number(),
  seguro: z.number(),
  total: z.number(),
  resultado: z.string().min(1),
  clase: z.string().min(1),
  desc_clase: z.string().min(1),
  desc_prestamo: z.string().min(1),
  clave_p: z.string().min(1),
  noemple: z.string().min(1),
  folio: z.number().int(),
  anio_prestamo: z.number().int(),
  po: z.string().min(1),
  fecha_origen: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha debe ser YYYY-MM-DD'),
  org0: claveOrganicaSchema,
  org1: claveOrganicaSchema,
  org2: claveOrganicaSchema,
  org3: claveOrganicaSchema,
  norg0: z.string().min(1),
  norg1: z.string().min(1),
  norg2: z.string().min(1),
  norg3: z.string().min(1)
});

// PrestamosHipotecarios
export const PrestamosHipotecariosHeaderSchema = z.object({
  clave_organica_0: claveOrganicaSchema,
  clave_organica_1: claveOrganicaSchema,
  quincena: quincenaSchema,
  anio: anioSchema,
  usuario_id: usuarioIdSchema,
  total_empleados: z.number().int().min(0).optional(),
  total_contribucion: z.number().optional(),
  total_sueldo_base: z.number().optional()
});

export const PrestamosHipotecariosDetalleSchema = z.object({
  clave_organica_0: claveOrganicaSchema,
  clave_organica_1: claveOrganicaSchema,
  quincena: quincenaSchema,
  anio: anioSchema,
  computadora_antigua: z.number().int(),
  interno: z.number().int(),
  nombre: z.string().min(1),
  noempleado: z.string().min(1),
  rfc: z.string().min(1),
  cantidad: z.number(),
  status: z.string().min(1),
  referencia_1: z.string().min(1),
  referencia_2: z.string().min(1),
  pno_solicitud: z.number().int(),
  pano: z.number().int(),
  pclave_clase_prestamo: z.string().min(1),
  pdescripcion: z.string().min(1),
  pclave_prestamo: z.string().min(1),
  prestamo_desc: z.string().min(1),
  tipo: z.string().min(1),
  periodo_c: z.string().min(1),
  descto: z.number(),
  fecha_c: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha debe ser YYYY-MM-DD'),
  resultado: z.string().min(1),
  po: z.string().min(1),
  fecha_origen: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha debe ser YYYY-MM-DD'),
  plazo: z.number().int(),
  capital_pagar: z.number(),
  interes_pagar: z.number(),
  interes_diferido_pagar: z.number(),
  seguro_pagar: z.number(),
  moratorio_pagar: z.number(),
  org0: claveOrganicaSchema,
  org1: claveOrganicaSchema,
  org2: claveOrganicaSchema,
  org3: claveOrganicaSchema,
  norg0: z.string().min(1),
  norg1: z.string().min(1),
  norg2: z.string().min(1),
  norg3: z.string().min(1)
});

// Schema principal que agrupa todos los tipos de préstamos
export const GuardarHistoricoRetencionesSchema = z.object({
  prestamosCortoPlazo: z.object({
    header: PrestamosCortoPlazoHeaderSchema,
    detalle: z.array(PrestamosCortoPlazoDetalleSchema).min(0) // Permitir arrays vacíos
  }).optional(),
  prestamosMedianoPlazo: z.object({
    header: PrestamosMedianoPlazoHeaderSchema,
    detalle: z.array(PrestamosMedianoPlazoDetalleSchema).min(0) // Permitir arrays vacíos
  }).optional(),
  prestamosHipotecarios: z.object({
    header: PrestamosHipotecariosHeaderSchema,
    detalle: z.array(PrestamosHipotecariosDetalleSchema).min(0) // Permitir arrays vacíos
  }).optional()
}).refine(
  (data) => {
    // Validar que al menos un tipo esté presente (aunque tenga 0 registros)
    return !!(
      data.prestamosCortoPlazo ||
      data.prestamosMedianoPlazo ||
      data.prestamosHipotecarios
    );
  },
  {
    message: 'Debe proporcionar al menos un tipo de préstamo'
  }
);

// Tipos TypeScript inferidos
export type PrestamosCortoPlazoHeader = z.infer<typeof PrestamosCortoPlazoHeaderSchema>;
export type PrestamosCortoPlazoDetalle = z.infer<typeof PrestamosCortoPlazoDetalleSchema>;
export type PrestamosMedianoPlazoHeader = z.infer<typeof PrestamosMedianoPlazoHeaderSchema>;
export type PrestamosMedianoPlazoDetalle = z.infer<typeof PrestamosMedianoPlazoDetalleSchema>;
export type PrestamosHipotecariosHeader = z.infer<typeof PrestamosHipotecariosHeaderSchema>;
export type PrestamosHipotecariosDetalle = z.infer<typeof PrestamosHipotecariosDetalleSchema>;
export type GuardarHistoricoRetenciones = z.infer<typeof GuardarHistoricoRetencionesSchema>;
