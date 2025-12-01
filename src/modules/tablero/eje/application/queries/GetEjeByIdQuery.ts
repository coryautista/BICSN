import { IEjeRepository } from '../../domain/repositories/IEjeRepository.js';
import { Eje } from '../../domain/entities/Eje.js';
import { EjeNotFoundError } from '../../domain/errors.js';

export class GetEjeByIdQuery {
  constructor(private ejeRepo: IEjeRepository) {}

  async execute(ejeId: number): Promise<Eje> {
    const eje = await this.ejeRepo.findById(ejeId);
    if (!eje) {
      throw new EjeNotFoundError(ejeId);
    }
    return eje;
  }
}

