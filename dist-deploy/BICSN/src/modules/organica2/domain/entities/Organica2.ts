export interface Organica2 {
  claveOrganica0: string;
  claveOrganica1: string;
  claveOrganica2: string;
  descripcion?: string;
  titular?: number;
  fechaRegistro2: Date;
  fechaFin2?: Date;
  usuario?: string;
  estatus: string;
}

export interface CreateOrganica2Data {
  claveOrganica0: string;
  claveOrganica1: string;
  claveOrganica2: string;
  descripcion?: string;
  titular?: number;
  fechaFin2?: Date;
  usuario?: string;
  estatus: string;
}

export interface UpdateOrganica2Data {
  descripcion?: string;
  titular?: number;
  fechaFin2?: Date;
  usuario?: string;
  estatus?: string;
}
