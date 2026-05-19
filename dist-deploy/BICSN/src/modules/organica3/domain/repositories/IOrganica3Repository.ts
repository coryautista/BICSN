import { Organica3, CreateOrganica3Data, UpdateOrganica3Data } from '../entities/Organica3.js';

import { DynamicQuery } from '../../organica3.schemas.js';

export interface IOrganica3Repository {
  findById(claveOrganica0: string, claveOrganica1: string, claveOrganica2: string, claveOrganica3: string): Promise<Organica3 | undefined>;
  findAll(): Promise<Organica3[]>;
  findByClaveOrganica0And1And2(claveOrganica0: string, claveOrganica1: string, claveOrganica2: string): Promise<Organica3[]>;
  create(data: CreateOrganica3Data): Promise<Organica3>;
  update(claveOrganica0: string, claveOrganica1: string, claveOrganica2: string, claveOrganica3: string, data: UpdateOrganica3Data): Promise<Organica3>;
  delete(claveOrganica0: string, claveOrganica1: string, claveOrganica2: string, claveOrganica3: string): Promise<boolean>;
  isInUse(claveOrganica0: string, claveOrganica1: string, claveOrganica2: string, claveOrganica3: string): Promise<boolean>;
  dynamicQuery(query: DynamicQuery): Promise<Organica3[]>;
}
