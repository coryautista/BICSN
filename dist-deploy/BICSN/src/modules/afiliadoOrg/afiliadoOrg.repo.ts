import { getPool } from '../../db/mssql.js';
import { AfiliadoOrgRepository } from './infrastructure/persistence/AfiliadoOrgRepository.js';
import type { AfiliadoOrg } from './domain/entities/AfiliadoOrg.js';

export type { AfiliadoOrg } from './domain/entities/AfiliadoOrg.js';

async function getRepository(): Promise<AfiliadoOrgRepository> {
  return new AfiliadoOrgRepository(await getPool());
}

export async function getAllAfiliadoOrg(): Promise<AfiliadoOrg[]> {
  return (await getRepository()).findAll();
}

export async function getAfiliadoOrgById(id: number): Promise<AfiliadoOrg | undefined> {
  return (await getRepository()).findById(id);
}

export async function getAfiliadoOrgByAfiliadoId(afiliadoId: number): Promise<AfiliadoOrg[]> {
  return (await getRepository()).findByAfiliadoId(afiliadoId);
}

export async function createAfiliadoOrg(data: Omit<AfiliadoOrg, 'id' | 'createdAt' | 'updatedAt'>): Promise<AfiliadoOrg> {
  return (await getRepository()).create(data);
}

export async function updateAfiliadoOrg(id: number, data: Partial<Omit<AfiliadoOrg, 'id' | 'createdAt' | 'updatedAt'>>): Promise<AfiliadoOrg> {
  return (await getRepository()).update({ id, ...data });
}

export async function deleteAfiliadoOrg(id: number): Promise<void> {
  return (await getRepository()).delete(id);
}
