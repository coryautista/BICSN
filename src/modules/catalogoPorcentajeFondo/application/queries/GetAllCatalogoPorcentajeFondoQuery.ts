import { CatalogoPorcentajeFondo, ListCatalogoPorcentajeFondoFilters } from '../../domain/entities/CatalogoPorcentajeFondo.js';
import { ICatalogoPorcentajeFondoRepository } from '../../domain/repositories/ICatalogoPorcentajeFondoRepository.js';

export class GetAllCatalogoPorcentajeFondoQuery {
  constructor(private catalogoPorcentajeFondoRepo: ICatalogoPorcentajeFondoRepository) {}

  execute(filters: ListCatalogoPorcentajeFondoFilters): Promise<CatalogoPorcentajeFondo[]> {
    return this.catalogoPorcentajeFondoRepo.findAll(filters);
  }
}
