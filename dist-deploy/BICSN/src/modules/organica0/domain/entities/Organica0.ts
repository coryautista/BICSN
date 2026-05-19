export interface Organica0 {
  claveOrganica: string;
  nombreOrganica: string;
  usuario?: string;
  fechaRegistro: Date;
  fechaFin?: Date;
  estatus: string;
}

export interface CreateOrganica0Data {
  claveOrganica: string;
  nombreOrganica: string;
  usuario?: string;
  fechaFin?: Date;
  estatus: string;
}

export interface UpdateOrganica0Data {
  nombreOrganica?: string;
  usuario?: string;
  fechaFin?: Date;
  estatus?: string;
}
