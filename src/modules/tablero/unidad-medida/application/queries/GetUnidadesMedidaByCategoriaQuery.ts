import { IUnidadMedidaRepository } from '../../domain/repositories/IUnidadMedidaRepository.js';
import { UnidadMedida, CategoriaUnidadMedida } from '../../domain/entities/UnidadMedida.js';

export class GetUnidadesMedidaByCategoriaQuery {
  constructor(private unidadMedidaRepo: IUnidadMedidaRepository) {}

  async execute(categoria: CategoriaUnidadMedida): Promise<UnidadMedida[]> {
    return await this.unidadMedidaRepo.findByCategoria(categoria);
  }
}

