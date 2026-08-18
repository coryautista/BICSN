import type { ISnapshotCalculoV2Repository } from '../../domain/repositories/ISnapshotCalculoV2Repository.js';
import type { SnapshotDecision, SnapshotDecisionRegistro } from '../../domain/entities/SnapshotCalculoV2Bandeja.js';
import { AportacionFondoDomainError, AportacionFondoError } from '../../domain/errors.js';

export class CreateSnapshotCalculoV2DecisionCommand {
  constructor(private snapshotCalculoV2Repo: ISnapshotCalculoV2Repository) {}

  async execute(snapshotId: string, decision: SnapshotDecision, comentario: string | null, usuarioId: string): Promise<SnapshotDecisionRegistro> {
    const elegibilidad = await this.snapshotCalculoV2Repo.consultarElegibilidadDecision(snapshotId);
    if (elegibilidad === 'NO_ENCONTRADO') {
      throw new AportacionFondoDomainError('Snapshot V2 no encontrado', AportacionFondoError.SNAPSHOT_V2_NO_ENCONTRADO);
    }
    if (elegibilidad === 'NO_DECIDIBLE') {
      throw new AportacionFondoDomainError('Solo se pueden decidir snapshots completos y cerrados', AportacionFondoError.SNAPSHOT_V2_NO_DECIDIBLE);
    }
    const result = await this.snapshotCalculoV2Repo.guardarDecision({ snapshotId, decision, comentario, usuarioId });
    if (!result) {
      throw new AportacionFondoDomainError('Snapshot V2 no encontrado', AportacionFondoError.SNAPSHOT_V2_NO_ENCONTRADO);
    }
    return result;
  }
}
