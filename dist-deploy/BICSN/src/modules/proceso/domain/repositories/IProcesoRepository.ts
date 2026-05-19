import { Proceso, CreateProcesoData, UpdateProcesoData } from '../entities/Proceso.js';

export interface IProcesoRepository {
  findAll(): Promise<Proceso[]>;
  findById(id: number): Promise<Proceso | undefined>;
  create(data: CreateProcesoData, tx?: any): Promise<Proceso>;
  update(id: number, data: UpdateProcesoData, tx?: any): Promise<Proceso | undefined>;
  delete(id: number, tx?: any): Promise<boolean>;
}
