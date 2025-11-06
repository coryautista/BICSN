import { findUsuarioById, findUsuarioByEmail, listUsuarios, createUsuario, updateUsuario, deleteUsuario } from './usuarios.repo.js';
import { hashPassword, verifyPassword } from '../auth/auth.crypto.js';
import { createUserRoleItem } from '../userRole/userRole.service.js';
import crypto from 'crypto';

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
  usuarioId: string | undefined, 
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
    // Generate UUID if not provided
    const finalUsuarioId = usuarioId || crypto.randomUUID();
    console.log('Creating user with ID:', finalUsuarioId, 'roleId:', roleId);

    // Check if usuarioId already exists
    const existingById = await findUsuarioById(finalUsuarioId);
    if (existingById) {
      console.log('User ID already exists:', finalUsuarioId);
      throw new Error('USUARIO_EXISTS');
    }

    // Check if email already exists
    const existingUsuario = await findUsuarioByEmail(email);
    if (existingUsuario) {
      console.log('Email already exists:', email);
      throw new Error('EMAIL_EXISTS');
    }

    // Hash password using argon2 (same as auth.crypto.ts)
    const { hash, algo } = await hashPassword(password);
    console.log('Password hashed successfully');

    const usuario = await createUsuario(
      finalUsuarioId, 
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
    console.log('User created in auth.user:', finalUsuarioId);

    // Create user role
    await createUserRoleItem(finalUsuarioId, roleId, true, userId, tx);
    console.log('User role created:', finalUsuarioId, roleId);

    return usuario;
  } catch (error: any) {
    console.error('Error in createUsuarioItem:', error);
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