import { z } from 'zod';

export const CreateAfiliadoAfiliadoOrgMovimientoSchema = z.object({
  // Afiliado fields
  folio: z.number().int().nullable().optional(),
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
  anioAplicacion: z.number().int().nullable().optional(),

  // AfiliadoOrg fields
  nivel0Id: z.number().int().nullable().optional(),
  nivel1Id: z.number().int().nullable().optional(),
  nivel2Id: z.number().int().nullable().optional(),
  nivel3Id: z.number().int().nullable().optional(),
  claveOrganica0: z.string().max(30).nullable().optional(),
  claveOrganica1: z.string().max(30).nullable().optional(),
  claveOrganica2: z.string().max(30).nullable().optional(),
  claveOrganica3: z.string().max(30).nullable().optional(),
  internoOrg: z.number().int().nullable().optional(),
  sueldo: z.number().nullable().optional(),
  otrasPrestaciones: z.number().nullable().optional(),
  quinquenios: z.number().nullable().optional(),
  activo: z.boolean().optional().default(true),
  fechaMovAlt: z.string().date().nullable().optional(),
  orgs1: z.string().max(200).nullable().optional(),
  orgs2: z.string().max(200).nullable().optional(),
  orgs3: z.string().max(200).nullable().optional(),
  orgs4: z.string().max(200).nullable().optional(),
  dSueldo: z.string().max(200).nullable().optional(),
  dOtrasPrestaciones: z.string().max(200).nullable().optional(),
  dQuinquenios: z.string().max(200).nullable().optional(),
  aplicar: z.boolean().nullable().optional(),
  bc: z.string().max(30).nullable().optional(),
  porcentaje: z.number().nullable().optional(),

  // Movimiento fields
  quincenaId: z.string().max(30).nullable().optional(),
  tipoMovimientoId: z.number().int().optional().default(1),
  fechaMov: z.string().date().nullable().optional(),
  observaciones: z.string().max(1024).nullable().optional(),
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