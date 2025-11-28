import { IOrgPersonalRepository } from '../../domain/repositories/IOrgPersonalRepository.js';
import { OrgPersonal, CreateOrgPersonalData, UpdateOrgPersonalData } from '../../domain/entities/OrgPersonal.js';
import * as repo from '../../orgPersonal.repo.js';

export class OrgPersonalRepository implements IOrgPersonalRepository {
  async findAll(): Promise<OrgPersonal[]> {
    return await repo.getAllOrgPersonal();
  }

  async findById(interno: number): Promise<OrgPersonal | undefined> {
    const result = await repo.getOrgPersonalById(interno);
    return result === null ? undefined : result;
  }

  async findBySearch(searchTerm: string): Promise<OrgPersonal | undefined> {
    const result = await repo.getOrgPersonalBySearch(searchTerm);
    return result === null ? undefined : result;
  }

  async create(data: CreateOrgPersonalData): Promise<OrgPersonal> {
    return await repo.createOrgPersonal(data);
  }

  async update(interno: number, data: UpdateOrgPersonalData): Promise<OrgPersonal> {
    return await repo.updateOrgPersonal(interno, data);
  }

  async delete(interno: number): Promise<void> {
    return await repo.deleteOrgPersonal(interno);
  }
}
