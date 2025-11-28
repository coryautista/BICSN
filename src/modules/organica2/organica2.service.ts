import { CreateOrganica2, UpdateOrganica2, DynamicQuery } from './organica2.schemas.js';
import { logAudit, extractUserInfo, extractRequestInfo } from '../../utils/audit.js';

export class Organica2Service {
  private organica2Repo: any;

  constructor(organica2Repo: any) {
    this.organica2Repo = organica2Repo;
  }

  async getOrganica2ById(claveOrganica0: string, claveOrganica1: string, claveOrganica2: string) {
    const record = await this.organica2Repo.findById(claveOrganica0, claveOrganica1, claveOrganica2);
    if (!record) {
      throw new Error('ORGANICA2_NOT_FOUND');
    }
    return record;
  }

  async getAllOrganica2() {
    return await this.organica2Repo.findAll();
  }

  async createOrganica2Record(data: CreateOrganica2, req?: any) {
    // Check if record already exists
    const existing = await this.organica2Repo.findById(data.claveOrganica0, data.claveOrganica1, data.claveOrganica2);
    if (existing) {
      throw new Error('ORGANICA2_EXISTS');
    }

    const record = await this.organica2Repo.create(data);

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

  async updateOrganica2Record(claveOrganica0: string, claveOrganica1: string, claveOrganica2: string, data: UpdateOrganica2, req?: any) {
    const existing = await this.organica2Repo.findById(claveOrganica0, claveOrganica1, claveOrganica2);
    if (!existing) {
      throw new Error('ORGANICA2_NOT_FOUND');
    }

    const record = await this.organica2Repo.update(claveOrganica0, claveOrganica1, claveOrganica2, data);

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

  async deleteOrganica2Record(claveOrganica0: string, claveOrganica1: string, claveOrganica2: string, req?: any) {
    const existing = await this.organica2Repo.findById(claveOrganica0, claveOrganica1, claveOrganica2);
    if (!existing) {
      throw new Error('ORGANICA2_NOT_FOUND');
    }

    const deleted = await this.organica2Repo.delete(claveOrganica0, claveOrganica1, claveOrganica2);
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

  async queryOrganica2Dynamic(query: DynamicQuery) {
    return await this.organica2Repo.dynamicQuery(query);
  }

  async getOrganica2ByUserToken(claveOrganica0?: string, claveOrganica1?: string) {
    return await this.organica2Repo.findByClaveOrganica0And1(claveOrganica0, claveOrganica1);
  }
}