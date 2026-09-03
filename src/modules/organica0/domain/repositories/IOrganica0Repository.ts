import { Organica0, CreateOrganica0Data, UpdateOrganica0Data } from '../entities/Organica0.js';

export interface Organica0FirebirdScope { org0: string; org1: string }

export interface IOrganica0Repository {
  findById(claveOrganica: string, scope: Organica0FirebirdScope): Promise<Organica0 | undefined>;
  findAll(scope: Organica0FirebirdScope, limit?: number, offset?: number): Promise<Organica0[]>;
  create(data: CreateOrganica0Data, scope: Organica0FirebirdScope): Promise<Organica0>;
  update(claveOrganica: string, data: UpdateOrganica0Data, scope: Organica0FirebirdScope): Promise<Organica0>;
  delete(claveOrganica: string, scope: Organica0FirebirdScope): Promise<boolean>;
  isInUse(claveOrganica: string, scope: Organica0FirebirdScope): Promise<boolean>;
}
