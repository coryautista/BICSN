import { findColoniaById, listColoniasByMunicipio, listColoniasByCodigoPostal, searchColonias, createColonia, updateColonia, deleteColonia } from './colonias.repo.js';

export async function getColoniaById(coloniaId: number) {
  const colonia = await findColoniaById(coloniaId);
  if (!colonia) {
    throw new Error('COLONIA_NOT_FOUND');
  }
  return colonia;
}

export async function getColoniasByMunicipio(municipioId: number) {
  return await listColoniasByMunicipio(municipioId);
}

export async function getColoniasByCodigoPostal(codigoPostalId: number) {
  return await listColoniasByCodigoPostal(codigoPostalId);
}

export async function searchColoniasService(filters: {
  estadoId?: string;
  municipioId?: number;
  codigoPostal?: string;
  nombreColonia?: string;
  tipoAsentamiento?: string;
  esValido?: boolean;
  limit?: number;
  offset?: number;
}) {
  return await searchColonias(filters);
}

export async function createColoniaItem(municipioId: number, codigoPostalId: number, nombreColonia: string, tipoAsentamiento?: string, esValido?: boolean, userId?: string, tx?: any) {
  try {
    return await createColonia(municipioId, codigoPostalId, nombreColonia, tipoAsentamiento, esValido, userId, tx);
  } catch (error: any) {
    if (error.message.includes('Violation of PRIMARY KEY constraint')) {
      throw new Error('COLONIA_EXISTS');
    }
    if (error.message.includes('FOREIGN KEY constraint')) {
      if (error.message.includes('MunicipioID')) {
        throw new Error('MUNICIPIO_NOT_FOUND');
      }
      if (error.message.includes('CodigoPostalID')) {
        throw new Error('CODIGO_POSTAL_NOT_FOUND');
      }
    }
    throw error;
  }
}

export async function updateColoniaItem(coloniaId: number, nombreColonia?: string, tipoAsentamiento?: string, esValido?: boolean, userId?: string, tx?: any) {
  const colonia = await updateColonia(coloniaId, nombreColonia, tipoAsentamiento, esValido, userId, tx);
  if (!colonia) {
    throw new Error('COLONIA_NOT_FOUND');
  }
  return colonia;
}

export async function deleteColoniaItem(coloniaId: number, tx?: any) {
  const deletedId = await deleteColonia(coloniaId, tx);
  if (!deletedId) {
    throw new Error('COLONIA_NOT_FOUND');
  }
  return deletedId;
}