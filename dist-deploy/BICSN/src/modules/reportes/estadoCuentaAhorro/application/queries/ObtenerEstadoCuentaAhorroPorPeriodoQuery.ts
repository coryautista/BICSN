import { EstadoCuentaAhorro, ParametrosEstadoCuentaAhorro } from '../../domain/entities/EstadoCuentaAhorro.js';
import { IEstadoCuentaAhorroRepository } from '../../domain/repositories/IEstadoCuentaAhorroRepository.js';

export class ObtenerEstadoCuentaAhorroPorPeriodoQuery {
  constructor(private estadoCuentaAhorroRepo: IEstadoCuentaAhorroRepository) {}

  async execute(parametros: ParametrosEstadoCuentaAhorro): Promise<EstadoCuentaAhorro | null> {
    return this.estadoCuentaAhorroRepo.obtenerUltimoHistorico(parametros);
  }
}
