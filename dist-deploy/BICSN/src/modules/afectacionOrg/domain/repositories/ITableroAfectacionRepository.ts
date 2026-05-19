import { TableroAfectacion } from '../entities/TableroAfectacion.js';

export interface TableroAfectacionFilters {
  entidad?: string;
  anio?: number;
  orgNivel?: number;
  org0?: string;
  org1?: string;
  org2?: string;
  org3?: string;
}

export interface ITableroAfectacionRepository {
  findAll(filters: TableroAfectacionFilters): Promise<TableroAfectacion[]>;
}
