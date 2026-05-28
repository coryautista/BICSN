import { CatalogoPorcentajeFondo, TipoFondoCatalogo } from '../../domain/entities/CatalogoPorcentajeFondo.js';
import { CatalogoPorcentajeFondoNotFoundError } from '../../domain/errors.js';
import { ICatalogoPorcentajeFondoRepository } from '../../domain/repositories/ICatalogoPorcentajeFondoRepository.js';

export class GetUltimoPorcentajeFondoVigenteQuery {
  constructor(private catalogoPorcentajeFondoRepo: ICatalogoPorcentajeFondoRepository) {}

  async execute(tipoFondo: TipoFondoCatalogo): Promise<CatalogoPorcentajeFondo> {
    const record = await this.catalogoPorcentajeFondoRepo.findUltimoVigente(tipoFondo);
    if (!record) throw new CatalogoPorcentajeFondoNotFoundError(`No existe porcentaje vigente para el fondo ${tipoFondo}`);
    return record;
  }
}
