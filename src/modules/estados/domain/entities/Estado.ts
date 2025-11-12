export interface Estado {
  estadoId: string;
  nombreEstado: string;
  esValido: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
}

export interface CreateEstadoData {
  estadoId: string;
  nombreEstado: string;
  esValido: boolean;
  userId?: string;
}

export interface UpdateEstadoData {
  estadoId: string;
  nombreEstado?: string;
  esValido?: boolean;
  userId?: string;
}

export interface DeleteEstadoData {
  estadoId: string;
}
