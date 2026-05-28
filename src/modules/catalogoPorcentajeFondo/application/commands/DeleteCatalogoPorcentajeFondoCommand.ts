import { CatalogoPorcentajeFondo } from '../../domain/entities/CatalogoPorcentajeFondo.js';
import { ICatalogoPorcentajeFondoRepository } from '../../domain/repositories/ICatalogoPorcentajeFondoRepository.js';

export class DeleteCatalogoPorcentajeFondoCommand {
  constructor(private catalogoPorcentajeFondoRepo: ICatalogoPorcentajeFondoRepository) {}

  execute(id: number, usuario?: string | null): Promise<CatalogoPorcentajeFondo> {
    return this.catalogoPorcentajeFondoRepo.deactivate(id, usuario);
  }
}
