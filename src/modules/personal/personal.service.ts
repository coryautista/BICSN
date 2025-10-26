import {
  getAllPersonal,
  getPersonalById,
  createPersonal,
  updatePersonal,
  deletePersonal,
  type Personal
} from './personal.repo.js';

export async function getAllPersonalService(claveOrganica0?: string, claveOrganica1?: string): Promise<Personal[]> {
  return getAllPersonal(claveOrganica0, claveOrganica1);
}

export async function getPersonalByIdService(interno: number): Promise<Personal> {
  const record = await getPersonalById(interno);
  if (!record) {
    throw new Error('PERSONAL_NOT_FOUND');
  }
  return record;
}

export async function createPersonalService(data: Omit<Personal, 'fullname'>): Promise<Personal> {
  return createPersonal(data);
}

export async function updatePersonalService(interno: number, data: Partial<Omit<Personal, 'interno' | 'fullname'>>): Promise<Personal> {
  // Check if record exists
  const existing = await getPersonalById(interno);
  if (!existing) {
    throw new Error('PERSONAL_NOT_FOUND');
  }
  return updatePersonal(interno, data);
}

export async function deletePersonalService(interno: number): Promise<void> {
  // Check if record exists
  const existing = await getPersonalById(interno);
  if (!existing) {
    throw new Error('PERSONAL_NOT_FOUND');
  }
  return deletePersonal(interno);
}