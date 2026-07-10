import { CatalogoMotivoBaja, ListCatalogoMotivoBajaFilters } from '../../domain/entities/CatalogoMotivoBaja.js';
import { ICatalogoMotivoBajaRepository } from '../../domain/repositories/ICatalogoMotivoBajaRepository.js';

export class GetAllCatalogoMotivoBajaQuery {
  constructor(private catalogoMotivoBajaRepo: ICatalogoMotivoBajaRepository) {}

  execute(filters: ListCatalogoMotivoBajaFilters): Promise<CatalogoMotivoBaja[]> {
    return this.catalogoMotivoBajaRepo.findAll(filters);
  }
}
