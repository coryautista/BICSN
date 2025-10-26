import {
  getAllTipoMovimiento,
  getTipoMovimientoById,
  createTipoMovimiento,
  updateTipoMovimiento,
  deleteTipoMovimiento,
  type TipoMovimiento
} from './tipoMovimiento.repo.js';

export async function getAllTipoMovimientoService(): Promise<TipoMovimiento[]> {
  return getAllTipoMovimiento();
}

export async function getTipoMovimientoByIdService(id: number): Promise<TipoMovimiento> {
  const record = await getTipoMovimientoById(id);
  if (!record) {
    throw new Error('TIPO_MOVIMIENTO_NOT_FOUND');
  }
  return record;
}

export async function createTipoMovimientoService(data: { id: number; abreviatura: string | null; nombre: string }): Promise<TipoMovimiento> {
  // Check if ID already exists
  const existing = await getTipoMovimientoById(data.id);
  if (existing) {
    throw new Error('TIPO_MOVIMIENTO_EXISTS');
  }
  return createTipoMovimiento(data);
}

export async function updateTipoMovimientoService(id: number, data: Partial<Omit<TipoMovimiento, 'id'>>): Promise<TipoMovimiento> {
  // Check if record exists
  const existing = await getTipoMovimientoById(id);
  if (!existing) {
    throw new Error('TIPO_MOVIMIENTO_NOT_FOUND');
  }
  return updateTipoMovimiento(id, data);
}

export async function deleteTipoMovimientoService(id: number): Promise<void> {
  // Check if record exists
  const existing = await getTipoMovimientoById(id);
  if (!existing) {
    throw new Error('TIPO_MOVIMIENTO_NOT_FOUND');
  }
  return deleteTipoMovimiento(id);
}