import { IDimensionRepository } from '../../domain/repositories/IDimensionRepository.js';
import { Dimension } from '../../domain/entities/Dimension.js';

export class GetAllDimensionesQuery {
  constructor(private dimensionRepo: IDimensionRepository) {}

  async execute(): Promise<Dimension[]> {
    return await this.dimensionRepo.findAll();
  }
}

