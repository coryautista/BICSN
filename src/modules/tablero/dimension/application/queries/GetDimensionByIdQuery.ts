import { IDimensionRepository } from '../../domain/repositories/IDimensionRepository.js';
import { Dimension } from '../../domain/entities/Dimension.js';
import { DimensionNotFoundError } from '../../domain/errors.js';

export class GetDimensionByIdQuery {
  constructor(private dimensionRepo: IDimensionRepository) {}

  async execute(dimensionId: number): Promise<Dimension> {
    const dimension = await this.dimensionRepo.findById(dimensionId);
    if (!dimension) {
      throw new DimensionNotFoundError(dimensionId);
    }
    return dimension;
  }
}

