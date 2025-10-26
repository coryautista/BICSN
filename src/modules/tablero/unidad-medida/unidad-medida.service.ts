import { findUnidadMedidaById, listUnidadesMedida, listUnidadesMedidaByCategoria, createUnidadMedida, updateUnidadMedida, deleteUnidadMedida } from './unidad-medida.repo.js';

export async function getAllUnidadesMedida() {
  return await listUnidadesMedida();
}

export async function getUnidadesMedidaByCategoria(categoria: string) {
  return await listUnidadesMedidaByCategoria(categoria);
}

export async function getUnidadMedidaById(unidadMedidaId: number) {
  const unidadMedida = await findUnidadMedidaById(unidadMedidaId);
  if (!unidadMedida) {
    throw new Error('UNIDAD_MEDIDA_NOT_FOUND');
  }
  return unidadMedida;
}

export async function createUnidadMedidaItem(
  nombre: string,
  simbolo: string,
  descripcion: string,
  categoria: string,
  esActiva?: boolean,
  userId?: string,
  tx?: any
) {
  try {
    return await createUnidadMedida(
      nombre,
      simbolo,
      descripcion,
      categoria,
      esActiva,
      userId,
      tx
    );
  } catch (error: any) {
    if (error.message.includes('Violation of PRIMARY KEY constraint')) {
      throw new Error('UNIDAD_MEDIDA_EXISTS');
    }
    throw error;
  }
}

export async function updateUnidadMedidaItem(
  unidadMedidaId: number,
  nombre?: string,
  simbolo?: string,
  descripcion?: string,
  categoria?: string,
  esActiva?: boolean,
  userId?: string,
  tx?: any
) {
  const unidadMedida = await updateUnidadMedida(
    unidadMedidaId,
    nombre,
    simbolo,
    descripcion,
    categoria,
    esActiva,
    userId,
    tx
  );
  if (!unidadMedida) {
    throw new Error('UNIDAD_MEDIDA_NOT_FOUND');
  }
  return unidadMedida;
}

export async function deleteUnidadMedidaItem(unidadMedidaId: number, tx?: any) {
  const deletedId = await deleteUnidadMedida(unidadMedidaId, tx);
  if (!deletedId) {
    throw new Error('UNIDAD_MEDIDA_NOT_FOUND');
  }
  return deletedId;
}