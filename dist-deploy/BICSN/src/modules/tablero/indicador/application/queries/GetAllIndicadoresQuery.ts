import { IIndicadorRepository } from '../../domain/repositories/IIndicadorRepository.js';
import { IndicadorWithRelations } from '../../domain/entities/Indicador.js';

export class GetAllIndicadoresQuery {
  constructor(private indicadorRepo: IIndicadorRepository) {}

  async execute(): Promise<IndicadorWithRelations[]> {
    return await this.indicadorRepo.findAll();
  }
}

