export interface Calle {
  calleId: number;
  coloniaId: number;
  nombreCalle: string;
  esValido: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  createdBy: string | null;
  updatedBy: string | null;
}

export interface CalleDetailed extends Calle {
  colonia: {
    coloniaId: number;
    nombreColonia: string;
    tipoAsentamiento: string;
  };
  municipio: {
    municipioId: number;
    nombreMunicipio: string;
  };
  codigoPostal: {
    codigoPostalId: number;
    codigoPostal: string;
  };
  estado: {
    estadoId: string;
    nombreEstado: string;
  };
}

export interface CreateCalleData {
  coloniaId: number;
  nombreCalle: string;
  esValido: boolean;
  userId?: string;
}

export interface UpdateCalleData {
  calleId: number;
  nombreCalle?: string;
  esValido?: boolean;
  userId?: string;
}

export interface DeleteCalleData {
  calleId: number;
}

export interface SearchCallesFilters {
  estadoId?: string;
  municipioId?: number;
  coloniaId?: number;
  codigoPostal?: string;
  nombreCalle?: string;
  esValido?: boolean;
  limit?: number;
  offset?: number;
}
