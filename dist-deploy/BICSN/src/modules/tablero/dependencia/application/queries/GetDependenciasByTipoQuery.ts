import { IDependenciaRepository } from '../../domain/repositories/IDependenciaRepository.js';
import { Dependencia, TipoDependencia } from '../../domain/entities/Dependencia.js';

export class GetDependenciasByTipoQuery {
  constructor(private dependenciaRepo: IDependenciaRepository) {}

  async execute(tipoDependencia: TipoDependencia): Promise<Dependencia[]> {
    return await this.dependenciaRepo.findByTipo(tipoDependencia);
  }
}

