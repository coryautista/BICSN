export interface CatalogoMotivoBaja {
  motivoBajaId: number;
  clave: string;
  nombre: string;
  descripcion: string | null;
  aplicaBajaPermanente: boolean;
  aplicaSuspension: boolean;
  requiereObservaciones: boolean;
  activo: boolean;
  orden: number;
  createdAt: string;
  updatedAt: string | null;
  createdBy: string | null;
  updatedBy: string | null;
}

export interface ListCatalogoMotivoBajaFilters {
  activo?: boolean;
  aplicaBajaPermanente?: boolean;
  aplicaSuspension?: boolean;
  requiereObservaciones?: boolean;
  search?: string;
}

export interface CreateCatalogoMotivoBajaData {
  clave: string;
  nombre: string;
  descripcion?: string | null;
  aplicaBajaPermanente?: boolean;
  aplicaSuspension?: boolean;
  requiereObservaciones?: boolean;
  activo?: boolean;
  orden?: number;
  usuario?: string | null;
}

export interface UpdateCatalogoMotivoBajaData {
  motivoBajaId: number;
  clave?: string;
  nombre?: string;
  descripcion?: string | null;
  aplicaBajaPermanente?: boolean;
  aplicaSuspension?: boolean;
  requiereObservaciones?: boolean;
  activo?: boolean;
  orden?: number;
  usuario?: string | null;
}
