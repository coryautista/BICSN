import { sql } from '../../../../../db/context.js';
import { Eje, EjeWithLineas } from '../entities/Eje.js';

export interface IEjeRepository {
  findAll(): Promise<Eje[]>;
  findById(ejeId: number): Promise<Eje | null>;
  create(nombre: string, userId?: string, tx?: sql.Transaction): Promise<Eje>;
  update(ejeId: number, nombre: string, userId?: string, tx?: sql.Transaction): Promise<Eje | null>;
  delete(ejeId: number, tx?: sql.Transaction): Promise<number | null>;
  getEjeWithLineasEstrategicas(ejeId: number): Promise<EjeWithLineas | null>;
}

