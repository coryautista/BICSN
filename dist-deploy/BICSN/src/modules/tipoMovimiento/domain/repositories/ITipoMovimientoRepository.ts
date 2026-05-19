import { TipoMovimiento } from '../entities/TipoMovimiento.js';

export interface ITipoMovimientoRepository {
  findAll(): Promise<TipoMovimiento[]>;
  findById(id: number): Promise<TipoMovimiento | undefined>;
  create(data: { id: number; abreviatura: string | null; nombre: string }): Promise<TipoMovimiento>;
  update(id: number, data: { abreviatura?: string | null; nombre?: string }): Promise<TipoMovimiento>;
  delete(id: number): Promise<void>;
}
