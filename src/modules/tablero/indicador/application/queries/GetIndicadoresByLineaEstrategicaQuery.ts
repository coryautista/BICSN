import { IIndicadorRepository } from '../../domain/repositories/IIndicadorRepository.js';
import { IndicadorWithRelations } from '../../domain/entities/Indicador.js';

export interface GetIndicadoresByLineaEstrategicaInput {
  lineaEstrategicaId: number;
}

export class GetIndicadoresByLineaEstrategicaQuery {
  constructor(private indicadorRepo: IIndicadorRepository) {}

  async execute(input: GetIndicadoresByLineaEstrategicaInput): Promise<IndicadorWithRelations[]> {
    return await this.indicadorRepo.findByLineaEstrategica(input.lineaEstrategicaId);
  }
}

