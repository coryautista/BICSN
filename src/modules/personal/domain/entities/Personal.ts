// Domain entity for PERSONAL table
export interface Personal {
  interno: number;
  curp: string | null;
  rfc: string | null;
  noempleado: string | null;
  nombre: string | null;
  apellido_paterno: string | null;
  apellido_materno: string | null;
  fecha_nacimiento: string | null;
  seguro_social: string | null;
  calle_numero: string | null;
  fraccionamiento: string | null;
  codigo_postal: string | null;
  telefono: string | null;
  sexo: string | null;
  estado_civil: string | null;
  localidad: string | null;
  municipio: number | null;
  estado: number | null;
  pais: number | null;
  dependientes: number | null;
  posee_inmuebles: string | null;
  fecha_carta: string | null;
  email: string | null;
  nacionalidad: string | null;
  fecha_alta: string | null;
  celular: string | null;
  expediente: string | null;
  f_expediente: string | null;
  fullname: string | null;
}

export type CreatePersonalData = Omit<Personal, 'fullname'>;
export type UpdatePersonalData = Partial<Omit<Personal, 'interno' | 'fullname'>>;
