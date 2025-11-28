import { Organica0, CreateOrganica0Data, UpdateOrganica0Data } from '../entities/Organica0.js';

export interface IOrganica0Repository {
  findById(claveOrganica: string): Promise<Organica0 | undefined>;
  findAll(): Promise<Organica0[]>;
  create(data: CreateOrganica0Data): Promise<Organica0>;
  update(claveOrganica: string, data: UpdateOrganica0Data): Promise<Organica0>;
  delete(claveOrganica: string): Promise<boolean>;
  isInUse(claveOrganica: string): Promise<boolean>;
}
