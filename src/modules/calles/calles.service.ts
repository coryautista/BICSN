import { findCalleById, listCallesByColonia, searchCalles, createCalle, updateCalle, deleteCalle } from './calles.repo.js';

export async function getCalleById(calleId: number) {
  const calle = await findCalleById(calleId);
  if (!calle) {
    throw new Error('CALLE_NOT_FOUND');
  }
  return calle;
}

export async function getCallesByColonia(coloniaId: number) {
  return await listCallesByColonia(coloniaId);
}

export async function searchCallesService(filters: {
  estadoId?: string;
  municipioId?: number;
  coloniaId?: number;
  codigoPostal?: string;
  nombreCalle?: string;
  esValido?: boolean;
  limit?: number;
  offset?: number;
}) {
  return await searchCalles(filters);
}

export async function createCalleItem(coloniaId: number, nombreCalle: string, esValido: boolean, userId?: string, tx?: any) {
  try {
    return await createCalle(coloniaId, nombreCalle, esValido, userId, tx);
  } catch (error: any) {
    if (error.message.includes('Violation of PRIMARY KEY constraint')) {
      throw new Error('CALLE_EXISTS');
    }
    if (error.message.includes('FOREIGN KEY constraint')) {
      throw new Error('COLONIA_NOT_FOUND');
    }
    throw error;
  }
}

export async function updateCalleItem(calleId: number, nombreCalle?: string, esValido?: boolean, userId?: string, tx?: any) {
  const calle = await updateCalle(calleId, nombreCalle, esValido, userId, tx);
  if (!calle) {
    throw new Error('CALLE_NOT_FOUND');
  }
  return calle;
}

export async function deleteCalleItem(calleId: number, tx?: any) {
  const deletedId = await deleteCalle(calleId, tx);
  if (!deletedId) {
    throw new Error('CALLE_NOT_FOUND');
  }
  return deletedId;
}