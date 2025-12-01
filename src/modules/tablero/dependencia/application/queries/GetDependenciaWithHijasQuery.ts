import { IDependenciaRepository } from '../../domain/repositories/IDependenciaRepository.js';
import { DependenciaWithHijas } from '../../domain/entities/Dependencia.js';
import { DependenciaNotFoundError } from '../../domain/errors.js';

export class GetDependenciaWithHijasQuery {
  constructor(private dependenciaRepo: IDependenciaRepository) {}

  async execute(dependenciaId: number): Promise<DependenciaWithHijas> {
    const dependencia = await this.dependenciaRepo.getDependenciaWithHijas(dependenciaId);
    if (!dependencia) {
      throw new DependenciaNotFoundError(dependenciaId);
    }
    return dependencia;
  }
}

