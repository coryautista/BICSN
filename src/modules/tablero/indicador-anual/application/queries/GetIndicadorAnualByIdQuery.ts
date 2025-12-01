import { IIndicadorAnualRepository } from '../../domain/repositories/IIndicadorAnualRepository.js';
import { IndicadorAnualNotFoundError } from '../../domain/errors.js';
import { IndicadorAnualWithRelations } from '../../domain/entities/IndicadorAnual.js';

export interface GetIndicadorAnualByIdInput {
  indicadorAnualId: number;
}

export class GetIndicadorAnualByIdQuery {
  constructor(private indicadorAnualRepo: IIndicadorAnualRepository) {}

  async execute(input: GetIndicadorAnualByIdInput): Promise<IndicadorAnualWithRelations> {
    const indicadorAnual = await this.indicadorAnualRepo.findById(input.indicadorAnualId);

    if (!indicadorAnual) {
      throw new IndicadorAnualNotFoundError(input.indicadorAnualId);
    }

    return indicadorAnual;
  }
}

