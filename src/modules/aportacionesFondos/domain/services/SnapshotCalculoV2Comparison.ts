import type {
  SnapshotCalculoV2ConsultaRaw,
  SnapshotCalculoV2ConsultaResultado,
  SnapshotComparacionFondo
} from '../entities/SnapshotCalculoV2Consulta.js';
import type { SnapshotTotalesA2 } from '../entities/SnapshotCalculoV2.js';
import { AportacionesMonetaryKernel } from './AportacionesMonetaryKernel.js';

const FONDOS = ['CAIR', 'FRA', 'FRE', 'FH', 'FV', 'FAA', 'FAE', 'FAT', 'FAI'] as const;

export function compararSnapshotCalculoV2(
  raw: SnapshotCalculoV2ConsultaRaw,
  kernel = new AportacionesMonetaryKernel()
): SnapshotCalculoV2ConsultaResultado {
  const comparar = (snapshot: string, revisa: string | null, historico: string | null): SnapshotComparacionFondo => ({
    snapshot,
    revisa,
    diferenciaRevisa: revisa === null ? null : kernel.truncarA2(kernel.restarD6(snapshot, revisa)),
    historico,
    diferenciaHistorico: historico === null ? null : kernel.truncarA2(kernel.restarD6(snapshot, historico))
  });
  const comparacion = Object.fromEntries(FONDOS.map((fondo) => [
    fondo,
    comparar(raw.snapshot.totalesA2[fondo], raw.revisa?.[fondo] ?? null, raw.historico[fondo])
  ])) as Record<keyof SnapshotTotalesA2, SnapshotComparacionFondo>;
  return { ...raw, comparacion };
}
