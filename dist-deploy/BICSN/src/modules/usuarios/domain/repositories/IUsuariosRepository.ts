import { Usuario, CreateUsuarioData, UpdateUsuarioData, UsuarioRole } from '../entities/Usuario.js';

export interface IUsuariosRepository {
  // User CRUD
  findAll(): Promise<Usuario[]>;
  findById(userId: string): Promise<Usuario | undefined>;
  create(data: CreateUsuarioData): Promise<Usuario>;
  update(userId: string, data: UpdateUsuarioData): Promise<Usuario | undefined>;
  delete(userId: string): Promise<boolean>;
  
  // User roles
  getUserRoles(userId: string): Promise<UsuarioRole[]>;
  assignRole(userId: string, roleId: string): Promise<void>;
  removeRole(userId: string, roleId: string): Promise<void>;
  
  // User search
  findByUsername(username: string): Promise<Usuario | undefined>;
  findByEmail(email: string): Promise<Usuario | undefined>;
}
