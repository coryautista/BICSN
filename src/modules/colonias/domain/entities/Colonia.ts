export interface Colonia {
  coloniaId: number;
  municipioId: number;
  codigoPostalId: number;
  nombreColonia: string;
  tipoAsentamiento?: string;
  esValido: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
  codigoPostal?: {
    codigoPostalId: number;
    codigoPostal: string;
  };
}

export interface ColoniaDetailed extends Colonia {
  municipio: {
    municipioId: number;
    nombreMunicipio: string;
  };
  estado: {
    estadoId: string;
    nombreEstado: string;
  };
}

export interface CreateColoniaData {
  municipioId: number;
  codigoPostalId: number;
  nombreColonia: string;
  tipoAsentamiento?: string;
  esValido: boolean;
  userId?: string;
}

export interface UpdateColoniaData {
  coloniaId: number;
  nombreColonia?: string;
  tipoAsentamiento?: string;
  esValido?: boolean;
  userId?: string;
}

export interface DeleteColoniaData {
  coloniaId: number;
}

export interface SearchColoniasFilters {
  nombreColonia: string;
}
