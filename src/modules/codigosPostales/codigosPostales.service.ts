import { findCodigoPostalById, findCodigoPostalByCode, listCodigosPostales, createCodigoPostal, updateCodigoPostal, deleteCodigoPostal } from './codigosPostales.repo.js';

export async function getAllCodigosPostales() {
  return await listCodigosPostales();
}

export async function getCodigoPostalById(codigoPostalId: number) {
  const codigoPostal = await findCodigoPostalById(codigoPostalId);
  if (!codigoPostal) {
    throw new Error('CODIGO_POSTAL_NOT_FOUND');
  }
  return codigoPostal;
}

export async function getCodigoPostalByCode(codigoPostal: string) {
  const cp = await findCodigoPostalByCode(codigoPostal);
  if (!cp) {
    throw new Error('CODIGO_POSTAL_NOT_FOUND');
  }
  return cp;
}

export async function createCodigoPostalItem(codigoPostal: string, esValido: boolean, userId?: string, tx?: any) {
  try {
    return await createCodigoPostal(codigoPostal, esValido, userId, tx);
  } catch (error: any) {
    if (error.message.includes('Violation of PRIMARY KEY constraint')) {
      throw new Error('CODIGO_POSTAL_EXISTS');
    }
    throw error;
  }
}

export async function updateCodigoPostalItem(codigoPostalId: number, esValido?: boolean, userId?: string, tx?: any) {
  const codigoPostal = await updateCodigoPostal(codigoPostalId, esValido, userId, tx);
  if (!codigoPostal) {
    throw new Error('CODIGO_POSTAL_NOT_FOUND');
  }
  return codigoPostal;
}

export async function deleteCodigoPostalItem(codigoPostalId: number, tx?: any) {
  const deletedId = await deleteCodigoPostal(codigoPostalId, tx);
  if (!deletedId) {
    throw new Error('CODIGO_POSTAL_NOT_FOUND');
  }
  return deletedId;
}