import { IUnidadMedidaRepository } from '../../domain/repositories/IUnidadMedidaRepository.js';
import { UnidadMedida } from '../../domain/entities/UnidadMedida.js';
import { UnidadMedidaNotFoundError } from '../../domain/errors.js';

export class GetUnidadMedidaByIdQuery {
  constructor(private unidadMedidaRepo: IUnidadMedidaRepository) {}

  async execute(unidadMedidaId: number): Promise<UnidadMedida> {
    const unidadMedida = await this.unidadMedidaRepo.findById(unidadMedidaId);
    if (!unidadMedida) {
      throw new UnidadMedidaNotFoundError(unidadMedidaId);
    }
    return unidadMedida;
  }
}

