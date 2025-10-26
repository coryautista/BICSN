import {
  getAllAfiliadoOrg,
  getAfiliadoOrgById,
  getAfiliadoOrgByAfiliadoId,
  createAfiliadoOrg,
  updateAfiliadoOrg,
  deleteAfiliadoOrg,
  type AfiliadoOrg
} from './afiliadoOrg.repo.js';

export async function getAllAfiliadoOrgService(): Promise<AfiliadoOrg[]> {
  return getAllAfiliadoOrg();
}

export async function getAfiliadoOrgByIdService(id: number): Promise<AfiliadoOrg> {
  const record = await getAfiliadoOrgById(id);
  if (!record) {
    throw new Error('AFILIADO_ORG_NOT_FOUND');
  }
  return record;
}

export async function getAfiliadoOrgByAfiliadoIdService(afiliadoId: number): Promise<AfiliadoOrg[]> {
  return getAfiliadoOrgByAfiliadoId(afiliadoId);
}

export async function createAfiliadoOrgService(data: Omit<AfiliadoOrg, 'id' | 'createdAt' | 'updatedAt'>): Promise<AfiliadoOrg> {
  return createAfiliadoOrg(data);
}

export async function updateAfiliadoOrgService(id: number, data: Partial<Omit<AfiliadoOrg, 'id' | 'createdAt' | 'updatedAt'>>): Promise<AfiliadoOrg> {
  // Check if record exists
  const existing = await getAfiliadoOrgById(id);
  if (!existing) {
    throw new Error('AFILIADO_ORG_NOT_FOUND');
  }
  return updateAfiliadoOrg(id, data);
}

export async function deleteAfiliadoOrgService(id: number): Promise<void> {
  // Check if record exists
  const existing = await getAfiliadoOrgById(id);
  if (!existing) {
    throw new Error('AFILIADO_ORG_NOT_FOUND');
  }
  return deleteAfiliadoOrg(id);
}