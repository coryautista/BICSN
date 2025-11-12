import { Movimiento, CreateMovimientoData, UpdateMovimientoData } from '../entities/Movimiento.js';

export interface IMovimientoRepository {
  findAll(): Promise<Movimiento[]>;
  findById(id: number): Promise<Movimiento | undefined>;
  findByAfiliadoId(afiliadoId: number): Promise<Movimiento[]>;
  findByTipoMovimientoId(tipoMovimientoId: number): Promise<Movimiento[]>;
  findByFolio(folio: string): Promise<Movimiento | undefined>;
  create(data: CreateMovimientoData): Promise<Movimiento>;
  update(data: UpdateMovimientoData): Promise<Movimiento>;
  delete(id: number): Promise<void>;
}
