import { Personal, CreatePersonalData, UpdatePersonalData } from '../entities/Personal.js';

export interface PersonalFirebirdScope { org0: string; org1: string }

export interface IPersonalRepository {
  findAll(scope: PersonalFirebirdScope, claveOrganica0?: string, claveOrganica1?: string): Promise<Personal[]>;
  findById(interno: number, scope: PersonalFirebirdScope): Promise<Personal | undefined>;
  create(data: CreatePersonalData, scope: PersonalFirebirdScope): Promise<Personal>;
  update(interno: number, data: UpdatePersonalData, scope: PersonalFirebirdScope): Promise<Personal>;
  delete(interno: number, scope: PersonalFirebirdScope): Promise<void>;
}
