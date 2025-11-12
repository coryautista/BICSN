import { OrganicaChild } from '../entities/OrganicaChild.js';

export interface IOrganicaCascadeRepository {
  findOrganica1ByOrganica0(claveOrganica0: string): Promise<OrganicaChild[]>;
  findOrganica2ByOrganica1(claveOrganica0: string, claveOrganica1: string): Promise<OrganicaChild[]>;
  findOrganica3ByOrganica2(claveOrganica0: string, claveOrganica1: string, claveOrganica2: string): Promise<OrganicaChild[]>;
}
