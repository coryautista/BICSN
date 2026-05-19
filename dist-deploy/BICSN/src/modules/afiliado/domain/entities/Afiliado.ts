export interface Afiliado {
  id: number;
  folio: number | null;
  apellidoPaterno: string | null;
  apellidoMaterno: string | null;
  nombre: string | null;
  curp: string | null;
  rfc: string | null;
  numeroSeguroSocial: string | null;
  fechaNacimiento: string | null;
  entidadFederativaNacId: number | null;
  domicilioCalle: string | null;
  domicilioNumeroExterior: string | null;
  domicilioNumeroInterior: string | null;
  domicilioEntreCalle1: string | null;
  domicilioEntreCalle2: string | null;
  domicilioColonia: string | null;
  domicilioCodigoPostal: number | null;
  telefono: string | null;
  estadoCivilId: number | null;
  sexo: string | null;
  correoElectronico: string | null;
  estatus: boolean;
  interno: number | null;
  noEmpleado: string | null;
  localidad: string | null;
  municipio: string | null;
  estado: string | null;
  pais: string | null;
  dependientes: number | null;
  poseeInmuebles: boolean | null;
  fechaCarta: string | null;
  nacionalidad: string | null;
  fechaAlta: string | null;
  celular: string | null;
  expediente: string | null;
  quincenaAplicacion: number | null;
  anioAplicacion: number | null;
  codigoPostal: number | null;
  numValidacion: number;
  afiliadosComplete: number;
  createdAt: string;
  updatedAt: string;
}

export interface AfiliadoStatusControl {
  id: number;
  numValidacion: number;
  nombreStatus: string;
  descripcion: string | null;
  color: string | null;
  activo: boolean;
  orden: number;
  fechaCreacion: string;
  fechaModificacion: string;
  usuarioCreacion: string;
  usuarioModificacion: string;
}

export interface AfiliadoStatusHistory {
  id: number;
  afiliadoId: number;
  numValidacionAnterior: number | null;
  numValidacionNuevo: number;
  statusAnterior: string | null;
  statusNuevo: string;
  motivo: string | null;
  observaciones: string | null;
  usuarioId: string;
  fechaCambio: string;
  ipAddress: string | null;
  userAgent: string | null;
}

export interface AfiliadoWithStatus extends Afiliado {
  numValidacion: number;
  nombreStatus: string;
  statusDescripcion: string | null;
  statusColor: string | null;
}

export interface CreateAfiliadoData {
  folio: number | null;
  apellidoPaterno: string | null;
  apellidoMaterno: string | null;
  nombre: string | null;
  curp: string | null;
  rfc: string | null;
  numeroSeguroSocial: string | null;
  fechaNacimiento: string | null;
  entidadFederativaNacId: number | null;
  domicilioCalle: string | null;
  domicilioNumeroExterior: string | null;
  domicilioNumeroInterior: string | null;
  domicilioEntreCalle1: string | null;
  domicilioEntreCalle2: string | null;
  domicilioColonia: string | null;
  domicilioCodigoPostal: number | null;
  telefono: string | null;
  estadoCivilId: number | null;
  sexo: string | null;
  correoElectronico: string | null;
  estatus: boolean;
  interno: number | null;
  noEmpleado: string | null;
  localidad: string | null;
  municipio: string | null;
  estado: string | null;
  pais: string | null;
  dependientes: number | null;
  poseeInmuebles: boolean | null;
  fechaCarta: string | null;
  nacionalidad: string | null;
  fechaAlta: string | null;
  celular: string | null;
  expediente: string | null;
  quincenaAplicacion: number | null;
  anioAplicacion: number | null;
  codigoPostal: number | null;
  numValidacion: number;
  afiliadosComplete: number;
}

export interface UpdateAfiliadoData {
  id: number;
  folio?: number | null;
  apellidoPaterno?: string | null;
  apellidoMaterno?: string | null;
  nombre?: string | null;
  curp?: string | null;
  rfc?: string | null;
  numeroSeguroSocial?: string | null;
  fechaNacimiento?: string | null;
  entidadFederativaNacId?: number | null;
  domicilioCalle?: string | null;
  domicilioNumeroExterior?: string | null;
  domicilioNumeroInterior?: string | null;
  domicilioEntreCalle1?: string | null;
  domicilioEntreCalle2?: string | null;
  domicilioColonia?: string | null;
  domicilioCodigoPostal?: number | null;
  telefono?: string | null;
  estadoCivilId?: number | null;
  sexo?: string | null;
  correoElectronico?: string | null;
  estatus?: boolean;
  interno?: number | null;
  noEmpleado?: string | null;
  localidad?: string | null;
  municipio?: string | null;
  estado?: string | null;
  pais?: string | null;
  dependientes?: number | null;
  poseeInmuebles?: boolean | null;
  fechaCarta?: string | null;
  nacionalidad?: string | null;
  fechaAlta?: string | null;
  celular?: string | null;
  expediente?: string | null;
  quincenaAplicacion?: number | null;
  anioAplicacion?: number | null;
  codigoPostal?: number | null;
  numValidacion?: number;
  afiliadosComplete?: number;
}

export interface DeleteAfiliadoData {
  id: number;
}
