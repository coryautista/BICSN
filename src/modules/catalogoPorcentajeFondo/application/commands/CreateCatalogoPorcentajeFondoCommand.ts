import { CatalogoPorcentajeFondo, CreateCatalogoPorcentajeFondoData } from '../../domain/entities/CatalogoPorcentajeFondo.js';
import { ICatalogoPorcentajeFondoRepository } from '../../domain/repositories/ICatalogoPorcentajeFondoRepository.js';

export class CreateCatalogoPorcentajeFondoCommand {
  constructor(private catalogoPorcentajeFondoRepo: ICatalogoPorcentajeFondoRepository) {}

  execute(data: CreateCatalogoPorcentajeFondoData): Promise<CatalogoPorcentajeFondo> {
    return this.catalogoPorcentajeFondoRepo.create(data);
  }
}
