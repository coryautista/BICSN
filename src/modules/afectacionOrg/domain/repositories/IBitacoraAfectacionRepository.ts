import { BitacoraAfectacion } from '../entities/BitacoraAfectacion.js';

export interface BitacoraAfectacionFilters {
  entidad?: string;
  anio?: number;
  quincena?: number;
  orgNivel?: number;
  org0?: string;
  org1?: string;
  org2?: string;
  org3?: string;
  usuario?: string;
  accion?: string;
  resultado?: string;
  limit?: number;
  offset?: number;
}

export interface IBitacoraAfectacionRepository {
  findAll(filters: BitacoraAfectacionFilters): Promise<BitacoraAfectacion[]>;
}
