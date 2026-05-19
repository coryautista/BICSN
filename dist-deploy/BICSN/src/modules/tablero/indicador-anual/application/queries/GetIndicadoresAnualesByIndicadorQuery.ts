import { IIndicadorAnualRepository } from '../../domain/repositories/IIndicadorAnualRepository.js';
import { IndicadorAnualWithRelations } from '../../domain/entities/IndicadorAnual.js';

export interface GetIndicadoresAnualesByIndicadorInput {
  indicadorId: number;
}

export class GetIndicadoresAnualesByIndicadorQuery {
  constructor(private indicadorAnualRepo: IIndicadorAnualRepository) {}

  async execute(input: GetIndicadoresAnualesByIndicadorInput): Promise<IndicadorAnualWithRelations[]> {
    return await this.indicadorAnualRepo.findByIndicador(input.indicadorId);
  }
}

