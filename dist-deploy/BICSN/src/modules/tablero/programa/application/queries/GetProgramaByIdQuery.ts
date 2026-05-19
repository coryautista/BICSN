import { IProgramaRepository } from '../../domain/repositories/IProgramaRepository.js';
import { Programa } from '../../domain/entities/Programa.js';
import { ProgramaNotFoundError } from '../../domain/errors.js';

export class GetProgramaByIdQuery {
  constructor(private programaRepo: IProgramaRepository) {}

  async execute(programaId: number): Promise<Programa> {
    const programa = await this.programaRepo.findById(programaId);
    if (!programa) {
      throw new ProgramaNotFoundError(programaId);
    }
    return programa;
  }
}

