import { CatalogoMotivoBaja } from '../../domain/entities/CatalogoMotivoBaja.js';
import { ICatalogoMotivoBajaRepository } from '../../domain/repositories/ICatalogoMotivoBajaRepository.js';

export class DeleteCatalogoMotivoBajaCommand {
  constructor(private catalogoMotivoBajaRepo: ICatalogoMotivoBajaRepository) {}

  execute(id: number, usuario?: string | null): Promise<CatalogoMotivoBaja> {
    return this.catalogoMotivoBajaRepo.deactivate(id, usuario);
  }
}
