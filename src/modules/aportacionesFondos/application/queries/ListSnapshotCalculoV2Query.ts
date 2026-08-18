import type { ISnapshotCalculoV2Repository } from '../../domain/repositories/ISnapshotCalculoV2Repository.js';
import type {
  SnapshotCalculoV2BandejaFiltro,
  SnapshotCalculoV2BandejaResultado
} from '../../domain/entities/SnapshotCalculoV2Bandeja.js';
import { compararSnapshotCalculoV2 } from '../../domain/services/SnapshotCalculoV2Comparison.js';
import { evaluarSnapshotCalculoV2 } from '../../domain/services/SnapshotCalculoV2Acceptance.js';

export class ListSnapshotCalculoV2Query {
  constructor(private snapshotCalculoV2Repo: ISnapshotCalculoV2Repository) {}

  async execute(filtro: SnapshotCalculoV2BandejaFiltro): Promise<SnapshotCalculoV2BandejaResultado> {
    const page = await this.snapshotCalculoV2Repo.listarReferencias(filtro);
    const datos = [];
    for (const reference of page.datos) {
      const raw = await this.snapshotCalculoV2Repo.consultar({ ...reference, incluirDetalles: false });
      if (!raw) continue;
      const comparison = compararSnapshotCalculoV2(raw);
      datos.push({ ...comparison, veredicto: evaluarSnapshotCalculoV2(comparison), ultimaDecision: reference.ultimaDecision });
    }
    return {
      datos,
      paginacion: {
        pagina: filtro.pagina,
        tamanio: filtro.tamanio,
        total: page.total,
        paginas: Math.ceil(page.total / filtro.tamanio)
      }
    };
  }
}
