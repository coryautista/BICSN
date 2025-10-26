import { findMunicipioById, listMunicipiosByEstado, listAllMunicipios, createMunicipio, updateMunicipio, deleteMunicipio } from './municipios.repo.js';

export async function getAllMunicipios() {
  return await listAllMunicipios();
}

export async function getMunicipiosByEstado(estadoId: string) {
  return await listMunicipiosByEstado(estadoId);
}

export async function getMunicipioById(municipioId: number) {
  const municipio = await findMunicipioById(municipioId);
  if (!municipio) {
    throw new Error('MUNICIPIO_NOT_FOUND');
  }
  return municipio;
}

export async function createMunicipioItem(estadoId: string, claveMunicipio: string, nombreMunicipio: string, esValido: boolean, userId?: string, tx?: any) {
  try {
    return await createMunicipio(estadoId, claveMunicipio, nombreMunicipio, esValido, userId, tx);
  } catch (error: any) {
    if (error.message.includes('Violation of PRIMARY KEY constraint')) {
      throw new Error('MUNICIPIO_EXISTS');
    }
    if (error.message.includes('FOREIGN KEY constraint')) {
      throw new Error('ESTADO_NOT_FOUND');
    }
    throw error;
  }
}

export async function updateMunicipioItem(municipioId: number, nombreMunicipio?: string, esValido?: boolean, userId?: string, tx?: any) {
  const municipio = await updateMunicipio(municipioId, nombreMunicipio, esValido, userId, tx);
  if (!municipio) {
    throw new Error('MUNICIPIO_NOT_FOUND');
  }
  return municipio;
}

export async function deleteMunicipioItem(municipioId: number, tx?: any) {
  const deletedId = await deleteMunicipio(municipioId, tx);
  if (!deletedId) {
    throw new Error('MUNICIPIO_NOT_FOUND');
  }
  return deletedId;
}