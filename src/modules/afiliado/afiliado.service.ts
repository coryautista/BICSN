import {
  getAllAfiliados,
  getAfiliadoById,
  createAfiliado,
  updateAfiliado,
  deleteAfiliado,
  createAfiliadoAfiliadoOrgMovimiento,
  getQuincenaAplicacion,
  type Afiliado
} from './afiliado.repo.js';
import type { AfiliadoOrg } from '../afiliadoOrg/afiliadoOrg.repo.js';
import type { Movimiento } from '../movimiento/movimiento.repo.js';

export async function getAllAfiliadosService(): Promise<Afiliado[]> {
  return getAllAfiliados();
}

export async function getAfiliadoByIdService(id: number): Promise<Afiliado> {
  const record = await getAfiliadoById(id);
  if (!record) {
    throw new Error('AFILIADO_NOT_FOUND');
  }
  return record;
}

export async function createAfiliadoService(data: Omit<Afiliado, 'id' | 'createdAt' | 'updatedAt'>): Promise<Afiliado> {
  // Check if folio already exists
  // Note: We would need to implement a check for unique folio if required
  return createAfiliado(data);
}

export async function updateAfiliadoService(id: number, data: Partial<Omit<Afiliado, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Afiliado> {
  // Check if record exists
  const existing = await getAfiliadoById(id);
  if (!existing) {
    throw new Error('AFILIADO_NOT_FOUND');
  }
  return updateAfiliado(id, data);
}

export async function deleteAfiliadoService(id: number): Promise<void> {
  // Check if record exists
  const existing = await getAfiliadoById(id);
  if (!existing) {
    throw new Error('AFILIADO_NOT_FOUND');
  }
  return deleteAfiliado(id);
}

export async function createAfiliadoAfiliadoOrgMovimientoService(data: {
  // Afiliado fields
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
  nivel0Id?: number | null;
  nivel1Id?: number | null;
  nivel2Id?: number | null;
  nivel3Id?: number | null;
  claveOrganica0?: string | null;
  claveOrganica1?: string | null;
  claveOrganica2?: string | null;
  claveOrganica3?: string | null;
  internoOrg?: number | null;
  sueldo?: number | null;
  otrasPrestaciones?: number | null;
  quinquenios?: number | null;
  activo?: boolean;
  fechaMovAlt?: string | null;
  orgs1?: string | null;
  orgs2?: string | null;
  orgs3?: string | null;
  orgs4?: string | null;
  dSueldo?: string | null;
  dOtrasPrestaciones?: string | null;
  dQuinquenios?: string | null;
  aplicar?: boolean | null;
  bc?: string | null;
  porcentaje?: number | null;
  quincenaId?: string | null;
  tipoMovimientoId?: number;
  fechaMov?: string | null;
  observaciones?: string | null;
  folioMov?: string | null;
  estatusMov?: string | null;
  creadoPor?: number | null;
}): Promise<{ afiliado: Afiliado; afiliadoOrg: AfiliadoOrg; movimiento: Movimiento }> {
  // Calcular quincena y año basado en claveOrganica para generar fechas automáticamente
  const claveOrganica0 = data.claveOrganica0 || '';
  const claveOrganica1 = data.claveOrganica1;
  const claveOrganica2 = data.claveOrganica2;
  const claveOrganica3 = data.claveOrganica3;
  
  // Importar función de cálculo de quincena
  // const { getQuincenaAplicacion } = await import('./afiliado.repo.js');
  
  // Calcular quincena y año
  const calculatedValues = await getQuincenaAplicacion(
    claveOrganica0,
    claveOrganica1,
    claveOrganica2,
    claveOrganica3,
    data.creadoPor ?? undefined
  );
  
  // Generar fechas basadas en la quincena calculada
  const currentYear = calculatedValues.anio;
  const quincena = calculatedValues.quincena;
  
  // Calcular fecha de la quincena (aproximada)
  const monthFromQuincena = Math.ceil(quincena / 2);
  const dayFromQuincena = (quincena % 2 === 1) ? 15 : 28; // Quincena impar = día 15, par = día 28
  const fechaQuincena = new Date(currentYear, monthFromQuincena - 1, dayFromQuincena).toISOString().split('T')[0];
  
  // Construir quincenaId basado en año y quincena
  const quincenaId = `${currentYear}-${quincena.toString().padStart(2, '0')}`;

  return createAfiliadoAfiliadoOrgMovimiento({
    afiliado: {
      folio: data.folio ?? null,
      apellidoPaterno: data.apellidoPaterno ?? null,
      apellidoMaterno: data.apellidoMaterno ?? null,
      nombre: data.nombre ?? null,
      curp: data.curp ?? null,
      rfc: data.rfc ?? null,
      numeroSeguroSocial: data.numeroSeguroSocial ?? null,
      fechaNacimiento: data.fechaNacimiento ?? null,
      entidadFederativaNacId: data.entidadFederativaNacId ?? null,
      domicilioCalle: data.domicilioCalle ?? null,
      domicilioNumeroExterior: data.domicilioNumeroExterior ?? null,
      domicilioNumeroInterior: data.domicilioNumeroInterior ?? null,
      domicilioEntreCalle1: data.domicilioEntreCalle1 ?? null,
      domicilioEntreCalle2: data.domicilioEntreCalle2 ?? null,
      domicilioColonia: data.domicilioColonia ?? null,
      domicilioCodigoPostal: data.domicilioCodigoPostal ?? null,
      telefono: data.telefono ?? null,
      estadoCivilId: data.estadoCivilId ?? null,
      sexo: data.sexo ?? null,
      correoElectronico: data.correoElectronico ?? null,
      estatus: data.estatus ?? true,
      interno: data.interno ?? null,
      noEmpleado: data.noEmpleado ?? null,
      localidad: data.localidad ?? null,
      municipio: data.municipio ?? null,
      estado: data.estado ?? null,
      pais: data.pais ?? null,
      dependientes: data.dependientes ?? null,
      poseeInmuebles: data.poseeInmuebles ?? null,
      fechaCarta: data.fechaCarta ?? fechaQuincena,
      nacionalidad: data.nacionalidad ?? null,
      fechaAlta: data.fechaAlta ?? fechaQuincena,
      celular: data.celular ?? null,
      expediente: data.expediente ?? null,
      quincenaAplicacion: data.quincenaAplicacion ?? null,
      anioAplicacion: data.anioAplicacion ?? null
    },
    afiliadoOrg: {
      nivel0Id: data.nivel0Id ?? null,
      nivel1Id: data.nivel1Id ?? null,
      nivel2Id: data.nivel2Id ?? null,
      nivel3Id: data.nivel3Id ?? null,
      claveOrganica0: data.claveOrganica0 ?? null,
      claveOrganica1: data.claveOrganica1 ?? null,
      claveOrganica2: data.claveOrganica2 ?? null,
      claveOrganica3: data.claveOrganica3 ?? null,
      interno: data.internoOrg ?? null,
      sueldo: data.sueldo ?? null,
      otrasPrestaciones: data.otrasPrestaciones ?? null,
      quinquenios: data.quinquenios ?? null,
      activo: data.activo ?? true,
      fechaMovAlt: data.fechaMovAlt ?? fechaQuincena,
      orgs1: data.orgs1 ?? null,
      orgs2: data.orgs2 ?? null,
      orgs3: data.orgs3 ?? null,
      orgs4: data.orgs4 ?? null,
      dSueldo: data.dSueldo ?? null,
      dOtrasPrestaciones: data.dOtrasPrestaciones ?? null,
      dQuinquenios: data.dQuinquenios ?? null,
      aplicar: data.aplicar ?? null,
      bc: data.bc ?? null,
      porcentaje: data.porcentaje ?? null
    },
    movimiento: {
      quincenaId: data.quincenaId ?? quincenaId,
      tipoMovimientoId: data.tipoMovimientoId ?? 1,
      fecha: data.fechaMov ?? null,
      observaciones: data.observaciones ?? null,
      folio: data.folioMov ?? null,
      estatus: data.estatusMov ?? null,
      creadoPor: data.creadoPor ?? null
    }
  });
}