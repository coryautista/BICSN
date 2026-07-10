import {
  CatalogoMotivoBaja,
  CreateCatalogoMotivoBajaData,
  ListCatalogoMotivoBajaFilters,
  UpdateCatalogoMotivoBajaData
} from '../entities/CatalogoMotivoBaja.js';

export interface ICatalogoMotivoBajaRepository {
  findAll(filters?: ListCatalogoMotivoBajaFilters): Promise<CatalogoMotivoBaja[]>;
  findById(id: number): Promise<CatalogoMotivoBaja | undefined>;
  create(data: CreateCatalogoMotivoBajaData): Promise<CatalogoMotivoBaja>;
  update(data: UpdateCatalogoMotivoBajaData): Promise<CatalogoMotivoBaja>;
  deactivate(id: number, usuario?: string | null): Promise<CatalogoMotivoBaja>;
}
