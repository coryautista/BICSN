import { CategoriaPuestoOrg, CreateCategoriaPuestoOrgData, UpdateCategoriaPuestoOrgData, ListCategoriaPuestoOrgFilters } from '../entities/CategoriaPuestoOrg.js';

export interface ICategoriaPuestoOrgRepository {
  findById(categoriaPuestoOrgId: number): Promise<CategoriaPuestoOrg | undefined>;
  findAll(filters?: ListCategoriaPuestoOrgFilters): Promise<CategoriaPuestoOrg[]>;
  create(data: CreateCategoriaPuestoOrgData): Promise<CategoriaPuestoOrg>;
  update(data: UpdateCategoriaPuestoOrgData): Promise<CategoriaPuestoOrg>;
  delete(categoriaPuestoOrgId: number): Promise<number>;
}
