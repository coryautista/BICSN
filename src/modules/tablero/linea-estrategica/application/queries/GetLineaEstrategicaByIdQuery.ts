import { ILineaEstrategicaRepository } from '../../domain/repositories/ILineaEstrategicaRepository.js';
import { LineaEstrategica } from '../../domain/entities/LineaEstrategica.js';
import { LineaEstrategicaNotFoundError } from '../../domain/errors.js';

export class GetLineaEstrategicaByIdQuery {
  constructor(private lineaEstrategicaRepo: ILineaEstrategicaRepository) {}

  async execute(lineaEstrategicaId: number): Promise<LineaEstrategica> {
    const lineaEstrategica = await this.lineaEstrategicaRepo.findById(lineaEstrategicaId);
    if (!lineaEstrategica) {
      throw new LineaEstrategicaNotFoundError(lineaEstrategicaId);
    }
    return lineaEstrategica;
  }
}

