// Domain entity for ORGANICA_3 table
export interface Organica3 {
  claveOrganica0: string;
  claveOrganica1: string;
  claveOrganica2: string;
  claveOrganica3: string;
  descripcion?: string;
  titular?: number;
  calleNum?: string;
  fraccionamiento?: string;
  codigoPostal?: string;
  telefono?: string;
  fax?: string;
  localidad?: string;
  municipio?: number;
  estado?: number;
  fechaRegistro3: Date;
  fechaFin3?: Date;
  usuario?: string;
  estatus: string;
}

export interface CreateOrganica3Data {
  claveOrganica0: string;
  claveOrganica1: string;
  claveOrganica2: string;
  claveOrganica3: string;
  descripcion?: string;
  titular?: number;
  calleNum?: string;
  fraccionamiento?: string;
  codigoPostal?: string;
  telefono?: string;
  fax?: string;
  localidad?: string;
  municipio?: number;
  estado?: number;
  fechaFin3?: Date;
  usuario?: string;
  estatus: string;
}

export interface UpdateOrganica3Data {
  descripcion?: string;
  titular?: number;
  calleNum?: string;
  fraccionamiento?: string;
  codigoPostal?: string;
  telefono?: string;
  fax?: string;
  localidad?: string;
  municipio?: number;
  estado?: number;
  fechaFin3?: Date;
  usuario?: string;
  estatus?: string;
}
