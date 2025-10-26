import {
  getAllOrgPersonal,
  getOrgPersonalById,
  createOrgPersonal,
  updateOrgPersonal,
  deleteOrgPersonal,
  type OrgPersonal
} from './orgPersonal.repo.js';

export async function getAllOrgPersonalService(): Promise<OrgPersonal[]> {
  return getAllOrgPersonal();
}

export async function getOrgPersonalByIdService(interno: number): Promise<OrgPersonal> {
  const record = await getOrgPersonalById(interno);
  if (!record) {
    throw new Error('ORG_PERSONAL_NOT_FOUND');
  }
  return record;
}

export async function createOrgPersonalService(data: Omit<OrgPersonal, 'orgs1' | 'orgs2' | 'orgs3' | 'orgs'>): Promise<OrgPersonal> {
  return createOrgPersonal(data);
}

export async function updateOrgPersonalService(interno: number, data: Partial<Omit<OrgPersonal, 'interno' | 'orgs1' | 'orgs2' | 'orgs3' | 'orgs'>>): Promise<OrgPersonal> {
  // Check if record exists
  const existing = await getOrgPersonalById(interno);
  if (!existing) {
    throw new Error('ORG_PERSONAL_NOT_FOUND');
  }
  return updateOrgPersonal(interno, data);
}

export async function deleteOrgPersonalService(interno: number): Promise<void> {
  // Check if record exists
  const existing = await getOrgPersonalById(interno);
  if (!existing) {
    throw new Error('ORG_PERSONAL_NOT_FOUND');
  }
  return deleteOrgPersonal(interno);
}