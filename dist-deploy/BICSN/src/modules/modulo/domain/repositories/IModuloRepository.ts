import { Modulo, CreateModuloData, UpdateModuloData } from '../entities/Modulo.js';

export interface IModuloRepository {
  findById(id: number): Promise<Modulo | undefined>;
  findAll(): Promise<Modulo[]>;
  create(data: CreateModuloData): Promise<Modulo>;
  update(id: number, data: UpdateModuloData): Promise<Modulo>;
  delete(id: number): Promise<boolean>;
  findByName(nombre: string): Promise<Modulo | undefined>;
  isInUse(moduloId: number): Promise<boolean>;
}
