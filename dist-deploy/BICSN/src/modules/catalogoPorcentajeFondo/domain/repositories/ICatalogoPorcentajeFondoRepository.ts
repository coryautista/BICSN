import {
  CatalogoPorcentajeFondo,
  CreateCatalogoPorcentajeFondoData,
  ListCatalogoPorcentajeFondoFilters,
  TipoFondoCatalogo,
  UpdateCatalogoPorcentajeFondoData
} from '../entities/CatalogoPorcentajeFondo.js';

export interface ICatalogoPorcentajeFondoRepository {
  findAll(filters?: ListCatalogoPorcentajeFondoFilters): Promise<CatalogoPorcentajeFondo[]>;
  findById(id: number): Promise<CatalogoPorcentajeFondo | undefined>;
  findUltimoVigente(tipoFondo: TipoFondoCatalogo): Promise<CatalogoPorcentajeFondo | undefined>;
  create(data: CreateCatalogoPorcentajeFondoData): Promise<CatalogoPorcentajeFondo>;
  update(data: UpdateCatalogoPorcentajeFondoData): Promise<CatalogoPorcentajeFondo>;
  deactivate(id: number, usuario?: string | null): Promise<CatalogoPorcentajeFondo>;
}
