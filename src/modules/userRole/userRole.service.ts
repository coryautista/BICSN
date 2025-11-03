import { findUserRoleByIds, listUserRoles, listUserRolesByUsuario, createUserRole, updateUserRole, deleteUserRole } from './userRole.repo.js';

export async function getAllUserRoles() {
  return await listUserRoles();
}

export async function getUserRoleByIds(usuarioId: string, roleId: string) {
  const userRole = await findUserRoleByIds(usuarioId, roleId);
  if (!userRole) {
    throw new Error('USER_ROLE_NOT_FOUND');
  }
  return userRole;
}

export async function getUserRolesByUsuario(usuarioId: string) {
  return await listUserRolesByUsuario(usuarioId);
}

export async function createUserRoleItem(usuarioId: string, roleId: string, esActivo: boolean, userId?: string, tx?: any) {
  try {
    // Check if the user-role relationship already exists
    const existingUserRole = await findUserRoleByIds(usuarioId, roleId);
    if (existingUserRole) {
      throw new Error('USER_ROLE_EXISTS');
    }

    return await createUserRole(usuarioId, roleId, esActivo, userId, tx);
  } catch (error: any) {
    if (error.message.includes('Violation of PRIMARY KEY constraint')) {
      throw new Error('USER_ROLE_EXISTS');
    }
    throw error;
  }
}

export async function updateUserRoleItem(usuarioId: string, roleId: string, esActivo?: boolean, userId?: string, tx?: any) {
  const userRole = await updateUserRole(usuarioId, roleId, esActivo, userId, tx);
  if (!userRole) {
    throw new Error('USER_ROLE_NOT_FOUND');
  }
  return userRole;
}

export async function deleteUserRoleItem(usuarioId: string, roleId: string, tx?: any) {
  const deletedIds = await deleteUserRole(usuarioId, roleId, tx);
  if (!deletedIds) {
    throw new Error('USER_ROLE_NOT_FOUND');
  }
  return deletedIds;
}