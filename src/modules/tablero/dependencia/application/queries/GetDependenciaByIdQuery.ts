import { IDependenciaRepository } from '../../domain/repositories/IDependenciaRepository.js';
import { Dependencia } from '../../domain/entities/Dependencia.js';
import { DependenciaNotFoundError } from '../../domain/errors.js';

export class GetDependenciaByIdQuery {
  constructor(private dependenciaRepo: IDependenciaRepository) {}

  async execute(dependenciaId: number): Promise<Dependencia> {
    const dependencia = await this.dependenciaRepo.findById(dependenciaId);
    if (!dependencia) {
      throw new DependenciaNotFoundError(dependenciaId);
    }
    return dependencia;
  }
}

