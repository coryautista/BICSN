import { Municipio, CreateMunicipioData, UpdateMunicipioData } from '../entities/Municipio.js';

export interface IMunicipioRepository {
  findAll(): Promise<Municipio[]>;
  findByEstado(estadoId: string): Promise<Municipio[]>;
  findById(municipioId: number): Promise<Municipio | undefined>;
  findByClave(claveMunicipio: string): Promise<Municipio | undefined>;
  create(data: CreateMunicipioData, tx?: any): Promise<Municipio>;
  update(municipioId: number, data: UpdateMunicipioData, tx?: any): Promise<Municipio | undefined>;
  delete(municipioId: number, tx?: any): Promise<boolean>;
}
