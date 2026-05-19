import { ILineaEstrategicaRepository } from '../../domain/repositories/ILineaEstrategicaRepository.js';
import { LineaEstrategicaWithProgramas } from '../../domain/entities/LineaEstrategica.js';
import { LineaEstrategicaNotFoundError } from '../../domain/errors.js';

export class GetLineaEstrategicaWithProgramasQuery {
  constructor(private lineaEstrategicaRepo: ILineaEstrategicaRepository) {}

  async execute(lineaEstrategicaId: number): Promise<LineaEstrategicaWithProgramas> {
    const lineaEstrategica = await this.lineaEstrategicaRepo.getLineaEstrategicaWithProgramas(lineaEstrategicaId);
    if (!lineaEstrategica) {
      throw new LineaEstrategicaNotFoundError(lineaEstrategicaId);
    }
    return lineaEstrategica;
  }
}

