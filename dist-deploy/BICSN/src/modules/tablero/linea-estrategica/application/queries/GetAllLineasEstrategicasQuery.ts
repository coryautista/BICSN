import { ILineaEstrategicaRepository } from '../../domain/repositories/ILineaEstrategicaRepository.js';
import { LineaEstrategica } from '../../domain/entities/LineaEstrategica.js';

export class GetAllLineasEstrategicasQuery {
  constructor(private lineaEstrategicaRepo: ILineaEstrategicaRepository) {}

  async execute(): Promise<LineaEstrategica[]> {
    return await this.lineaEstrategicaRepo.findAll();
  }
}

