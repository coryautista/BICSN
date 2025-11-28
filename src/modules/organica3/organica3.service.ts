import { CreateOrganica3, UpdateOrganica3, DynamicQuery } from './organica3.schemas.js';
import { logAudit, extractUserInfo, extractRequestInfo } from '../../utils/audit.js';

export class Organica3Service {
  private organica3Repo: any;

  constructor(organica3Repo: any) {
    this.organica3Repo = organica3Repo;
  }

  async getOrganica3ById(claveOrganica0: string, claveOrganica1: string, claveOrganica2: string, claveOrganica3: string) {
    const record = await this.organica3Repo.findById(claveOrganica0, claveOrganica1, claveOrganica2, claveOrganica3);
    if (!record) {
      throw new Error('ORGANICA3_NOT_FOUND');
    }
    return record;
  }

  async getAllOrganica3() {
    return await this.organica3Repo.findAll();
  }

  async createOrganica3Record(data: CreateOrganica3, req?: any) {
    // Check if record already exists
    const existing = await this.organica3Repo.findById(data.claveOrganica0, data.claveOrganica1, data.claveOrganica2, data.claveOrganica3);
    if (existing) {
      throw new Error('ORGANICA3_EXISTS');
    }

    const record = await this.organica3Repo.create(data);

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

  async updateOrganica3Record(claveOrganica0: string, claveOrganica1: string, claveOrganica2: string, claveOrganica3: string, data: UpdateOrganica3, req?: any) {
    const existing = await this.organica3Repo.findById(claveOrganica0, claveOrganica1, claveOrganica2, claveOrganica3);
    if (!existing) {
      throw new Error('ORGANICA3_NOT_FOUND');
    }

    const record = await this.organica3Repo.update(claveOrganica0, claveOrganica1, claveOrganica2, claveOrganica3, data);

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

  async deleteOrganica3Record(claveOrganica0: string, claveOrganica1: string, claveOrganica2: string, claveOrganica3: string, req?: any) {
    const existing = await this.organica3Repo.findById(claveOrganica0, claveOrganica1, claveOrganica2, claveOrganica3);
    if (!existing) {
      throw new Error('ORGANICA3_NOT_FOUND');
    }

    const deleted = await this.organica3Repo.delete(claveOrganica0, claveOrganica1, claveOrganica2, claveOrganica3);
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

  async queryOrganica3Dynamic(query: DynamicQuery) {
    return await this.organica3Repo.dynamicQuery(query);
  }

  async getOrganica3ByUserToken(claveOrganica0?: string, claveOrganica1?: string, claveOrganica2?: string) {
    return await this.organica3Repo.findByClaveOrganica0And1And2(claveOrganica0, claveOrganica1, claveOrganica2);
  }
}