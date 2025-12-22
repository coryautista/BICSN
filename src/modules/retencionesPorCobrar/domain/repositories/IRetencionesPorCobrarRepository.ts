import { RetencionPorCobrar } from '../entities/RetencionPorCobrar.js';

export interface IRetencionesPorCobrarRepository {
  getRetencionesPorCobrar(
    org0: string,
    org1: string,
    periodo: string
  ): Promise<RetencionPorCobrar[]>;
}

