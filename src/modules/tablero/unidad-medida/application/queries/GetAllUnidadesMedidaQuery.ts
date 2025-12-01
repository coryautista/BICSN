import { IUnidadMedidaRepository } from '../../domain/repositories/IUnidadMedidaRepository.js';
import { UnidadMedida } from '../../domain/entities/UnidadMedida.js';

export class GetAllUnidadesMedidaQuery {
  constructor(private unidadMedidaRepo: IUnidadMedidaRepository) {}

  async execute(): Promise<UnidadMedida[]> {
    return await this.unidadMedidaRepo.findAll();
  }
}

