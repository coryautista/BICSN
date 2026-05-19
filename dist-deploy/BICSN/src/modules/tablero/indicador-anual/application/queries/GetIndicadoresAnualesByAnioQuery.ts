import { IIndicadorAnualRepository } from '../../domain/repositories/IIndicadorAnualRepository.js';
import { IndicadorAnualWithRelations } from '../../domain/entities/IndicadorAnual.js';

export interface GetIndicadoresAnualesByAnioInput {
  anio: number;
}

export class GetIndicadoresAnualesByAnioQuery {
  constructor(private indicadorAnualRepo: IIndicadorAnualRepository) {}

  async execute(input: GetIndicadoresAnualesByAnioInput): Promise<IndicadorAnualWithRelations[]> {
    return await this.indicadorAnualRepo.findByAnio(input.anio);
  }
}

