export interface Organica1 {
  claveOrganica0: string;
  claveOrganica1: string;
  descripcion?: string;
  titular?: number;
  rfc?: string;
  imss?: string;
  infonavit?: string;
  bancoSar?: string;
  cuentaSar?: string;
  tipoEmpresaSar?: string;
  pcp?: string;
  ph?: string;
  fv?: string;
  fg?: string;
  di?: string;
  fechaRegistro1: Date;
  fechaFin1?: Date;
  usuario?: string;
  estatus: string;
  sar?: string;
}

export interface CreateOrganica1Data {
  claveOrganica0: string;
  claveOrganica1: string;
  descripcion?: string;
  titular?: number;
  rfc?: string;
  imss?: string;
  infonavit?: string;
  bancoSar?: string;
  cuentaSar?: string;
  tipoEmpresaSar?: string;
  pcp?: string;
  ph?: string;
  fv?: string;
  fg?: string;
  di?: string;
  fechaFin1?: Date;
  usuario?: string;
  estatus: string;
  sar?: string;
}

export interface UpdateOrganica1Data {
  descripcion?: string;
  titular?: number;
  rfc?: string;
  imss?: string;
  infonavit?: string;
  bancoSar?: string;
  cuentaSar?: string;
  tipoEmpresaSar?: string;
  pcp?: string;
  ph?: string;
  fv?: string;
  fg?: string;
  di?: string;
  fechaFin1?: Date;
  usuario?: string;
  estatus?: string;
  sar?: string;
}
