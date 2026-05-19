import { IProgramaRepository } from '../../domain/repositories/IProgramaRepository.js';
import { Programa } from '../../domain/entities/Programa.js';

export class GetProgramasByEjeQuery {
  constructor(private programaRepo: IProgramaRepository) {}

  async execute(ejeId: number): Promise<Programa[]> {
    return await this.programaRepo.findByEje(ejeId);
  }
}

