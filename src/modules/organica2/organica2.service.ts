import { findOrganica2ById, listOrganica2, createOrganica2, updateOrganica2, deleteOrganica2, dynamicQueryOrganica2 } from './organica2.repo.js';
import { CreateOrganica2, UpdateOrganica2, DynamicQuery } from './organica2.schemas.js';
import { logAudit, extractUserInfo, extractRequestInfo } from '../../utils/audit.js';

// [FIREBIRD] Service layer for ORGANICA_2 operations
export async function getOrganica2ById(claveOrganica0: string, claveOrganica1: string, claveOrganica2: string) {
  const record = await findOrganica2ById(claveOrganica0, claveOrganica1, claveOrganica2);
  if (!record) {
    throw new Error('ORGANICA2_NOT_FOUND');
  }
  return record;
}

export async function getAllOrganica2() {
  return await listOrganica2();
}

export async function createOrganica2Record(data: CreateOrganica2, req?: any) {
  // Check if record already exists
  const existing = await findOrganica2ById(data.claveOrganica0, data.claveOrganica1, data.claveOrganica2);
  if (existing) {
    throw new Error('ORGANICA2_EXISTS');
  }

  const record = await createOrganica2(data);

  // Audit logging
  if (req) {
    const userInfo = extractUserInfo(req);
    const requestInfo = extractRequestInfo(req);
    await logAudit({
      entidad: 'ORGANICA_2',
      entidadId: `${data.claveOrganica0}-${data.claveOrganica1}-${data.claveOrganica2}`,
      accion: 'CREATE',
      datosDespues: record,
      ...userInfo,
      ...requestInfo
    });
  }

  return record;
}

export async function updateOrganica2Record(claveOrganica0: string, claveOrganica1: string, claveOrganica2: string, data: UpdateOrganica2, req?: any) {
  const existing = await findOrganica2ById(claveOrganica0, claveOrganica1, claveOrganica2);
  if (!existing) {
    throw new Error('ORGANICA2_NOT_FOUND');
  }

  const record = await updateOrganica2(claveOrganica0, claveOrganica1, claveOrganica2, data);

  // Audit logging
  if (req) {
    const userInfo = extractUserInfo(req);
    const requestInfo = extractRequestInfo(req);
    await logAudit({
      entidad: 'ORGANICA_2',
      entidadId: `${claveOrganica0}-${claveOrganica1}-${claveOrganica2}`,
      accion: 'UPDATE',
      datosAntes: existing,
      datosDespues: record,
      ...userInfo,
      ...requestInfo
    });
  }

  return record;
}

export async function deleteOrganica2Record(claveOrganica0: string, claveOrganica1: string, claveOrganica2: string, req?: any) {
  const existing = await findOrganica2ById(claveOrganica0, claveOrganica1, claveOrganica2);
  if (!existing) {
    throw new Error('ORGANICA2_NOT_FOUND');
  }

  const deleted = await deleteOrganica2(claveOrganica0, claveOrganica1, claveOrganica2);
  if (!deleted) {
    throw new Error('ORGANICA2_DELETE_FAILED');
  }

  // Audit logging
  if (req) {
    const userInfo = extractUserInfo(req);
    const requestInfo = extractRequestInfo(req);
    await logAudit({
      entidad: 'ORGANICA_2',
      entidadId: `${claveOrganica0}-${claveOrganica1}-${claveOrganica2}`,
      accion: 'DELETE',
      datosAntes: existing,
      ...userInfo,
      ...requestInfo
    });
  }

  return { claveOrganica0, claveOrganica1, claveOrganica2, deleted: true };
}

export async function queryOrganica2Dynamic(query: DynamicQuery) {
  return await dynamicQueryOrganica2(query);
}