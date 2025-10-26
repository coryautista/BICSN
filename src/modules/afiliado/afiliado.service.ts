import {
  getAllAfiliados,
  getAfiliadoById,
  createAfiliado,
  updateAfiliado,
  deleteAfiliado,
  type Afiliado
} from './afiliado.repo.js';

export async function getAllAfiliadosService(): Promise<Afiliado[]> {
  return getAllAfiliados();
}

export async function getAfiliadoByIdService(id: number): Promise<Afiliado> {
  const record = await getAfiliadoById(id);
  if (!record) {
    throw new Error('AFILIADO_NOT_FOUND');
  }
  return record;
}

export async function createAfiliadoService(data: Omit<Afiliado, 'id' | 'createdAt' | 'updatedAt'>): Promise<Afiliado> {
  // Check if folio already exists
  // Note: We would need to implement a check for unique folio if required
  return createAfiliado(data);
}

export async function updateAfiliadoService(id: number, data: Partial<Omit<Afiliado, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Afiliado> {
  // Check if record exists
  const existing = await getAfiliadoById(id);
  if (!existing) {
    throw new Error('AFILIADO_NOT_FOUND');
  }
  return updateAfiliado(id, data);
}

export async function deleteAfiliadoService(id: number): Promise<void> {
  // Check if record exists
  const existing = await getAfiliadoById(id);
  if (!existing) {
    throw new Error('AFILIADO_NOT_FOUND');
  }
  return deleteAfiliado(id);
}