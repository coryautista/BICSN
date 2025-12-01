import { IEjeRepository } from '../../domain/repositories/IEjeRepository.js';
import { EjeWithLineas } from '../../domain/entities/Eje.js';
import { EjeNotFoundError } from '../../domain/errors.js';

export class GetEjeWithLineasQuery {
  constructor(private ejeRepo: IEjeRepository) {}

  async execute(ejeId: number): Promise<EjeWithLineas> {
    const eje = await this.ejeRepo.getEjeWithLineasEstrategicas(ejeId);
    if (!eje) {
      throw new EjeNotFoundError(ejeId);
    }
    return eje;
  }
}

