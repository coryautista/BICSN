import { OrgPersonal, CreateOrgPersonalData, UpdateOrgPersonalData } from '../entities/OrgPersonal.js';

export interface IOrgPersonalRepository {
  findAll(): Promise<OrgPersonal[]>;
  findById(interno: number): Promise<OrgPersonal | undefined>;
  findBySearch(searchTerm: string): Promise<OrgPersonal | undefined>;
  create(data: CreateOrgPersonalData): Promise<OrgPersonal>;
  update(interno: number, data: UpdateOrgPersonalData): Promise<OrgPersonal>;
  delete(interno: number): Promise<void>;
}
