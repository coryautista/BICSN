import { AportacionQuincenalResumen } from '../entities/AportacionQuincenalResumen.js';

export interface IAplicacionQuincenalRepository {
  getAportacionQuincenalResumen(
    org0: string,
    org1: string,
    periodo: string
  ): Promise<AportacionQuincenalResumen[]>;
}

