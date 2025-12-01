import { IEjeRepository } from '../../domain/repositories/IEjeRepository.js';
import { Eje } from '../../domain/entities/Eje.js';

export class GetAllEjesQuery {
  constructor(private ejeRepo: IEjeRepository) {}

  async execute(): Promise<Eje[]> {
    return await this.ejeRepo.findAll();
  }
}

