import { Organica1, CreateOrganica1Data, UpdateOrganica1Data } from '../entities/Organica1.js';

export interface IOrganica1Repository {
  findById(claveOrganica0: string, claveOrganica1: string): Promise<Organica1 | undefined>;
  findAll(): Promise<Organica1[]>;
  findByClaveOrganica0(claveOrganica0: string): Promise<Organica1[]>;
  create(data: CreateOrganica1Data): Promise<Organica1>;
  update(claveOrganica0: string, claveOrganica1: string, data: UpdateOrganica1Data): Promise<Organica1>;
  delete(claveOrganica0: string, claveOrganica1: string): Promise<boolean>;
}
