import { findModuloById, listModulos, createModulo, updateModulo, deleteModulo } from './modulo.repo.js';

export async function getAllModulos() {
  return listModulos();
}

export async function getModuloById(id: number) {
  const modulo = await findModuloById(id);
  if (!modulo) throw new Error('MODULO_NOT_FOUND');
  return modulo;
}

export async function createModuloItem(nombre: string, tipo: string, icono?: string, orden?: number, tx?: any) {
  return createModulo(nombre, tipo, icono, orden, tx);
}

export async function updateModuloItem(id: number, nombre: string, tipo: string, icono?: string, orden?: number, tx?: any) {
  // Verificar que el módulo existe
  const existing = await findModuloById(id);
  if (!existing) throw new Error('MODULO_NOT_FOUND');

  return updateModulo(id, nombre, tipo, icono, orden, tx);
}

export async function deleteModuloItem(id: number, tx?: any) {
  // Verificar que el módulo existe
  const existing = await findModuloById(id);
  if (!existing) throw new Error('MODULO_NOT_FOUND');

  return deleteModulo(id, tx);
}