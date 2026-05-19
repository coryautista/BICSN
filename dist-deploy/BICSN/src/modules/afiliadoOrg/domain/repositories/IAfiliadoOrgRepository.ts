import { AfiliadoOrg, CreateAfiliadoOrgData, UpdateAfiliadoOrgData } from '../entities/AfiliadoOrg.js';

export interface IAfiliadoOrgRepository {
  findAll(): Promise<AfiliadoOrg[]>;
  findById(id: number): Promise<AfiliadoOrg | undefined>;
  findByAfiliadoId(afiliadoId: number): Promise<AfiliadoOrg[]>;
  create(data: CreateAfiliadoOrgData): Promise<AfiliadoOrg>;
  update(data: UpdateAfiliadoOrgData): Promise<AfiliadoOrg>;
  delete(id: number): Promise<void>;
}
