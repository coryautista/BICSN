import { HistoricoQuincenalFilters, HistoricoQuincenalResult, HistoricoTipoConfig } from '../entities/HistoricoQuincenal.js';

export interface IHistoricosQuincenalesRepository {
  getConfig(grupo: string, tipo: string): HistoricoTipoConfig | undefined;
  consultarPorTipo(filters: HistoricoQuincenalFilters): Promise<HistoricoQuincenalResult>;
}
