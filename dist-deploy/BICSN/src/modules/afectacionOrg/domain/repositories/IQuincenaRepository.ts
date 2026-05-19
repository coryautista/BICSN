import { QuincenaInfo } from '../entities/QuincenaInfo.js';

export interface QuincenaFilters {
  entidad?: string;
  org0?: string;
  org1?: string;
  org2?: string;
  org3?: string;
}

export interface IQuincenaRepository {
  getQuincenaAltaAfectacion(filters?: QuincenaFilters): Promise<QuincenaInfo>;
}
