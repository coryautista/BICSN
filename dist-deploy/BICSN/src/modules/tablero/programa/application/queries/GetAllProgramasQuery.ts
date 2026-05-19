import { IProgramaRepository } from '../../domain/repositories/IProgramaRepository.js';
import { Programa } from '../../domain/entities/Programa.js';

export class GetAllProgramasQuery {
  constructor(private programaRepo: IProgramaRepository) {}

  async execute(): Promise<Programa[]> {
    return await this.programaRepo.findAll();
  }
}

