import { createRole, findRoleByName, listRoles, findUserById, assignUserRole, unassignUserRole } from './role.repo.js';
import { getUserRoles } from '../auth/auth.repo.js';

export async function createRoleIfNotExists(name: string, description?: string, isSystem = false, isEntidad = false) {
  const existing = await findRoleByName(name);
  if (existing) return existing; // idempotente
  return createRole(name, description, isSystem, isEntidad);
}

export async function getAllRoles() {
  const roles = await listRoles();
  console.log('getAllRoles result:', JSON.stringify(roles, null, 2));
  return roles;
}

export async function addRoleToUserByName(userId: string, roleName: string) {
  const user = await findUserById(userId);
  if (!user) throw new Error('USER_NOT_FOUND');

  const role = await findRoleByName(roleName);
  if (!role) throw new Error('ROLE_NOT_FOUND');

  await assignUserRole(userId, role.id);
  const roles = await getUserRoles(userId);
  return { userId, roles };
}

export async function removeRoleFromUserByName(userId: string, roleName: string) {
  const user = await findUserById(userId);
  if (!user) throw new Error('USER_NOT_FOUND');

  const role = await findRoleByName(roleName);
  if (!role) throw new Error('ROLE_NOT_FOUND');

  await unassignUserRole(userId, role.id);
  const roles = await getUserRoles(userId);
  return { userId, roles };
}
