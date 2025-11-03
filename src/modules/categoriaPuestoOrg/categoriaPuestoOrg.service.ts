import {
  findCategoriaPuestoOrgById,
  listCategoriaPuestoOrg,
  createCategoriaPuestoOrg,
  updateCategoriaPuestoOrg,
  deleteCategoriaPuestoOrg
} from './categoriaPuestoOrg.repo.js';

export async function getAllCategoriaPuestoOrg(filters: {
  nivel?: number;
  org0?: string;
  org1?: string;
  org2?: string;
  org3?: string;
  vigenciaInicio?: string;
  categoria?: string;
} = {}) {
  return await listCategoriaPuestoOrg(filters);
}

export async function getCategoriaPuestoOrgById(categoriaPuestoOrgId: number) {
  const categoria = await findCategoriaPuestoOrgById(categoriaPuestoOrgId);
  if (!categoria) {
    throw new Error('CATEGORIA_PUESTO_ORG_NOT_FOUND');
  }
  return categoria;
}

export async function createCategoriaPuestoOrgItem(
  nivel: number,
  org0: string,
  org1: string,
  categoria: string,
  nombreCategoria: string,
  ingresoBrutoMensual: number,
  vigenciaInicio: string,
  org2?: string,
  org3?: string,
  vigenciaFin?: string,
  userId?: string,
  tx?: any
) {
  try {
    return await createCategoriaPuestoOrg(
      nivel,
      org0,
      org1,
      categoria,
      nombreCategoria,
      ingresoBrutoMensual,
      vigenciaInicio,
      org2,
      org3,
      vigenciaFin,
      userId,
      tx
    );
  } catch (error: any) {
    if (error.message.includes('Violation of UNIQUE KEY constraint')) {
      throw new Error('CATEGORIA_PUESTO_ORG_EXISTS');
    }
    throw error;
  }
}

export async function updateCategoriaPuestoOrgItem(
  categoriaPuestoOrgId: number,
  nombreCategoria?: string,
  ingresoBrutoMensual?: number,
  vigenciaFin?: string,
  userId?: string,
  tx?: any
) {
  const categoria = await updateCategoriaPuestoOrg(
    categoriaPuestoOrgId,
    nombreCategoria,
    ingresoBrutoMensual,
    vigenciaFin,
    userId,
    tx
  );
  if (!categoria) {
    throw new Error('CATEGORIA_PUESTO_ORG_NOT_FOUND');
  }
  return categoria;
}

export async function deleteCategoriaPuestoOrgItem(categoriaPuestoOrgId: number, tx?: any) {
  const deletedId = await deleteCategoriaPuestoOrg(categoriaPuestoOrgId, tx);
  if (!deletedId) {
    throw new Error('CATEGORIA_PUESTO_ORG_NOT_FOUND');
  }
  return deletedId;
}