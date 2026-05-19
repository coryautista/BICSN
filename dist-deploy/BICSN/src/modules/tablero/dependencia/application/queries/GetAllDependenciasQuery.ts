import { IDependenciaRepository } from '../../domain/repositories/IDependenciaRepository.js';
import { Dependencia } from '../../domain/entities/Dependencia.js';

export class GetAllDependenciasQuery {
  constructor(private dependenciaRepo: IDependenciaRepository) {}

  async execute(): Promise<Dependencia[]> {
    return await this.dependenciaRepo.findAll();
  }
}

