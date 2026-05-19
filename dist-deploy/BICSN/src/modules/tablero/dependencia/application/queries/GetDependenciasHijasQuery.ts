import { IDependenciaRepository } from '../../domain/repositories/IDependenciaRepository.js';
import { Dependencia } from '../../domain/entities/Dependencia.js';

export class GetDependenciasHijasQuery {
  constructor(private dependenciaRepo: IDependenciaRepository) {}

  async execute(dependenciaPadreId: number): Promise<Dependencia[]> {
    return await this.dependenciaRepo.findHijas(dependenciaPadreId);
  }
}

