import { OrganicaChild } from '../entities/OrganicaChild.js';

export interface OrganicaCascadeFirebirdScope { org0: string; org1: string }

export interface IOrganicaCascadeRepository {
  findOrganica1ByOrganica0(claveOrganica0: string, scope: OrganicaCascadeFirebirdScope): Promise<OrganicaChild[]>;
  findOrganica2ByOrganica1(claveOrganica0: string, claveOrganica1: string, scope: OrganicaCascadeFirebirdScope): Promise<OrganicaChild[]>;
  findOrganica3ByOrganica2(claveOrganica0: string, claveOrganica1: string, claveOrganica2: string, scope: OrganicaCascadeFirebirdScope): Promise<OrganicaChild[]>;
}
