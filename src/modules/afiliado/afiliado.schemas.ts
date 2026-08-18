import { z } from 'zod';

// Función helper para convertir fecha de formato DD/MM/YYYY a YYYY-MM-DD
function convertDateFormat(dateString: string | null | undefined): string | null | undefined {
  if (!dateString || typeof dateString !== 'string') {
    return dateString;
  }
  
  // Si ya está en formato YYYY-MM-DD, retornarlo tal cual
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }
  
  // Intentar convertir de DD/MM/YYYY a YYYY-MM-DD
  const ddmmyyyyMatch = dateString.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (ddmmyyyyMatch) {
    const [, day, month, year] = ddmmyyyyMatch;
    return `${year}-${month}-${day}`;
  }
  
  // Si no coincide con ningún formato conocido, retornar tal cual (fallará la validación)
  return dateString;
}

const EntregaRendimientoSchema = z.preprocess((value) => {
  if (value === null || value === undefined || value === '') return value;
  if (typeof value !== 'string') return value;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'si' || normalized === 'sí') return 'Si';
  if (normalized === 'no') return 'No';
  return value;
}, z.enum(['Si', 'No']).nullable().optional());

export const CreateAfiliadoAfiliadoOrgMovimientoSchema = z.object({
  periodo: z.string().regex(/^(0[1-9]|1\d|2[0-4])\d{2}$/, 'periodo debe tener formato QQAA'),
  // Afiliado fields
  folio: z.number().int().nullable().optional(),
  apellidoPaterno: z.string().max(255).nullable().optional(),
  apellidoMaterno: z.string().max(255).nullable().optional(),
  nombre: z.string().max(200).nullable().optional(),
  curp: z.string().max(18).nullable().optional(),
  rfc: z.string().max(13).nullable().optional(),
  numeroSeguroSocial: z.string().max(50).nullable().optional(),
  fechaNacimiento: z.preprocess(
    convertDateFormat,
    z.string().date().nullable().optional()
  ),
  entidadFederativaNacId: z.number().int().nullable().optional(),
  domicilioCalle: z.string().max(255).nullable().optional(),
  domicilioNumeroExterior: z.string().max(50).nullable().optional(),
  domicilioNumeroInterior: z.string().max(50).nullable().optional(),
  domicilioEntreCalle1: z.string().max(120).nullable().optional(),
  domicilioEntreCalle2: z.string().max(120).nullable().optional(),
  domicilioColonia: z.string().max(255).nullable().optional(),
  domicilioCodigoPostal: z.number().int().nullable().optional(),
  telefono: z.string().max(10).nullable().optional(),
  estadoCivilId: z.number().int().nullable().optional(),
  sexo: z.string().max(1).nullable().optional(),
  correoElectronico: z.string().max(255).nullable().optional(),
  estatus: z.boolean().optional().default(true),
  interno: z.number().int().nullable().optional(),
  noEmpleado: z.string().max(20).nullable().optional(),
  localidad: z.string().max(150).nullable().optional(),
  municipio: z.string().max(150).nullable().optional(),
  estado: z.string().max(150).nullable().optional(),
  pais: z.string().max(100).nullable().optional(),
  dependientes: z.number().int().nullable().optional(),
  poseeInmuebles: z.boolean().nullable().optional(),
  fechaCarta: z.preprocess(
    convertDateFormat,
    z.string().date().nullable().optional()
  ),
  nacionalidad: z.string().max(80).nullable().optional(),
  fechaAlta: z.preprocess(
    convertDateFormat,
    z.string().date().nullable().optional()
  ),
  celular: z.string().max(15).nullable().optional(),
  expediente: z.string().max(50).nullable().optional(),
  quincenaAplicacion: z.number().int().nullable().optional(),
  anioAplicacion: z.number().int().nullable().optional(),

  // AfiliadoOrg fields
  nivel0Id: z.union([z.number().int(), z.null()]).optional(),
  nivel1Id: z.union([z.number().int(), z.null()]).optional(),
  nivel2Id: z.union([z.number().int(), z.null()]).optional(),
  nivel3Id: z.union([z.number().int(), z.null()]).optional(),
  claveOrganica0: z.string().max(30).nullable().optional(),
  claveOrganica1: z.string().max(30).nullable().optional(),
  claveOrganica2: z.string().max(30).nullable().optional(),
  claveOrganica3: z.string().max(30).nullable().optional(),
  internoOrg: z.number().int().nullable().optional(),
  sueldo: z.number().nullable().optional(),
  otrasPrestaciones: z.number().nullable().optional(),
  quinquenios: z.number().nullable().optional(),
  activo: z.boolean().optional().default(true),
  fechaMovAlt: z.preprocess(
    convertDateFormat,
    z.union([z.string().date(), z.null()]).optional()
  ),
  orgs1: z.string().max(200).nullable().optional(),
  orgs2: z.string().max(200).nullable().optional(),
  orgs3: z.string().max(200).nullable().optional(),
  orgs4: z.string().max(200).nullable().optional(),
  dSueldo: z.string().max(200).nullable().optional(),
  dOtrasPrestaciones: z.string().max(200).nullable().optional(),
  dQuinquenios: z.string().max(200).nullable().optional(),
  numQuinquenios: z.number().int().min(0).nullable().optional(),
  aplicar: z.boolean().nullable().optional(),
  bc: z.string().max(30).nullable().optional(),
  porcentaje: z.number().nullable().optional(),
  categoriaPuestoOrgId: z.number().int().nullable().optional(),

  // Movimiento fields
  quincenaId: z.string().max(30).nullable().optional(),
  tipoMovimientoId: z.number().int().optional().default(1),
  fechaMov: z.union([z.string().date(), z.null()]).optional(),
  fechaMovimiento: z.string().date(),
  observaciones: z.string().max(1024).nullable().optional(),
  entregaRendimiento: EntregaRendimientoSchema,
  motivoBajaId: z.number().int().positive().nullable().optional(),
  folioMov: z.string().max(100).nullable().optional(),
  estatusMov: z.string().max(30).nullable().optional(),
  creadoPor: z.number().int().nullable().optional()
});

// Schema específico para cambio de sueldo (interno es obligatorio, expediente opcional)
export const CreateCambioSueldoSchema = CreateAfiliadoAfiliadoOrgMovimientoSchema.extend({
  interno: z.number().int().min(1, 'Interno es obligatorio para cambio de sueldo'),
  expediente: z.string().max(50).nullable().optional()
}).transform((data) => ({
  ...data,
  expediente: data.expediente || data.curp || null
}));

// Schema específico para baja permanente (interno es obligatorio, expediente opcional)
export const CreateBajaPermanenteSchema = CreateAfiliadoAfiliadoOrgMovimientoSchema.extend({
  interno: z.number().int().min(1, 'Interno es obligatorio para baja permanente'),
  expediente: z.string().max(50).nullable().optional()
}).transform((data) => ({
  ...data,
  expediente: data.expediente || data.curp || null
}));

// Schema específico para baja suspensión de afiliación (interno es obligatorio, expediente opcional)
export const CreateBajaSuspensionSchema = CreateAfiliadoAfiliadoOrgMovimientoSchema.extend({
  interno: z.number().int().min(1, 'Interno es obligatorio para baja suspensión de afiliación'),
  expediente: z.string().max(50).nullable().optional()
}).transform((data) => ({
  ...data,
  expediente: data.expediente || data.curp || null
}));

// Schema específico para baja termina suspensión de afiliación (interno es obligatorio, expediente opcional)
export const CreateBajaTerminaSuspensionSchema = CreateAfiliadoAfiliadoOrgMovimientoSchema.extend({
  interno: z.number().int().min(1, 'Interno es obligatorio para baja termina suspensión de afiliación'),
  expediente: z.string().max(50).nullable().optional()
}).transform((data) => ({
  ...data,
  expediente: data.expediente || data.curp || null
}));

// Schema específico para baja termina suspensión de afiliación y baja (interno es obligatorio, expediente opcional)
export const CreateBajaTerminaSuspensionYBajaSchema = CreateAfiliadoAfiliadoOrgMovimientoSchema.extend({
  interno: z.number().int().min(1, 'Interno es obligatorio para baja termina suspensión de afiliación y baja'),
  expediente: z.string().max(50).nullable().optional()
}).transform((data) => ({
  ...data,
  expediente: data.expediente || data.curp || null
}));

export const AfiliadoSchema = z.object({
  id: z.number().int(),
  folio: z.number().int().nullable(),
  apellidoPaterno: z.string().max(255).nullable(),
  apellidoMaterno: z.string().max(255).nullable(),
  nombre: z.string().max(200).nullable(),
  curp: z.string().max(18).nullable(),
  rfc: z.string().max(13).nullable(),
  numeroSeguroSocial: z.string().max(50).nullable(),
  fechaNacimiento: z.string().date().nullable(),
  entidadFederativaNacId: z.number().int().nullable(),
  domicilioCalle: z.string().max(255).nullable(),
  domicilioNumeroExterior: z.string().max(50).nullable(),
  domicilioNumeroInterior: z.string().max(50).nullable(),
  domicilioEntreCalle1: z.string().max(120).nullable(),
  domicilioEntreCalle2: z.string().max(120).nullable(),
  domicilioColonia: z.string().max(255).nullable(),
  domicilioCodigoPostal: z.number().int().nullable(),
  telefono: z.string().max(10).nullable(),
  estadoCivilId: z.number().int().nullable(),
  sexo: z.string().max(1).nullable(),
  correoElectronico: z.string().max(255).nullable(),
  estatus: z.boolean(),
  interno: z.number().int().nullable(),
  noEmpleado: z.string().max(20).nullable(),
  localidad: z.string().max(150).nullable(),
  municipio: z.string().max(150).nullable(),
  estado: z.string().max(150).nullable(),
  pais: z.string().max(100).nullable(),
  dependientes: z.number().int().nullable(),
  poseeInmuebles: z.boolean().nullable(),
  fechaCarta: z.string().date().nullable(),
  nacionalidad: z.string().max(80).nullable(),
  fechaAlta: z.string().date().nullable(),
  celular: z.string().max(15).nullable(),
  expediente: z.string().max(50).nullable(),
  quincenaAplicacion: z.number().int().nullable(),
  anioAplicacion: z.number().int().nullable(),
  afiliadosComplete: z.number().int().nullable(),
  numValidacion: z.number().int().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export const CreateAfiliadoSchema = z.object({
  folio: z.number().int(),
  apellidoPaterno: z.string().max(255).nullable().optional(),
  apellidoMaterno: z.string().max(255).nullable().optional(),
  nombre: z.string().max(200).nullable().optional(),
  curp: z.string().max(18).nullable().optional(),
  rfc: z.string().max(13).nullable().optional(),
  numeroSeguroSocial: z.string().max(50).nullable().optional(),
  fechaNacimiento: z.string().date().nullable().optional(),
  entidadFederativaNacId: z.number().int().nullable().optional(),
  domicilioCalle: z.string().max(255).nullable().optional(),
  domicilioNumeroExterior: z.string().max(50).nullable().optional(),
  domicilioNumeroInterior: z.string().max(50).nullable().optional(),
  domicilioEntreCalle1: z.string().max(120).nullable().optional(),
  domicilioEntreCalle2: z.string().max(120).nullable().optional(),
  domicilioColonia: z.string().max(255).nullable().optional(),
  domicilioCodigoPostal: z.number().int().nullable().optional(),
  telefono: z.string().max(10).nullable().optional(),
  estadoCivilId: z.number().int().nullable().optional(),
  sexo: z.string().max(1).nullable().optional(),
  correoElectronico: z.string().max(255).nullable().optional(),
  estatus: z.boolean().optional().default(true),
  interno: z.number().int().nullable().optional(),
  noEmpleado: z.string().max(20).nullable().optional(),
  localidad: z.string().max(150).nullable().optional(),
  municipio: z.string().max(150).nullable().optional(),
  estado: z.string().max(150).nullable().optional(),
  pais: z.string().max(100).nullable().optional(),
  dependientes: z.number().int().nullable().optional(),
  poseeInmuebles: z.boolean().nullable().optional(),
  fechaCarta: z.string().date().nullable().optional(),
  nacionalidad: z.string().max(80).nullable().optional(),
  fechaAlta: z.string().date().nullable().optional(),
  celular: z.string().max(15).nullable().optional(),
  expediente: z.string().max(50).nullable().optional(),
  quincenaAplicacion: z.number().int().nullable().optional(),
  anioAplicacion: z.number().int().nullable().optional()
});

export const UpdateAfiliadoSchema = z.object({
  apellidoPaterno: z.string().max(255).nullable().optional(),
  apellidoMaterno: z.string().max(255).nullable().optional(),
  nombre: z.string().max(200).nullable().optional(),
  curp: z.string().max(18).nullable().optional(),
  rfc: z.string().max(13).nullable().optional(),
  numeroSeguroSocial: z.string().max(50).nullable().optional(),
  fechaNacimiento: z.string().date().nullable().optional(),
  entidadFederativaNacId: z.number().int().nullable().optional(),
  domicilioCalle: z.string().max(255).nullable().optional(),
  domicilioNumeroExterior: z.string().max(50).nullable().optional(),
  domicilioNumeroInterior: z.string().max(50).nullable().optional(),
  domicilioEntreCalle1: z.string().max(120).nullable().optional(),
  domicilioEntreCalle2: z.string().max(120).nullable().optional(),
  domicilioColonia: z.string().max(255).nullable().optional(),
  domicilioCodigoPostal: z.number().int().nullable().optional(),
  telefono: z.string().max(10).nullable().optional(),
  estadoCivilId: z.number().int().nullable().optional(),
  sexo: z.string().max(1).nullable().optional(),
  correoElectronico: z.string().max(255).nullable().optional(),
  estatus: z.boolean().optional(),
  interno: z.number().int().nullable().optional(),
  noEmpleado: z.string().max(20).nullable().optional(),
  localidad: z.string().max(150).nullable().optional(),
  municipio: z.string().max(150).nullable().optional(),
  estado: z.string().max(150).nullable().optional(),
  pais: z.string().max(100).nullable().optional(),
  dependientes: z.number().int().nullable().optional(),
  poseeInmuebles: z.boolean().nullable().optional(),
  fechaCarta: z.string().date().nullable().optional(),
  nacionalidad: z.string().max(80).nullable().optional(),
  fechaAlta: z.string().date().nullable().optional(),
  celular: z.string().max(15).nullable().optional(),
  expediente: z.string().max(50).nullable().optional()
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' }
);

// Schema para aplicar BDISSPEA en lote
export const AplicarBDIsspeaLoteSchema = z.object({
  motivo: z.string().max(500, 'El motivo no debe exceder 500 caracteres').optional(),
  observaciones: z.string().max(1000, 'Las observaciones no deben exceder 1000 caracteres').optional()
});

// Schema para aplicar BDISSPEA a un afiliado individual
export const AplicarBDIsspeaIndividualSchema = z.object({
  motivo: z.string().max(500, 'El motivo no debe exceder 500 caracteres').optional(),
  observaciones: z.string().max(1000, 'Las observaciones no deben exceder 1000 caracteres').optional()
});

// Schema para actualizar BitacoraAfectacionOrg a TERMINADO
export const UpdateBitacoraAfectacionOrgTerminadoSchema = z.object({
  afectacionId: z.number().int().positive('El AfectacionId debe ser un número entero positivo')
});

// ============================================================================
// SCHEMAS PARA CARGA DE SEMANAS EXTEMPORÁNEAS
// ============================================================================

// Schema para un item individual del lote de semanas extemporáneas
export const FormatoExtemporaneaItemSchema = z.object({
  qnaAplica: z.number().int().positive('QnaAplica debe ser un número entero positivo'),
  interno: z.number().int().positive('Interno debe ser un número entero positivo'),
  org0: z.string().length(2, 'Org0 debe tener exactamente 2 caracteres'),
  org1: z.string().length(2, 'Org1 debe tener exactamente 2 caracteres'),
  org2: z.string().length(2, 'Org2 debe tener exactamente 2 caracteres'),
  org3: z.string().length(2, 'Org3 debe tener exactamente 2 caracteres'),
  qnasPlus: z.number().int().nonnegative('QnasPlus debe ser un número entero no negativo'),
  cair: z.number().nonnegative('Cair debe ser un número no negativo'),
  fra: z.number().nonnegative('Fra debe ser un número no negativo'),
  fre: z.number().nonnegative('Fre debe ser un número no negativo'),
  fh: z.number().nonnegative('Fh debe ser un número no negativo'),
  fv: z.number().nonnegative('Fv debe ser un número no negativo'),
  faa: z.number().nonnegative('Faa debe ser un número no negativo'),
  fae: z.number().nonnegative('Fae debe ser un número no negativo'),
  usuario: z.string().min(1, 'Usuario es requerido').max(50, 'Usuario no debe exceder 50 caracteres')
});

// Schema para el body de la carga en lote
export const CargarSemanasExtemporaneasLoteSchema = z.object({
  registros: z.array(FormatoExtemporaneaItemSchema)
    .min(1, 'Debe proporcionar al menos un registro')
    .max(500, 'El lote no puede exceder 500 registros')
});
