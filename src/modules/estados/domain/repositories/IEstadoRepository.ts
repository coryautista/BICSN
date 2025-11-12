import { Estado } from '../entities/Estado.js';

export interface IEstadoRepository {
  findAll(): Promise<Estado[]>;
  findById(estadoId: string): Promise<Estado | undefined>;
  create(estadoId: string, nombreEstado: string, esValido: boolean, userId?: string): Promise<Estado>;
  update(estadoId: string, nombreEstado?: string, esValido?: boolean, userId?: string): Promise<Estado | undefined>;
  delete(estadoId: string): Promise<string | undefined>;
}
