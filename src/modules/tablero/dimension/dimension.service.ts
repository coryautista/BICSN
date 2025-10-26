import { findDimensionById, listDimensiones, listDimensionesByTipo, createDimension, updateDimension, deleteDimension } from './dimension.repo.js';

export async function getAllDimensiones() {
  return await listDimensiones();
}

export async function getDimensionesByTipo(tipoDimension: string) {
  return await listDimensionesByTipo(tipoDimension);
}

export async function getDimensionById(dimensionId: number) {
  const dimension = await findDimensionById(dimensionId);
  if (!dimension) {
    throw new Error('DIMENSION_NOT_FOUND');
  }
  return dimension;
}

export async function createDimensionItem(
  nombre: string,
  descripcion: string,
  tipoDimension: string,
  esActiva?: boolean,
  userId?: string,
  tx?: any
) {
  try {
    return await createDimension(
      nombre,
      descripcion,
      tipoDimension,
      esActiva,
      userId,
      tx
    );
  } catch (error: any) {
    if (error.message.includes('Violation of PRIMARY KEY constraint')) {
      throw new Error('DIMENSION_EXISTS');
    }
    throw error;
  }
}

export async function updateDimensionItem(
  dimensionId: number,
  nombre?: string,
  descripcion?: string,
  tipoDimension?: string,
  esActiva?: boolean,
  userId?: string,
  tx?: any
) {
  const dimension = await updateDimension(
    dimensionId,
    nombre,
    descripcion,
    tipoDimension,
    esActiva,
    userId,
    tx
  );
  if (!dimension) {
    throw new Error('DIMENSION_NOT_FOUND');
  }
  return dimension;
}

export async function deleteDimensionItem(dimensionId: number, tx?: any) {
  const deletedId = await deleteDimension(dimensionId, tx);
  if (!deletedId) {
    throw new Error('DIMENSION_NOT_FOUND');
  }
  return deletedId;
}