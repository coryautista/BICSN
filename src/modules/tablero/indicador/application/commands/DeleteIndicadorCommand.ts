import { IIndicadorRepository } from '../../domain/repositories/IIndicadorRepository.js';
import { IndicadorNotFoundError, IndicadorInUseError } from '../../domain/errors.js';

export interface DeleteIndicadorInput {
  indicadorId: number;
}

export class DeleteIndicadorCommand {
  constructor(private indicadorRepo: IIndicadorRepository) {}

  async execute(input: DeleteIndicadorInput, tx?: any): Promise<number> {
    const deletedId = await this.indicadorRepo.delete(input.indicadorId, tx);

    if (!deletedId) {
      throw new IndicadorNotFoundError(input.indicadorId);
    }

    return deletedId;
  }
}

