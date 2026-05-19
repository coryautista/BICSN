import { EstadoAfectacion } from '../entities/EstadoAfectacion.js';

export interface EstadoAfectacionFilters {
  entidad?: string;
  anio?: number;
  orgNivel?: number;
  org0?: string;
  org1?: string;
  org2?: string;
  org3?: string;
}

export interface IEstadoAfectacionRepository {
  findAll(filters: EstadoAfectacionFilters): Promise<EstadoAfectacion[]>;
}
