import { findRoleMenuById, listRoleMenus, findRoleMenusByRoleId, findRoleMenusByMenuId, createRoleMenu, updateRoleMenu, deleteRoleMenu, deleteRoleMenuByRoleAndMenu, findRoleMenusByRoleNames } from './roleMenu.repo.js';
import { findRoleById } from '../role/role.repo.js';
import { findMenuById } from '../menu/menu.repo.js';

export async function getAllRoleMenus() {
  return listRoleMenus();
}

export async function getRoleMenuById(id: number) {
  const roleMenu = await findRoleMenuById(id);
  if (!roleMenu) throw new Error('ROLE_MENU_NOT_FOUND');
  return roleMenu;
}

export async function getRoleMenusByRoleId(roleId: string) {
  return findRoleMenusByRoleId(roleId);
}

export async function getRoleMenusByMenuId(menuId: number) {
  return findRoleMenusByMenuId(menuId);
}

export async function createRoleMenuItem(roleId: string, menuId: number, createdAt: string) {
  // Validar que el role existe
  const role = await findRoleById(roleId);
  if (!role) throw new Error('ROLE_NOT_FOUND');

  const menu = await findMenuById(menuId);
  if (!menu) throw new Error('MENU_NOT_FOUND');

  // Check if already assigned
  const existing = await findRoleMenusByRoleId(roleId);
  if (existing.some(rm => rm.menuId === menuId)) throw new Error('ROLE_MENU_ALREADY_EXISTS');

  return createRoleMenu(roleId, menuId, createdAt);
}

export async function updateRoleMenuItem(id: number, roleId?: string, menuId?: number, createdAt?: string) {
  // Verificar que existe
  const existing = await findRoleMenuById(id);
  if (!existing) throw new Error('ROLE_MENU_NOT_FOUND');

  // Validar si se cambia roleId o menuId
  if (roleId || menuId) {
    const newRoleId = roleId ?? existing.roleId;
    const newMenuId = menuId ?? existing.menuId;

    // Check if new combination already exists
    if (newRoleId !== existing.roleId || newMenuId !== existing.menuId) {
      const roleMenus = await findRoleMenusByRoleId(newRoleId);
      if (roleMenus.some(rm => rm.menuId === newMenuId && rm.id !== id)) throw new Error('ROLE_MENU_ALREADY_EXISTS');
    }

    // Validate menu exists
    if (menuId) {
      const menu = await findMenuById(menuId);
      if (!menu) throw new Error('MENU_NOT_FOUND');
    }
  }

  return updateRoleMenu(id, roleId, menuId, createdAt);
}

export async function deleteRoleMenuItem(id: number) {
  // Verificar que existe
  const existing = await findRoleMenuById(id);
  if (!existing) throw new Error('ROLE_MENU_NOT_FOUND');

  return deleteRoleMenu(id);
}

export async function assignMenuToRole(roleId: string, menuId: number) {
  // Validate menu exists
  const menu = await findMenuById(menuId);
  if (!menu) throw new Error('MENU_NOT_FOUND');

  // Check if already assigned
  const existing = await findRoleMenusByRoleId(roleId);
  if (existing.some(rm => rm.menuId === menuId)) throw new Error('ROLE_MENU_ALREADY_EXISTS');

  return createRoleMenu(roleId, menuId, new Date().toISOString());
}

export async function unassignMenuFromRole(roleId: string, menuId: number) {
  return deleteRoleMenuByRoleAndMenu(roleId, menuId);
}

export async function getRoleMenusByTokenRoles(userRoles: string[]) {
  return await findRoleMenusByRoleNames(userRoles);
}