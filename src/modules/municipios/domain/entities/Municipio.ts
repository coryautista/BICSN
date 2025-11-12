// Domain entity for Municipio
export interface Municipio {
  municipioId: number;
  estadoId: string;
  claveMunicipio: string;
  nombreMunicipio: string;
  esValido: boolean;
}

export interface CreateMunicipioData {
  estadoId: string;
  claveMunicipio: string;
  nombreMunicipio: string;
  esValido: boolean;
  userId?: string;
}

export interface UpdateMunicipioData {
  nombreMunicipio?: string;
  esValido?: boolean;
  userId?: string;
}

export interface DeleteMunicipioData {
  municipioId: number;
}
