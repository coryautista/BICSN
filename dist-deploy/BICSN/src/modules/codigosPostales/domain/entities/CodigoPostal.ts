export interface CodigoPostal {
  codigoPostalId: number;
  codigoPostal: string;
  esValido: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
}

export interface CreateCodigoPostalData {
  codigoPostal: string;
  esValido: boolean;
  userId?: string;
}

export interface UpdateCodigoPostalData {
  codigoPostalId: number;
  esValido?: boolean;
  userId?: string;
}

export interface DeleteCodigoPostalData {
  codigoPostalId: number;
}
