import { HistoricoGrupo, HistoricoQuincenalResult } from '../../domain/entities/HistoricoQuincenal.js';
import { IHistoricosQuincenalesRepository } from '../../domain/repositories/IHistoricosQuincenalesRepository.js';

export interface GetHistoricoQuincenalPorTipoInput {
  grupo: HistoricoGrupo;
  tipo: string;
  org0: string;
  org1: string;
  periodo: string;
  page: number;
  pageSize: number;
  buscar?: string;
}

export class GetHistoricoQuincenalPorTipoQuery {
  constructor(private historicosQuincenalesRepo: IHistoricosQuincenalesRepository) {}

  async execute(input: GetHistoricoQuincenalPorTipoInput): Promise<HistoricoQuincenalResult> {
    const periodo = input.periodo.trim();
    const quincena = Number(periodo.substring(0, 2));
    const anio = Number(`20${periodo.substring(2, 4)}`);

    if (!/^\d{4}$/.test(periodo) || quincena < 1 || quincena > 24 || !Number.isFinite(anio)) {
      throw new Error('PERIODO_INVALIDO');
    }

    return this.historicosQuincenalesRepo.consultarPorTipo({
      ...input,
      periodo,
      quincena,
      anio
    });
  }
}
