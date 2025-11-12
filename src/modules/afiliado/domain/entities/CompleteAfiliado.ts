import { Afiliado } from '../../../afiliado/domain/entities/Afiliado.js';
import { AfiliadoOrg } from '../../../afiliadoOrg/domain/entities/AfiliadoOrg.js';
import { Movimiento } from '../../../movimiento/domain/entities/Movimiento.js';

export interface CreateCompleteAfiliadoData {
  afiliado: {
    folio?: number | null;
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
    quincenaAplicacion?: number | null;
    anioAplicacion?: number | null;
  };
  afiliadoOrg: {
    nivel0Id: number | null;
    nivel1Id: number | null;
    nivel2Id: number | null;
    nivel3Id: number | null;
    claveOrganica0: string | null;
    claveOrganica1: string | null;
    claveOrganica2: string | null;
    claveOrganica3: string | null;
    interno: number | null;
    sueldo: number | null;
    otrasPrestaciones: number | null;
    quinquenios: number | null;
    activo: boolean;
    fechaMovAlt: string | null;
    orgs1: string | null;
    orgs2: string | null;
    orgs3: string | null;
    orgs4: string | null;
    dSueldo: string | null;
    dOtrasPrestaciones: string | null;
    dQuinquenios: string | null;
    aplicar: boolean | null;
    bc: string | null;
    porcentaje: number | null;
  };
  movimiento: {
    quincenaId?: string | null;
    tipoMovimientoId: number;
    fecha: string | null;
    observaciones: string | null;
    folio: string | null;
    estatus: string | null;
    creadoPor: number | null;
    creadoPorUid: string | null;
  };
}

export interface CompleteAfiliadoResult {
  afiliado: Afiliado;
  afiliadoOrg: AfiliadoOrg;
  movimiento: Movimiento;
}
