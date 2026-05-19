import { ILineaEstrategicaRepository } from '../../domain/repositories/ILineaEstrategicaRepository.js';
import { LineaEstrategica } from '../../domain/entities/LineaEstrategica.js';

export class GetLineasEstrategicasByEjeQuery {
  constructor(private lineaEstrategicaRepo: ILineaEstrategicaRepository) {}

  async execute(ejeId: number): Promise<LineaEstrategica[]> {
    return await this.lineaEstrategicaRepo.findByEje(ejeId);
  }
}

