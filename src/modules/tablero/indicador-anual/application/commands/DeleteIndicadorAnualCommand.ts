import { IIndicadorAnualRepository } from '../../domain/repositories/IIndicadorAnualRepository.js';
import { IndicadorAnualNotFoundError } from '../../domain/errors.js';

export interface DeleteIndicadorAnualInput {
  indicadorAnualId: number;
}

export class DeleteIndicadorAnualCommand {
  constructor(private indicadorAnualRepo: IIndicadorAnualRepository) {}

  async execute(input: DeleteIndicadorAnualInput, tx?: any): Promise<number> {
    const deletedId = await this.indicadorAnualRepo.delete(input.indicadorAnualId, tx);

    if (!deletedId) {
      throw new IndicadorAnualNotFoundError(input.indicadorAnualId);
    }

    return deletedId;
  }
}

