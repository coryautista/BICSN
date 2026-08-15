import { ParametrosReporteRevision, ReporteRevision } from '../../domain/Revision.types.js';
import { RevisionRepository } from '../../infrastructure/persistence/RevisionRepository.js';

export class ObtenerReporteRevisionQuery {
  constructor(private revisionRepo: RevisionRepository) {}

  async execute(parametros: ParametrosReporteRevision): Promise<ReporteRevision | null> {
    return this.revisionRepo.obtenerReporte(parametros);
  }
}
