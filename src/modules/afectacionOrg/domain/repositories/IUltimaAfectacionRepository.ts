import { UltimaAfectacion } from '../entities/UltimaAfectacion.js';

export interface UltimaAfectacionFilters {
  entidad?: string;
  anio?: number;
  orgNivel?: number;
  org0?: string;
  org1?: string;
  org2?: string;
  org3?: string;
  usuario?: string;
}

export interface IUltimaAfectacionRepository {
  findAll(filters: UltimaAfectacionFilters): Promise<UltimaAfectacion[]>;
}
