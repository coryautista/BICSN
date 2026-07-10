import { CatalogoMotivoBaja, CreateCatalogoMotivoBajaData } from '../../domain/entities/CatalogoMotivoBaja.js';
import { ICatalogoMotivoBajaRepository } from '../../domain/repositories/ICatalogoMotivoBajaRepository.js';

export class CreateCatalogoMotivoBajaCommand {
  constructor(private catalogoMotivoBajaRepo: ICatalogoMotivoBajaRepository) {}

  execute(data: CreateCatalogoMotivoBajaData): Promise<CatalogoMotivoBaja> {
    return this.catalogoMotivoBajaRepo.create(data);
  }
}
