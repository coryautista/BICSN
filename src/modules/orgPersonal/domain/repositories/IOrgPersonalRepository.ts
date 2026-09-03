import { OrgPersonal, CreateOrgPersonalData, UpdateOrgPersonalData } from '../entities/OrgPersonal.js';

export interface OrgPersonalFirebirdScope { org0: string; org1: string }

export interface IOrgPersonalRepository {
  findAll(scope: OrgPersonalFirebirdScope): Promise<OrgPersonal[]>;
  findById(interno: number, scope: OrgPersonalFirebirdScope): Promise<OrgPersonal | undefined>;
  findBySearch(searchTerm: string, scope: OrgPersonalFirebirdScope): Promise<OrgPersonal | undefined>;
  findByNombreApellidosFechaNac(
    nombre: string,
    apellidoPaterno: string,
    apellidoMaterno: string | null,
    fechaNacimiento: string,
    scope: OrgPersonalFirebirdScope
  ): Promise<OrgPersonal | undefined>;
  create(data: CreateOrgPersonalData, scope: OrgPersonalFirebirdScope): Promise<OrgPersonal>;
  update(interno: number, data: UpdateOrgPersonalData, scope: OrgPersonalFirebirdScope): Promise<OrgPersonal>;
  delete(interno: number, scope: OrgPersonalFirebirdScope): Promise<void>;
}
