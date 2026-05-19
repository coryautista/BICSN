import { UserRole } from '../entities/UserRole.js';
import { sql } from '../../../../db/context.js';

export interface IUserRoleRepository {
  findAll(): Promise<UserRole[]>;
  findByIds(usuarioId: string, roleId: string): Promise<UserRole | undefined>;
  findByUsuarioId(usuarioId: string): Promise<UserRole[]>;
  create(usuarioId: string, roleId: string, tx?: sql.Transaction): Promise<UserRole>;
  delete(usuarioId: string, roleId: string, tx?: sql.Transaction): Promise<{ usuarioId: string; roleId: string }>;
}
