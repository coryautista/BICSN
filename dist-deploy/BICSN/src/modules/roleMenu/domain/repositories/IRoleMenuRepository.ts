import { RoleMenu, RoleMenuWithDetails } from '../entities/RoleMenu.js';
import { sql } from '../../../../db/context.js';

export interface IRoleMenuRepository {
  findAll(): Promise<RoleMenu[]>;
  findById(id: number): Promise<RoleMenu | undefined>;
  findByRoleId(roleId: string): Promise<RoleMenu[]>;
  findByMenuId(menuId: number): Promise<RoleMenu[]>;
  findByRoleNames(roleNames: string[]): Promise<RoleMenuWithDetails[]>;
  create(roleId: string, menuId: number, createdAt: string, tx?: sql.Transaction): Promise<RoleMenu>;
  update(id: number, roleId?: string, menuId?: number, createdAt?: string, tx?: sql.Transaction): Promise<RoleMenu | undefined>;
  delete(id: number, tx?: sql.Transaction): Promise<number | undefined>;
  deleteByRoleAndMenu(roleId: string, menuId: number, tx?: sql.Transaction): Promise<number | undefined>;
}
