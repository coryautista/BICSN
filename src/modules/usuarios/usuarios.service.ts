import { findUsuarioById, findUsuarioByEmail, findUsuarioByUsername, listUsuarios, createUsuario, updateUsuario, deleteUsuario } from './usuarios.repo.js';
import { hashPassword, verifyPassword } from '../auth/auth.crypto.js';
import { createUserRoleItem } from '../userRole/userRole.service.js';

export async function getAllUsuarios() {
  return await listUsuarios();
}

export async function getUsuarioById(usuarioId: string) {
  const usuario = await findUsuarioById(usuarioId);
  if (!usuario) {
    throw new Error('USUARIO_NOT_FOUND');
  }
  return usuario;
}

export async function createUsuarioItem(
  usuarioId: string, 
  nombre: string, 
  email: string, 
  password: string, 
  roleId: string, 
  esActivo: boolean,
  phoneNumber: string,
  idOrganica0: string,
  idOrganica1: string,
  idOrganica2?: string,
  idOrganica3?: string,
  userId?: string, 
  tx?: any
) {
  try {
    // Check if username (nombre) already exists
    const existingByUsername = await findUsuarioByUsername(nombre);
    if (existingByUsername) {
      throw new Error('USERNAME_EXISTS');
    }

    // Check if email already exists
    const existingUsuario = await findUsuarioByEmail(email);
    if (existingUsuario) {
      throw new Error('EMAIL_EXISTS');
    }

    // Hash password using argon2 (same as auth.crypto.ts)
    const { hash, algo } = await hashPassword(password);

    const usuario = await createUsuario(
      usuarioId, 
      nombre, 
      email, 
      hash, 
      algo, 
      roleId, 
      esActivo,
      phoneNumber,
      idOrganica0,
      idOrganica1,
      idOrganica2,
      idOrganica3,
      userId, 
      tx
    );

    // Create user role
    await createUserRoleItem(usuarioId, roleId, true, userId, tx);

    return usuario;
  } catch (error: any) {
    if (error.message.includes('Violation of PRIMARY KEY constraint')) {
      throw new Error('USUARIO_EXISTS');
    }
    throw error;
  }
}

export async function updateUsuarioItem(usuarioId: string, nombre?: string, email?: string, roleId?: string, esActivo?: boolean, userId?: string, tx?: any) {
  // If email is being updated, check if it already exists
  if (email) {
    const existingUsuario = await findUsuarioByEmail(email);
    if (existingUsuario && existingUsuario.usuarioId !== usuarioId) {
      throw new Error('EMAIL_EXISTS');
    }
  }

  const usuario = await updateUsuario(usuarioId, nombre, email, roleId, esActivo, userId, tx);
  if (!usuario) {
    throw new Error('USUARIO_NOT_FOUND');
  }
  return usuario;
}

export async function deleteUsuarioItem(usuarioId: string, tx?: any) {
  const deletedId = await deleteUsuario(usuarioId, tx);
  if (!deletedId) {
    throw new Error('USUARIO_NOT_FOUND');
  }
  return deletedId;
}

export async function authenticateUsuario(email: string, password: string) {
  const usuario = await findUsuarioByEmail(email);
  if (!usuario || usuario.isLockedOut) {
    throw new Error('INVALID_CREDENTIALS');
  }

  const isValidPassword = await verifyPassword(usuario.passwordHash, password, usuario.passwordAlgo);
  if (!isValidPassword) {
    throw new Error('INVALID_CREDENTIALS');
  }

  // Return user without password hash
  const { passwordHash, passwordAlgo, ...userWithoutPassword } = usuario;
  return userWithoutPassword;
}