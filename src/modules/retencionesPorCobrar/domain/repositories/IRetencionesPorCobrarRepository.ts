import { RetencionPorCobrar } from '../entities/RetencionPorCobrar.js';

export interface IRetencionesPorCobrarRepository {
  getRetencionesPorCobrar(
    org0: string,
    org1: string,
    periodo: string,
    org2?: string,
    org3?: string
  ): Promise<RetencionPorCobrar[]>;
  
  createRetencionesMoratorio(
    org0: string,
    org1: string,
    org2: string,
    org3: string,
    periodo: string,
    userAlta: string
  ): Promise<RetencionPorCobrar[]>;
}

