import { Organica2, CreateOrganica2Data, UpdateOrganica2Data } from '../entities/Organica2.js';
import { DynamicQuery } from '../../organica2.schemas.js';

export interface Organica2FirebirdScope { org0: string; org1: string }

export interface IOrganica2Repository {
  findById(claveOrganica0: string, claveOrganica1: string, claveOrganica2: string, scope: Organica2FirebirdScope): Promise<Organica2 | undefined>;
  findAll(scope: Organica2FirebirdScope): Promise<Organica2[]>;
  findByClaveOrganica0And1(claveOrganica0: string, claveOrganica1: string, scope: Organica2FirebirdScope): Promise<Organica2[]>;
  create(data: CreateOrganica2Data, scope: Organica2FirebirdScope): Promise<Organica2>;
  update(claveOrganica0: string, claveOrganica1: string, claveOrganica2: string, data: UpdateOrganica2Data, scope: Organica2FirebirdScope): Promise<Organica2>;
  delete(claveOrganica0: string, claveOrganica1: string, claveOrganica2: string, scope: Organica2FirebirdScope): Promise<boolean>;
  isInUse(claveOrganica0: string, claveOrganica1: string, claveOrganica2: string, scope: Organica2FirebirdScope): Promise<boolean>;
  dynamicQuery(query: DynamicQuery, scope: Organica2FirebirdScope): Promise<Organica2[]>;
}
