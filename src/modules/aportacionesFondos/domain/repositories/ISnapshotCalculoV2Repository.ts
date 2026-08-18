import type {
  SnapshotCalculoV2Input,
  SnapshotCalculoV2Resultado
} from '../entities/SnapshotCalculoV2.js';
import type {
  SnapshotCalculoV2ConsultaFiltro,
  SnapshotCalculoV2ConsultaRaw
} from '../entities/SnapshotCalculoV2Consulta.js';
import type {
  SnapshotCalculoV2BandejaFiltro,
  SnapshotCalculoV2BandejaReferencia,
  SnapshotDecisionInput,
  SnapshotDecisionRegistro
} from '../entities/SnapshotCalculoV2Bandeja.js';
import type {
  SnapshotHistoricoAgregado,
  SnapshotLecturaOficialFiltro
} from '../entities/SnapshotCalculoV2Official.js';

export interface ISnapshotCalculoV2Repository {
  guardar(input: SnapshotCalculoV2Input): Promise<SnapshotCalculoV2Resultado>;
  consultar(filtro: SnapshotCalculoV2ConsultaFiltro): Promise<SnapshotCalculoV2ConsultaRaw | null>;
  listarReferencias(filtro: SnapshotCalculoV2BandejaFiltro): Promise<{
    total: number;
    datos: Array<SnapshotCalculoV2BandejaReferencia & { ultimaDecision: SnapshotDecisionRegistro | null }>;
  }>;
  guardarDecision(input: SnapshotDecisionInput): Promise<SnapshotDecisionRegistro | null>;
  consultarUltimaDecision(snapshotId: string): Promise<SnapshotDecisionRegistro | null>;
  listarDecisiones(snapshotId: string): Promise<SnapshotDecisionRegistro[] | null>;
  consultarElegibilidadDecision(snapshotId: string): Promise<'NO_ENCONTRADO' | 'NO_DECIDIBLE' | 'DECIDIBLE'>;
  consultarTotalesHistoricos(filtro: SnapshotLecturaOficialFiltro): Promise<SnapshotHistoricoAgregado | null>;
}
