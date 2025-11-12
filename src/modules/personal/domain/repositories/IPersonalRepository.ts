import { Personal, CreatePersonalData, UpdatePersonalData } from '../entities/Personal.js';

export interface IPersonalRepository {
  findAll(claveOrganica0?: string, claveOrganica1?: string): Promise<Personal[]>;
  findById(interno: number): Promise<Personal | undefined>;
  create(data: CreatePersonalData): Promise<Personal>;
  update(interno: number, data: UpdatePersonalData): Promise<Personal>;
  delete(interno: number): Promise<void>;
}
