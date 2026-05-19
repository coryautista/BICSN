import { Role } from '../entities/Role.js';
import { sql } from '../../../../db/context.js';

export interface IRoleRepository {
  findAll(): Promise<Role[]>;
  findById(id: string): Promise<Role | undefined>;
  findByName(name: string): Promise<Role | undefined>;
  create(data: { name: string; description?: string; isSystem?: boolean; isEntidad?: boolean }, tx?: sql.Transaction): Promise<Role>;
  createWithoutOutput(data: { name: string; description?: string; isSystem?: boolean; isEntidad?: boolean }, tx?: sql.Transaction): Promise<void>;
  findUserById(userId: string): Promise<any | undefined>;
  assignUserRole(userId: string, roleId: string, tx?: sql.Transaction): Promise<void>;
  unassignUserRole(userId: string, roleId: string, tx?: sql.Transaction): Promise<void>;
}
