import { IPersonalRepository } from '../../domain/repositories/IPersonalRepository.js';
import { Personal, CreatePersonalData, UpdatePersonalData } from '../../domain/entities/Personal.js';
import * as repo from '../../personal.repo.js';

export class PersonalRepository implements IPersonalRepository {
  async findAll(claveOrganica0?: string, claveOrganica1?: string): Promise<Personal[]> {
    return await repo.getAllPersonal(claveOrganica0, claveOrganica1);
  }

  async findById(interno: number): Promise<Personal | undefined> {
    return await repo.getPersonalById(interno);
  }

  async create(data: CreatePersonalData): Promise<Personal> {
    return await repo.createPersonal(data);
  }

  async update(interno: number, data: UpdatePersonalData): Promise<Personal> {
    return await repo.updatePersonal(interno, data);
  }

  async delete(interno: number): Promise<void> {
    return await repo.deletePersonal(interno);
  }
}
