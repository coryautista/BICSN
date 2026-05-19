import { IIndicadorAnualRepository } from '../../domain/repositories/IIndicadorAnualRepository.js';
import { IndicadorAnualAlreadyExistsError } from '../../domain/errors.js';
import { IndicadorAnual } from '../../domain/entities/IndicadorAnual.js';
import { IndicadorNotFoundError } from '../../../indicador/domain/errors.js';

export interface CreateIndicadorAnualInput {
  idIndicador: number;
  anio: number;
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

export class CreateIndicadorAnualCommand {
  constructor(private indicadorAnualRepo: IIndicadorAnualRepository) {}

  async execute(input: CreateIndicadorAnualInput, tx?: any): Promise<IndicadorAnual> {
    // Validación de entrada
    if (!input.idIndicador || input.idIndicador <= 0) {
      throw new IndicadorNotFoundError(input.idIndicador);
    }
    if (!input.anio || input.anio < 2000 || input.anio > 2100) {
      throw new Error('El año debe estar entre 2000 y 2100');
    }

    try {
      return await this.indicadorAnualRepo.create(
        input.idIndicador,
        input.anio,
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
    } catch (error: any) {
      if (error.message?.includes('FOREIGN KEY constraint')) {
        throw new IndicadorNotFoundError(input.idIndicador);
      }
      if (error.message?.includes('Violation of PRIMARY KEY constraint')) {
        throw new IndicadorAnualAlreadyExistsError(`Indicador ${input.idIndicador} - Año ${input.anio}`);
      }
      throw error;
    }
  }
}

