import { findOrganica3ById, listOrganica3, createOrganica3, updateOrganica3, deleteOrganica3, dynamicQueryOrganica3 } from './organica3.repo.js';
import { CreateOrganica3, UpdateOrganica3, DynamicQuery } from './organica3.schemas.js';
import { logAudit, extractUserInfo, extractRequestInfo } from '../../utils/audit.js';

// [FIREBIRD] Service layer for ORGANICA_3 operations
export async function getOrganica3ById(claveOrganica0: string, claveOrganica1: string, claveOrganica2: string, claveOrganica3: string) {
  const record = await findOrganica3ById(claveOrganica0, claveOrganica1, claveOrganica2, claveOrganica3);
  if (!record) {
    throw new Error('ORGANICA3_NOT_FOUND');
  }
  return record;
}

export async function getAllOrganica3() {
  return await listOrganica3();
}

export async function createOrganica3Record(data: CreateOrganica3, req?: any) {
  // Check if record already exists
  const existing = await findOrganica3ById(data.claveOrganica0, data.claveOrganica1, data.claveOrganica2, data.claveOrganica3);
  if (existing) {
    throw new Error('ORGANICA3_EXISTS');
  }

  const record = await createOrganica3(data);

  // Audit logging
  if (req) {
    const userInfo = extractUserInfo(req);
    const requestInfo = extractRequestInfo(req);
    await logAudit({
      entidad: 'ORGANICA_3',
      entidadId: `${data.claveOrganica0}-${data.claveOrganica1}-${data.claveOrganica2}-${data.claveOrganica3}`,
      accion: 'CREATE',
      datosDespues: record,
      ...userInfo,
      ...requestInfo
    });
  }

  return record;
}

export async function updateOrganica3Record(claveOrganica0: string, claveOrganica1: string, claveOrganica2: string, claveOrganica3: string, data: UpdateOrganica3, req?: any) {
  const existing = await findOrganica3ById(claveOrganica0, claveOrganica1, claveOrganica2, claveOrganica3);
  if (!existing) {
    throw new Error('ORGANICA3_NOT_FOUND');
  }

  const record = await updateOrganica3(claveOrganica0, claveOrganica1, claveOrganica2, claveOrganica3, data);

  // Audit logging
  if (req) {
    const userInfo = extractUserInfo(req);
    const requestInfo = extractRequestInfo(req);
    await logAudit({
      entidad: 'ORGANICA_3',
      entidadId: `${claveOrganica0}-${claveOrganica1}-${claveOrganica2}-${claveOrganica3}`,
      accion: 'UPDATE',
      datosAntes: existing,
      datosDespues: record,
      ...userInfo,
      ...requestInfo
    });
  }

  return record;
}

export async function deleteOrganica3Record(claveOrganica0: string, claveOrganica1: string, claveOrganica2: string, claveOrganica3: string, req?: any) {
  const existing = await findOrganica3ById(claveOrganica0, claveOrganica1, claveOrganica2, claveOrganica3);
  if (!existing) {
    throw new Error('ORGANICA3_NOT_FOUND');
  }

  const deleted = await deleteOrganica3(claveOrganica0, claveOrganica1, claveOrganica2, claveOrganica3);
  if (!deleted) {
    throw new Error('ORGANICA3_DELETE_FAILED');
  }

  // Audit logging
  if (req) {
    const userInfo = extractUserInfo(req);
    const requestInfo = extractRequestInfo(req);
    await logAudit({
      entidad: 'ORGANICA_3',
      entidadId: `${claveOrganica0}-${claveOrganica1}-${claveOrganica2}-${claveOrganica3}`,
      accion: 'DELETE',
      datosAntes: existing,
      ...userInfo,
      ...requestInfo
    });
  }

  return { claveOrganica0, claveOrganica1, claveOrganica2, claveOrganica3, deleted: true };
}

export async function queryOrganica3Dynamic(query: DynamicQuery) {
  return await dynamicQueryOrganica3(query);
}