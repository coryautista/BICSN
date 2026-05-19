export interface Modulo {
  id: number;
  nombre: string;
  tipo: string;
  icono: string | null;
  orden: number;
}

export interface CreateModuloData {
  nombre: string;
  tipo: string;
  icono?: string | null;
  orden?: number;
}

export interface UpdateModuloData {
  nombre?: string;
  tipo?: string;
  icono?: string | null;
  orden?: number;
}
