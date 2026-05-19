import { IIndicadorRepository } from '../../domain/repositories/IIndicadorRepository.js';
import { IndicadorWithRelations } from '../../domain/entities/Indicador.js';

export interface GetIndicadoresByEjeInput {
  ejeId: number;
}

export class GetIndicadoresByEjeQuery {
  constructor(private indicadorRepo: IIndicadorRepository) {}

  async execute(input: GetIndicadoresByEjeInput): Promise<IndicadorWithRelations[]> {
    return await this.indicadorRepo.findByEje(input.ejeId);
  }
}

