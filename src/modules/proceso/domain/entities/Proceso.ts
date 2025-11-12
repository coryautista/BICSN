export interface Proceso {
  id: number;
  nombre: string;
  componente: string;
  idModulo: number;
  orden: number;
  tipo: string;
}

export interface CreateProcesoData {
  nombre: string;
  componente: string;
  idModulo: number;
  orden: number;
  tipo: string;
}

export interface UpdateProcesoData {
  nombre?: string;
  componente?: string;
  idModulo?: number;
  orden?: number;
  tipo?: string;
}

export interface DeleteProcesoData {
  id: number;
}
