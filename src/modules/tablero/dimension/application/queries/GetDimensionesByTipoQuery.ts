import { IDimensionRepository } from '../../domain/repositories/IDimensionRepository.js';
import { Dimension, TipoDimension } from '../../domain/entities/Dimension.js';

export class GetDimensionesByTipoQuery {
  constructor(private dimensionRepo: IDimensionRepository) {}

  async execute(tipoDimension: TipoDimension): Promise<Dimension[]> {
    return await this.dimensionRepo.findByTipo(tipoDimension);
  }
}

