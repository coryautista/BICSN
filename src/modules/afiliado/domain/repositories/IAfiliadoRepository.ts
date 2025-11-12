import { Afiliado, CreateAfiliadoData, UpdateAfiliadoData } from '../entities/Afiliado.js';

export interface IAfiliadoRepository {
  findAll(): Promise<Afiliado[]>;
  findById(id: number): Promise<Afiliado | undefined>;
  create(data: CreateAfiliadoData): Promise<Afiliado>;
  update(data: UpdateAfiliadoData): Promise<Afiliado>;
  delete(id: number): Promise<void>;
}
