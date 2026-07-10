import { CatalogoMotivoBaja, UpdateCatalogoMotivoBajaData } from '../../domain/entities/CatalogoMotivoBaja.js';
import { ICatalogoMotivoBajaRepository } from '../../domain/repositories/ICatalogoMotivoBajaRepository.js';

export class UpdateCatalogoMotivoBajaCommand {
  constructor(private catalogoMotivoBajaRepo: ICatalogoMotivoBajaRepository) {}

  execute(data: UpdateCatalogoMotivoBajaData): Promise<CatalogoMotivoBaja> {
    return this.catalogoMotivoBajaRepo.update(data);
  }
}
