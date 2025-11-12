export interface TipoMovimiento {
  id: number;
  abreviatura: string | null;
  nombre: string;
}

export interface CreateTipoMovimientoData {
  id: number;
  abreviatura: string | null;
  nombre: string;
}

export interface UpdateTipoMovimientoData {
  id: number;
  abreviatura?: string | null;
  nombre?: string;
}

export interface DeleteTipoMovimientoData {
  id: number;
}
