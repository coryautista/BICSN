import type { ISnapshotCalculoV2Repository } from '../../domain/repositories/ISnapshotCalculoV2Repository.js';
import type {
  SnapshotCalculoV2ConsultaFiltro,
  SnapshotCalculoV2ConsultaResultado
} from '../../domain/entities/SnapshotCalculoV2Consulta.js';
import { compararSnapshotCalculoV2 } from '../../domain/services/SnapshotCalculoV2Comparison.js';

export class GetSnapshotCalculoV2Query {
  constructor(private snapshotCalculoV2Repo: ISnapshotCalculoV2Repository) {}

  async execute(filtro: SnapshotCalculoV2ConsultaFiltro): Promise<SnapshotCalculoV2ConsultaResultado | null> {
    const raw = await this.snapshotCalculoV2Repo.consultar(filtro);
    return raw ? compararSnapshotCalculoV2(raw) : null;
  }
}
