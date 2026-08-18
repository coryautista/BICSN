import type { SnapshotCalculoV2ConsultaResultado } from '../entities/SnapshotCalculoV2Consulta.js';
import {
  SNAPSHOT_V2_ACCEPTANCE_POLICY,
  type SnapshotVeredicto,
  type SnapshotVeredictoFondo
} from '../entities/SnapshotCalculoV2Bandeja.js';
import type { SnapshotTotalesA2 } from '../entities/SnapshotCalculoV2.js';

const FONDOS = ['CAIR', 'FRA', 'FRE', 'FH', 'FV', 'FAA', 'FAE', 'FAT', 'FAI'] as const;
const TOLERANCIA_CENTAVOS = 20n;

export function evaluarSnapshotCalculoV2(result: SnapshotCalculoV2ConsultaResultado): SnapshotVeredicto {
  const evaluar = (baseline: string | null, diferencia: string | null): SnapshotVeredictoFondo => {
    if (baseline === null || diferencia === null) return 'SIN_BASELINE';
    const centavos = absolutoCentavos(diferencia);
    if (centavos === 0n) return 'COINCIDE';
    return centavos <= TOLERANCIA_CENTAVOS ? 'DIFERENCIA_ESPERADA_PRECISION' : 'DIFERENCIA_REVISAR';
  };
  const fondos = Object.fromEntries(FONDOS.map((fondo) => {
    const comparison = result.comparacion[fondo];
    return [fondo, {
      revisa: evaluar(comparison.revisa, comparison.diferenciaRevisa),
      historico: evaluar(comparison.historico, comparison.diferenciaHistorico)
    }];
  })) as SnapshotVeredicto['fondos'];
  const statuses = Object.values(fondos).flatMap((fondo) => [fondo.revisa, fondo.historico]);
  const fondoSinBaseline = FONDOS.some((fondo) => fondos[fondo].revisa === 'SIN_BASELINE' && fondos[fondo].historico === 'SIN_BASELINE');
  const general = result.snapshot.estado !== 'COMPLETO' || fondoSinBaseline
    ? 'INCOMPLETO'
    : statuses.includes('DIFERENCIA_REVISAR') ? 'OBSERVADO' : 'APROBADO';
  return { politicaVersion: SNAPSHOT_V2_ACCEPTANCE_POLICY, general, fondos };
}

function absolutoCentavos(value: string): bigint {
  const match = /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(value.trim());
  if (!match) throw new Error(`DIFERENCIA_A2_INVALIDA:${value}`);
  const cents = BigInt(match[2]) * 100n + BigInt((match[3] ?? '').padEnd(2, '0'));
  return cents < 0n ? -cents : cents;
}

export type SnapshotFondos = keyof SnapshotTotalesA2;
