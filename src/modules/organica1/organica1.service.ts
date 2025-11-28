import { CreateOrganica1, UpdateOrganica1, DynamicQuery } from './organica1.schemas.js';
import { logAudit, extractUserInfo, extractRequestInfo } from '../../utils/audit.js';

export class Organica1Service {
  private organica1Repo: any;

  constructor(deps: { organica1Repo: any }) {
    this.organica1Repo = deps.organica1Repo;
  }

  async getOrganica1ById(claveOrganica0: string, claveOrganica1: string) {
    const record = await this.organica1Repo.findById(claveOrganica0, claveOrganica1);
    if (!record) {
      throw new Error('ORGANICA1_NOT_FOUND');
    }
    return record;
  }

  async getAllOrganica1() {
    return await this.organica1Repo.findAll();
  }

  async createOrganica1Record(data: CreateOrganica1, req?: any) {
    // Check if record already exists
    const existing = await this.organica1Repo.findById(data.claveOrganica0, data.claveOrganica1);
    if (existing) {
      throw new Error('ORGANICA1_EXISTS');
    }

    const record = await this.organica1Repo.create(data);

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

  async updateOrganica1Record(claveOrganica0: string, claveOrganica1: string, data: UpdateOrganica1, req?: any) {
    const existing = await this.organica1Repo.findById(claveOrganica0, claveOrganica1);
    if (!existing) {
      throw new Error('ORGANICA1_NOT_FOUND');
    }

    const record = await this.organica1Repo.update(claveOrganica0, claveOrganica1, data);

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

  async deleteOrganica1Record(claveOrganica0: string, claveOrganica1: string, req?: any) {
    const existing = await this.organica1Repo.findById(claveOrganica0, claveOrganica1);
    if (!existing) {
      throw new Error('ORGANICA1_NOT_FOUND');
    }

    const deleted = await this.organica1Repo.delete(claveOrganica0, claveOrganica1);
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

  async queryOrganica1Dynamic(query: DynamicQuery) {
    return await this.organica1Repo.dynamicQuery(query);
  }
}
