import { CodigoPostal } from '../entities/CodigoPostal.js';

export interface ICodigoPostalRepository {
  findAll(): Promise<CodigoPostal[]>;
  findById(codigoPostalId: number): Promise<CodigoPostal | undefined>;
  findByCode(codigoPostal: string): Promise<CodigoPostal | undefined>;
  create(codigoPostal: string, esValido: boolean, userId?: string): Promise<CodigoPostal>;
  update(codigoPostalId: number, esValido?: boolean, userId?: string): Promise<CodigoPostal | undefined>;
  delete(codigoPostalId: number): Promise<number | undefined>;
}
