export type TipoFondoCatalogo = 'ahorro' | 'vivienda' | 'prestaciones' | 'cair';

export interface CatalogoPorcentajeFondo {
  catalogoPorcentajeFondoId: number;
  tipoFondo: TipoFondoCatalogo;
  anioVigencia: number;
  porcentajePatron: number;
  porcentajeAfiliado: number | null;
  vigente: boolean;
  observaciones: string | null;
  createdAt: string;
  updatedAt: string | null;
  createdBy: string | null;
  updatedBy: string | null;
}

export interface ListCatalogoPorcentajeFondoFilters {
  tipoFondo?: TipoFondoCatalogo;
  anioVigencia?: number;
  vigente?: boolean;
}

export interface CreateCatalogoPorcentajeFondoData {
  tipoFondo: TipoFondoCatalogo;
  anioVigencia: number;
  porcentajePatron: number;
  porcentajeAfiliado?: number | null;
  vigente?: boolean;
  observaciones?: string | null;
  usuario?: string | null;
}

export interface UpdateCatalogoPorcentajeFondoData {
  catalogoPorcentajeFondoId: number;
  anioVigencia?: number;
  porcentajePatron?: number;
  porcentajeAfiliado?: number | null;
  vigente?: boolean;
  observaciones?: string | null;
  usuario?: string | null;
}
