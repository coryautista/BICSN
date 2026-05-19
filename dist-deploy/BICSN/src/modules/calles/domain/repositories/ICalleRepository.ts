import { Calle, CalleDetailed, CreateCalleData, UpdateCalleData, SearchCallesFilters } from '../entities/Calle.js';

export interface ICalleRepository {
  findById(calleId: number): Promise<CalleDetailed | undefined>;
  findByColonia(coloniaId: number): Promise<Calle[]>;
  search(filters: SearchCallesFilters): Promise<Calle[]>; // Cambiado de CalleDetailed[] a Calle[]
  create(data: CreateCalleData): Promise<Calle>;
  update(data: UpdateCalleData): Promise<Calle>;
  delete(calleId: number): Promise<number>;
}
