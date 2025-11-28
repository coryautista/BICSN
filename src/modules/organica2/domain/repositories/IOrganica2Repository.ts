import { Organica2, CreateOrganica2Data, UpdateOrganica2Data } from '../entities/Organica2.js';

export interface IOrganica2Repository {
  findById(claveOrganica0: string, claveOrganica1: string, claveOrganica2: string): Promise<Organica2 | undefined>;
  findAll(): Promise<Organica2[]>;
  findByClaveOrganica0And1(claveOrganica0: string, claveOrganica1: string): Promise<Organica2[]>;
  create(data: CreateOrganica2Data): Promise<Organica2>;
  update(claveOrganica0: string, claveOrganica1: string, claveOrganica2: string, data: UpdateOrganica2Data): Promise<Organica2>;
  delete(claveOrganica0: string, claveOrganica1: string, claveOrganica2: string): Promise<boolean>;
  isInUse(claveOrganica0: string, claveOrganica1: string, claveOrganica2: string): Promise<boolean>;
}
