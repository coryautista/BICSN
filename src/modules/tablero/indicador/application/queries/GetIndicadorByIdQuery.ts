import { IIndicadorRepository } from '../../domain/repositories/IIndicadorRepository.js';
import { IndicadorNotFoundError } from '../../domain/errors.js';
import { IndicadorWithRelations } from '../../domain/entities/Indicador.js';

export interface GetIndicadorByIdInput {
  indicadorId: number;
}

export class GetIndicadorByIdQuery {
  constructor(private indicadorRepo: IIndicadorRepository) {}

  async execute(input: GetIndicadorByIdInput): Promise<IndicadorWithRelations> {
    const indicador = await this.indicadorRepo.findById(input.indicadorId);

    if (!indicador) {
      throw new IndicadorNotFoundError(input.indicadorId);
    }

    return indicador;
  }
}

