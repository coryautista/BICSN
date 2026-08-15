import {
  GuardarAjusteRevisionData,
  GuardarAjusteRevisionResultado
} from '../../domain/Revision.types.js';
import { RevisionRepository } from '../../infrastructure/persistence/RevisionRepository.js';

export class GuardarAjusteRevisionCommand {
  constructor(private revisionRepo: RevisionRepository) {}

  async execute(data: GuardarAjusteRevisionData): Promise<GuardarAjusteRevisionResultado> {
    return this.revisionRepo.guardarAjuste(data);
  }
}
