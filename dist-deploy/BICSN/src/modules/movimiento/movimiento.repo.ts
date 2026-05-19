import { getPool } from '../../db/mssql.js';
import { MovimientoRepository } from './infrastructure/persistence/MovimientoRepository.js';
import type { Movimiento } from './domain/entities/Movimiento.js';

export type { Movimiento } from './domain/entities/Movimiento.js';

async function getRepository(): Promise<MovimientoRepository> {
  return new MovimientoRepository(await getPool());
}

export async function getAllMovimientos(): Promise<Movimiento[]> {
  return (await getRepository()).findAll();
}

export async function getMovimientoById(id: number): Promise<Movimiento | undefined> {
  return (await getRepository()).findById(id);
}

export async function getMovimientosByAfiliadoId(afiliadoId: number): Promise<Movimiento[]> {
  return (await getRepository()).findByAfiliadoId(afiliadoId);
}

export async function getMovimientosByTipoMovimientoId(tipoMovimientoId: number): Promise<Movimiento[]> {
  return (await getRepository()).findByTipoMovimientoId(tipoMovimientoId);
}

export async function createMovimiento(data: Omit<Movimiento, 'id' | 'createdAt'>): Promise<Movimiento> {
  return (await getRepository()).create(data);
}

export async function updateMovimiento(id: number, data: Partial<Omit<Movimiento, 'id' | 'createdAt'>>): Promise<Movimiento> {
  return (await getRepository()).update({ id, ...data });
}

export async function deleteMovimiento(id: number): Promise<void> {
  return (await getRepository()).delete(id);
}
