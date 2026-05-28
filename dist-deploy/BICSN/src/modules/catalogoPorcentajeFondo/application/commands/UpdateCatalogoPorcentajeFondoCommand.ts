import { CatalogoPorcentajeFondo, UpdateCatalogoPorcentajeFondoData } from '../../domain/entities/CatalogoPorcentajeFondo.js';
import { ICatalogoPorcentajeFondoRepository } from '../../domain/repositories/ICatalogoPorcentajeFondoRepository.js';

export class UpdateCatalogoPorcentajeFondoCommand {
  constructor(private catalogoPorcentajeFondoRepo: ICatalogoPorcentajeFondoRepository) {}

  execute(data: UpdateCatalogoPorcentajeFondoData): Promise<CatalogoPorcentajeFondo> {
    return this.catalogoPorcentajeFondoRepo.update(data);
  }
}
