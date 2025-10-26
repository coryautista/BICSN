import { findEstadoById, listEstados, createEstado, updateEstado, deleteEstado } from './estados.repo.js';

export async function getAllEstados() {
  return await listEstados();
}

export async function getEstadoById(estadoId: string) {
  const estado = await findEstadoById(estadoId);
  if (!estado) {
    throw new Error('ESTADO_NOT_FOUND');
  }
  return estado;
}

export async function createEstadoItem(estadoId: string, nombreEstado: string, esValido: boolean, userId?: string, tx?: any) {
  try {
    return await createEstado(estadoId, nombreEstado, esValido, userId, tx);
  } catch (error: any) {
    if (error.message.includes('Violation of PRIMARY KEY constraint')) {
      throw new Error('ESTADO_EXISTS');
    }
    throw error;
  }
}

export async function updateEstadoItem(estadoId: string, nombreEstado?: string, esValido?: boolean, userId?: string, tx?: any) {
  const estado = await updateEstado(estadoId, nombreEstado, esValido, userId, tx);
  if (!estado) {
    throw new Error('ESTADO_NOT_FOUND');
  }
  return estado;
}

export async function deleteEstadoItem(estadoId: string, tx?: any) {
  const deletedId = await deleteEstado(estadoId, tx);
  if (!deletedId) {
    throw new Error('ESTADO_NOT_FOUND');
  }
  return deletedId;
}