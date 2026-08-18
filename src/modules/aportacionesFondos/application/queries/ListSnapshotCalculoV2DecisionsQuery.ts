import type { ISnapshotCalculoV2Repository } from '../../domain/repositories/ISnapshotCalculoV2Repository.js';
import type { SnapshotDecisionRegistro } from '../../domain/entities/SnapshotCalculoV2Bandeja.js';

export type SnapshotDecisionHistory = {
  datos: SnapshotDecisionRegistro[];
  total: number;
  ultimaDecision: SnapshotDecisionRegistro | null;
};

export class ListSnapshotCalculoV2DecisionsQuery {
  constructor(private snapshotCalculoV2Repo: ISnapshotCalculoV2Repository) {}

  async execute(snapshotId: string): Promise<SnapshotDecisionHistory | null> {
    const datos = await this.snapshotCalculoV2Repo.listarDecisiones(snapshotId);
    if (!datos) return null;
    return { datos, total: datos.length, ultimaDecision: datos[0] ?? null };
  }
}
