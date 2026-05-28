import { CatalogoPorcentajeFondo } from '../../domain/entities/CatalogoPorcentajeFondo.js';
import { CatalogoPorcentajeFondoNotFoundError } from '../../domain/errors.js';
import { ICatalogoPorcentajeFondoRepository } from '../../domain/repositories/ICatalogoPorcentajeFondoRepository.js';

export class GetCatalogoPorcentajeFondoByIdQuery {
  constructor(private catalogoPorcentajeFondoRepo: ICatalogoPorcentajeFondoRepository) {}

  async execute(id: number): Promise<CatalogoPorcentajeFondo> {
    const record = await this.catalogoPorcentajeFondoRepo.findById(id);
    if (!record) throw new CatalogoPorcentajeFondoNotFoundError();
    return record;
  }
}
