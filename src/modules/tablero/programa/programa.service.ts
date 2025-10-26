import { findProgramaById, listProgramas, listProgramasByEje, listProgramasByLineaEstrategica, createPrograma, updatePrograma, deletePrograma } from './programa.repo.js';

export async function getAllProgramas() {
  return await listProgramas();
}

export async function getProgramasByEje(ejeId: number) {
  return await listProgramasByEje(ejeId);
}

export async function getProgramasByLineaEstrategica(lineaEstrategicaId: number) {
  return await listProgramasByLineaEstrategica(lineaEstrategicaId);
}

export async function getProgramaById(programaId: number) {
  const programa = await findProgramaById(programaId);
  if (!programa) {
    throw new Error('PROGRAMA_NOT_FOUND');
  }
  return programa;
}

export async function createProgramaItem(idEje: number, idLineaEstrategica: number, nombre: string, descripcion: string, userId?: string, tx?: any) {
  try {
    return await createPrograma(idEje, idLineaEstrategica, nombre, descripcion, userId, tx);
  } catch (error: any) {
    if (error.message.includes('FOREIGN KEY constraint')) {
      if (error.message.includes('idEje')) {
        throw new Error('EJE_NOT_FOUND');
      }
      if (error.message.includes('idLineaEstrategica')) {
        throw new Error('LINEA_ESTRATEGICA_NOT_FOUND');
      }
    }
    if (error.message.includes('Violation of PRIMARY KEY constraint')) {
      throw new Error('PROGRAMA_EXISTS');
    }
    throw error;
  }
}

export async function updateProgramaItem(programaId: number, nombre?: string, descripcion?: string, userId?: string, tx?: any) {
  const programa = await updatePrograma(programaId, nombre, descripcion, userId, tx);
  if (!programa) {
    throw new Error('PROGRAMA_NOT_FOUND');
  }
  return programa;
}

export async function deleteProgramaItem(programaId: number, tx?: any) {
  const deletedId = await deletePrograma(programaId, tx);
  if (!deletedId) {
    throw new Error('PROGRAMA_NOT_FOUND');
  }
  return deletedId;
}