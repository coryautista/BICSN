import { findEjeById, listEjes, createEje, updateEje, deleteEje, getEjeWithLineasEstrategicas } from './eje.repo.js';

export async function getAllEjes() {
  return await listEjes();
}

export async function getEjeById(ejeId: number) {
  const eje = await findEjeById(ejeId);
  if (!eje) {
    throw new Error('EJE_NOT_FOUND');
  }
  return eje;
}

export async function getEjeWithLineas(ejeId: number) {
  const eje = await getEjeWithLineasEstrategicas(ejeId);
  if (!eje) {
    throw new Error('EJE_NOT_FOUND');
  }
  return eje;
}

export async function createEjeItem(nombre: string, userId?: string, tx?: any) {
  try {
    return await createEje(nombre, userId, tx);
  } catch (error: any) {
    if (error.message.includes('Violation of PRIMARY KEY constraint')) {
      throw new Error('EJE_EXISTS');
    }
    throw error;
  }
}

export async function updateEjeItem(ejeId: number, nombre: string, userId?: string, tx?: any) {
  const eje = await updateEje(ejeId, nombre, userId, tx);
  if (!eje) {
    throw new Error('EJE_NOT_FOUND');
  }
  return eje;
}

export async function deleteEjeItem(ejeId: number, tx?: any) {
  const deletedId = await deleteEje(ejeId, tx);
  if (!deletedId) {
    throw new Error('EJE_NOT_FOUND');
  }
  return deletedId;
}