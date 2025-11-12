import { Colonia, ColoniaDetailed, SearchColoniasFilters } from '../entities/Colonia.js';

export interface IColoniaRepository {
  findById(coloniaId: number): Promise<ColoniaDetailed | undefined>;
  findByMunicipio(municipioId: number): Promise<Colonia[]>;
  findByCodigoPostal(codigoPostalId: number): Promise<Colonia[]>;
  search(filters: SearchColoniasFilters): Promise<Colonia[]>; // Cambiado de ColoniaDetailed[] a Colonia[]
  create(municipioId: number, codigoPostalId: number, nombreColonia: string, tipoAsentamiento?: string, esValido?: boolean, userId?: string): Promise<ColoniaDetailed>;
  update(coloniaId: number, nombreColonia?: string, tipoAsentamiento?: string, esValido?: boolean, userId?: string): Promise<ColoniaDetailed | undefined>;
  delete(coloniaId: number): Promise<number | undefined>;
}
