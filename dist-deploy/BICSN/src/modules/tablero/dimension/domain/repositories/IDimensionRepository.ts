import { sql } from '../../../../../db/context.js';
import { Dimension, TipoDimension } from '../entities/Dimension.js';

export interface IDimensionRepository {
  findAll(): Promise<Dimension[]>;
  findById(dimensionId: number): Promise<Dimension | null>;
  findByTipo(tipoDimension: TipoDimension): Promise<Dimension[]>;
  create(
    nombre: string,
    descripcion: string,
    tipoDimension: TipoDimension,
    esActiva?: boolean,
    userId?: string,
    tx?: sql.Transaction
  ): Promise<Dimension>;
  update(
    dimensionId: number,
    nombre?: string,
    descripcion?: string,
    tipoDimension?: TipoDimension,
    esActiva?: boolean,
    userId?: string,
    tx?: sql.Transaction
  ): Promise<Dimension | null>;
  delete(dimensionId: number, tx?: sql.Transaction): Promise<number | null>;
}

