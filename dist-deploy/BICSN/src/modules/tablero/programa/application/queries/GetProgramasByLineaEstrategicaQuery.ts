import { IProgramaRepository } from '../../domain/repositories/IProgramaRepository.js';
import { Programa } from '../../domain/entities/Programa.js';

export class GetProgramasByLineaEstrategicaQuery {
  constructor(private programaRepo: IProgramaRepository) {}

  async execute(lineaEstrategicaId: number): Promise<Programa[]> {
    return await this.programaRepo.findByLineaEstrategica(lineaEstrategicaId);
  }
}

