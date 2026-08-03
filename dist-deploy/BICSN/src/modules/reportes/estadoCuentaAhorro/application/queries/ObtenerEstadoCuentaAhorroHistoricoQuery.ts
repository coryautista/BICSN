import { EstadoCuentaAhorro } from '../../domain/entities/EstadoCuentaAhorro.js';
import { IEstadoCuentaAhorroRepository } from '../../domain/repositories/IEstadoCuentaAhorroRepository.js';

export class ObtenerEstadoCuentaAhorroHistoricoQuery {
  constructor(private estadoCuentaAhorroRepo: IEstadoCuentaAhorroRepository) {}

  async execute(idHistorico: number): Promise<EstadoCuentaAhorro | null> {
    return this.estadoCuentaAhorroRepo.obtenerHistorico(idHistorico);
  }
}
