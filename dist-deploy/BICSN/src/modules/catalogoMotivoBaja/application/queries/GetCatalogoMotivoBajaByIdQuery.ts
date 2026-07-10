import { CatalogoMotivoBajaNotFoundError } from '../../domain/errors.js';
import { CatalogoMotivoBaja } from '../../domain/entities/CatalogoMotivoBaja.js';
import { ICatalogoMotivoBajaRepository } from '../../domain/repositories/ICatalogoMotivoBajaRepository.js';

export class GetCatalogoMotivoBajaByIdQuery {
  constructor(private catalogoMotivoBajaRepo: ICatalogoMotivoBajaRepository) {}

  async execute(id: number): Promise<CatalogoMotivoBaja> {
    const item = await this.catalogoMotivoBajaRepo.findById(id);
    if (!item) throw new CatalogoMotivoBajaNotFoundError();
    return item;
  }
}
