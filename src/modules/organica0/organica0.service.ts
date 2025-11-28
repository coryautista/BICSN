import { findOrganica0ById, listOrganica0, countOrganica0, createOrganica0, updateOrganica0, deleteOrganica0 } from './organica0.repo.js';
import { CreateOrganica0, UpdateOrganica0 } from './organica0.schemas.js';

// [FIREBIRD] Service layer for ORGANICA_0 operations
export async function getOrganica0ById(claveOrganica: string) {
  const record = await findOrganica0ById(claveOrganica);
  if (!record) {
    throw new Error('ORGANICA0_NOT_FOUND');
  }
  return record;
}

export async function getAllOrganica0(limit?: number, offset?: number) {
  console.log(`[SERVICE] getAllOrganica0: Called with limit=${limit}, offset=${offset}`);
  const startTime = Date.now();
  const result = await listOrganica0(limit, offset);
  const endTime = Date.now();
  console.log(`[SERVICE] getAllOrganica0: Completed in ${endTime - startTime}ms, returned ${result.length} records`);
  return result;
}

export async function getOrganica0Count() {
  console.log(`[SERVICE] getOrganica0Count: Called`);
  const startTime = Date.now();
  const result = await countOrganica0();
  const endTime = Date.now();
  console.log(`[SERVICE] getOrganica0Count: Completed in ${endTime - startTime}ms, count=${result}`);
  return result;
}

export async function createOrganica0Record(data: CreateOrganica0) {
  // Check if record already exists
  const existing = await findOrganica0ById(data.claveOrganica);
  if (existing) {
    throw new Error('ORGANICA0_EXISTS');
  }

  return await createOrganica0(data);
}

export async function updateOrganica0Record(claveOrganica: string, data: UpdateOrganica0) {
  const existing = await findOrganica0ById(claveOrganica);
  if (!existing) {
    throw new Error('ORGANICA0_NOT_FOUND');
  }

  return await updateOrganica0(claveOrganica, data);
}

export async function deleteOrganica0Record(claveOrganica: string) {
  const existing = await findOrganica0ById(claveOrganica);
  if (!existing) {
    throw new Error('ORGANICA0_NOT_FOUND');
  }

  const deleted = await deleteOrganica0(claveOrganica);
  if (!deleted) {
    throw new Error('ORGANICA0_DELETE_FAILED');
  }

  return { claveOrganica, deleted: true };
}