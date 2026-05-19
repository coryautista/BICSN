import { IIndicadorAnualRepository } from '../../domain/repositories/IIndicadorAnualRepository.js';
import { IndicadorAnualNotFoundError } from '../../domain/errors.js';
import { IndicadorAnual } from '../../domain/entities/IndicadorAnual.js';

export interface UpdateIndicadorAnualInput {
  indicadorAnualId: number;
  enero?: number;
  febrero?: number;
  marzo?: number;
  abril?: number;
  mayo?: number;
  junio?: number;
  julio?: number;
  agosto?: number;
  septiembre?: number;
  octubre?: number;
  noviembre?: number;
  diciembre?: number;
  metaAnual?: number;
  observaciones?: string;
  userId?: string;
}

export class UpdateIndicadorAnualCommand {
  constructor(private indicadorAnualRepo: IIndicadorAnualRepository) {}

  async execute(input: UpdateIndicadorAnualInput, tx?: any): Promise<IndicadorAnual> {
    const indicadorAnual = await this.indicadorAnualRepo.update(
      input.indicadorAnualId,
      input.enero,
      input.febrero,
      input.marzo,
      input.abril,
      input.mayo,
      input.junio,
      input.julio,
      input.agosto,
      input.septiembre,
      input.octubre,
      input.noviembre,
      input.diciembre,
      input.metaAnual,
      input.observaciones,
      input.userId,
      tx
    );

    if (!indicadorAnual) {
      throw new IndicadorAnualNotFoundError(input.indicadorAnualId);
    }

    return indicadorAnual;
  }
}

