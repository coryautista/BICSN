import { findOrganica1ById, listOrganica1, createOrganica1, updateOrganica1, deleteOrganica1, dynamicQueryOrganica1 } from './organica1.repo.js';
import { CreateOrganica1, UpdateOrganica1, DynamicQuery } from './organica1.schemas.js';
import { logAudit, extractUserInfo, extractRequestInfo } from '../../utils/audit.js';

// [FIREBIRD] Service layer for ORGANICA_1 operations
export async function getOrganica1ById(claveOrganica0: string, claveOrganica1: string) {
  const record = await findOrganica1ById(claveOrganica0, claveOrganica1);
  if (!record) {
    throw new Error('ORGANICA1_NOT_FOUND');
  }
  return record;
}

export async function getAllOrganica1() {
  return await listOrganica1();
}

export async function createOrganica1Record(data: CreateOrganica1, req?: any) {
  // Check if record already exists
  const existing = await findOrganica1ById(data.claveOrganica0, data.claveOrganica1);
  if (existing) {
    throw new Error('ORGANICA1_EXISTS');
  }

  const record = await createOrganica1(data);

  // Audit logging
  if (req) {
    const userInfo = extractUserInfo(req);
    const requestInfo = extractRequestInfo(req);
    await logAudit({
      entidad: 'ORGANICA_1',
      entidadId: `${data.claveOrganica0}-${data.claveOrganica1}`,
      accion: 'CREATE',
      datosDespues: record,
      ...userInfo,
      ...requestInfo
    });
  }

  return record;
}

export async function updateOrganica1Record(claveOrganica0: string, claveOrganica1: string, data: UpdateOrganica1, req?: any) {
  const existing = await findOrganica1ById(claveOrganica0, claveOrganica1);
  if (!existing) {
    throw new Error('ORGANICA1_NOT_FOUND');
  }

  const record = await updateOrganica1(claveOrganica0, claveOrganica1, data);

  // Audit logging
  if (req) {
    const userInfo = extractUserInfo(req);
    const requestInfo = extractRequestInfo(req);
    await logAudit({
      entidad: 'ORGANICA_1',
      entidadId: `${claveOrganica0}-${claveOrganica1}`,
      accion: 'UPDATE',
      datosAntes: existing,
      datosDespues: record,
      ...userInfo,
      ...requestInfo
    });
  }

  return record;
}

export async function deleteOrganica1Record(claveOrganica0: string, claveOrganica1: string, req?: any) {
  const existing = await findOrganica1ById(claveOrganica0, claveOrganica1);
  if (!existing) {
    throw new Error('ORGANICA1_NOT_FOUND');
  }

  const deleted = await deleteOrganica1(claveOrganica0, claveOrganica1);
  if (!deleted) {
    throw new Error('ORGANICA1_DELETE_FAILED');
  }

  // Audit logging
  if (req) {
    const userInfo = extractUserInfo(req);
    const requestInfo = extractRequestInfo(req);
    await logAudit({
      entidad: 'ORGANICA_1',
      entidadId: `${claveOrganica0}-${claveOrganica1}`,
      accion: 'DELETE',
      datosAntes: existing,
      ...userInfo,
      ...requestInfo
    });
  }

  return { claveOrganica0, claveOrganica1, deleted: true };
}

export async function queryOrganica1Dynamic(query: DynamicQuery) {
  return await dynamicQueryOrganica1(query);
}