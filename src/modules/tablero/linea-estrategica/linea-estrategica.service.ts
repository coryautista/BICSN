import { findLineaEstrategicaById, listLineasEstrategicas, listLineasEstrategicasByEje, createLineaEstrategica, updateLineaEstrategica, deleteLineaEstrategica, getLineaEstrategicaWithProgramas as getLineaEstrategicaWithProgramasRepo } from './linea-estrategica.repo.js';

export async function getAllLineasEstrategicas() {
  return await listLineasEstrategicas();
}

export async function getLineasEstrategicasByEje(ejeId: number) {
  return await listLineasEstrategicasByEje(ejeId);
}

export async function getLineaEstrategicaById(lineaEstrategicaId: number) {
  const lineaEstrategica = await findLineaEstrategicaById(lineaEstrategicaId);
  if (!lineaEstrategica) {
    throw new Error('LINEA_ESTRATEGICA_NOT_FOUND');
  }
  return lineaEstrategica;
}

export async function getLineaEstrategicaWithProgramas(lineaEstrategicaId: number) {
  const lineaEstrategica = await getLineaEstrategicaWithProgramasRepo(lineaEstrategicaId);
  if (!lineaEstrategica) {
    throw new Error('LINEA_ESTRATEGICA_NOT_FOUND');
  }
  return lineaEstrategica;
}

export async function createLineaEstrategicaItem(idEje: number, nombre: string, descripcion: string, userId?: string, tx?: any) {
  try {
    return await createLineaEstrategica(idEje, nombre, descripcion, userId, tx);
  } catch (error: any) {
    if (error.message.includes('FOREIGN KEY constraint')) {
      throw new Error('EJE_NOT_FOUND');
    }
    if (error.message.includes('Violation of PRIMARY KEY constraint')) {
      throw new Error('LINEA_ESTRATEGICA_EXISTS');
    }
    throw error;
  }
}

export async function updateLineaEstrategicaItem(lineaEstrategicaId: number, nombre?: string, descripcion?: string, userId?: string, tx?: any) {
  const lineaEstrategica = await updateLineaEstrategica(lineaEstrategicaId, nombre, descripcion, userId, tx);
  if (!lineaEstrategica) {
    throw new Error('LINEA_ESTRATEGICA_NOT_FOUND');
  }
  return lineaEstrategica;
}

export async function deleteLineaEstrategicaItem(lineaEstrategicaId: number, tx?: any) {
  const deletedId = await deleteLineaEstrategica(lineaEstrategicaId, tx);
  if (!deletedId) {
    throw new Error('LINEA_ESTRATEGICA_NOT_FOUND');
  }
  return deletedId;
}