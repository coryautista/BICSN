import { getPool } from '../../db/mssql.js';
import { TipoMovimientoRepository } from './infrastructure/persistence/TipoMovimientoRepository.js';
import type { TipoMovimiento } from './domain/entities/TipoMovimiento.js';

export type { TipoMovimiento } from './domain/entities/TipoMovimiento.js';

async function getRepository(): Promise<TipoMovimientoRepository> {
  return new TipoMovimientoRepository(await getPool());
}

export async function getAllTipoMovimiento(): Promise<TipoMovimiento[]> {
  return (await getRepository()).findAll();
}

export async function getTipoMovimientoById(id: number): Promise<TipoMovimiento | undefined> {
  return (await getRepository()).findById(id);
}

export async function createTipoMovimiento(data: Omit<TipoMovimiento, 'id'> & { id: number }): Promise<TipoMovimiento> {
  return (await getRepository()).create(data);
}

export async function updateTipoMovimiento(id: number, data: Partial<Omit<TipoMovimiento, 'id'>>): Promise<TipoMovimiento> {
  return (await getRepository()).update(id, data);
}

export async function deleteTipoMovimiento(id: number): Promise<void> {
  return (await getRepository()).delete(id);
}
