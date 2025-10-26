import {
  getAllMovimientos,
  getMovimientoById,
  getMovimientosByAfiliadoId,
  getMovimientosByTipoMovimientoId,
  createMovimiento,
  updateMovimiento,
  deleteMovimiento,
  type Movimiento
} from './movimiento.repo.js';

export async function getAllMovimientosService(): Promise<Movimiento[]> {
  return getAllMovimientos();
}

export async function getMovimientoByIdService(id: number): Promise<Movimiento> {
  const record = await getMovimientoById(id);
  if (!record) {
    throw new Error('MOVIMIENTO_NOT_FOUND');
  }
  return record;
}

export async function getMovimientosByAfiliadoIdService(afiliadoId: number): Promise<Movimiento[]> {
  return getMovimientosByAfiliadoId(afiliadoId);
}

export async function getMovimientosByTipoMovimientoIdService(tipoMovimientoId: number): Promise<Movimiento[]> {
  return getMovimientosByTipoMovimientoId(tipoMovimientoId);
}

export async function createMovimientoService(data: Omit<Movimiento, 'id' | 'createdAt'>): Promise<Movimiento> {
  return createMovimiento(data);
}

export async function updateMovimientoService(id: number, data: Partial<Omit<Movimiento, 'id' | 'createdAt'>>): Promise<Movimiento> {
  // Check if record exists
  const existing = await getMovimientoById(id);
  if (!existing) {
    throw new Error('MOVIMIENTO_NOT_FOUND');
  }
  return updateMovimiento(id, data);
}

export async function deleteMovimientoService(id: number): Promise<void> {
  // Check if record exists
  const existing = await getMovimientoById(id);
  if (!existing) {
    throw new Error('MOVIMIENTO_NOT_FOUND');
  }
  return deleteMovimiento(id);
}