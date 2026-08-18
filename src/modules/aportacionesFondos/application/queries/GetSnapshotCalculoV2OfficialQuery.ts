import type { ISnapshotCalculoV2Repository } from '../../domain/repositories/ISnapshotCalculoV2Repository.js';
import type {
  SnapshotLecturaOficialFiltro,
  SnapshotLecturaOficialResultado
} from '../../domain/entities/SnapshotCalculoV2Official.js';
import { obtenerMotivoFallback } from '../../domain/entities/SnapshotCalculoV2Official.js';

export class GetSnapshotCalculoV2OfficialQuery {
  constructor(private snapshotCalculoV2Repo: ISnapshotCalculoV2Repository) {}

  async execute(filtro: SnapshotLecturaOficialFiltro): Promise<SnapshotLecturaOficialResultado | null> {
    const raw = await this.snapshotCalculoV2Repo.consultar({ ...filtro, incluirDetalles: false });
    const decision = raw
      ? await this.snapshotCalculoV2Repo.consultarUltimaDecision(raw.snapshot.snapshotId)
      : null;
    const motivo = obtenerMotivoFallback(raw?.snapshot ?? null, decision);

    if (raw && decision && motivo === null) {
      return {
        origen: 'SNAPSHOT_V2',
        seleccionSolicitada: { fuente: filtro.fuente, revision: filtro.revision },
        fallback: { aplicado: false, motivo: null },
        snapshot: {
          snapshotId: raw.snapshot.snapshotId,
          revision: raw.snapshot.revision,
          fuente: raw.snapshot.fuente,
          estado: raw.snapshot.estado,
          registros: raw.snapshot.registros,
          hashContenido: raw.snapshot.hashContenido,
          decision
        },
        registros: raw.snapshot.registros,
        totalesA2: raw.snapshot.totalesA2
      };
    }

    const historico = await this.snapshotCalculoV2Repo.consultarTotalesHistoricos(filtro);
    if (!historico) return null;

    return {
      origen: 'HISTORICO_SQL',
      seleccionSolicitada: { fuente: filtro.fuente, revision: filtro.revision },
      fallback: { aplicado: true, motivo: motivo! },
      snapshot: null,
      registros: historico.registros,
      totalesA2: historico.totalesA2
    };
  }
}
