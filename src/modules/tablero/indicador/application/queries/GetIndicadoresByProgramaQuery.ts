import { IIndicadorRepository } from '../../domain/repositories/IIndicadorRepository.js';
import { IndicadorWithRelations } from '../../domain/entities/Indicador.js';

export interface GetIndicadoresByProgramaInput {
  programaId: number;
}

export class GetIndicadoresByProgramaQuery {
  constructor(private indicadorRepo: IIndicadorRepository) {}

  async execute(input: GetIndicadoresByProgramaInput): Promise<IndicadorWithRelations[]> {
    return await this.indicadorRepo.findByPrograma(input.programaId);
  }
}

