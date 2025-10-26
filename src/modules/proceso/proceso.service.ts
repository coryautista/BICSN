import { findProcesoById, listProcesos, createProceso, updateProceso, deleteProceso } from './proceso.repo.js';
import { findModuloById } from '../modulo/modulo.repo.js';

export async function getAllProcesos() {
  return listProcesos();
}

export async function getProcesoById(id: number) {
  const proceso = await findProcesoById(id);
  if (!proceso) throw new Error('PROCESO_NOT_FOUND');
  return proceso;
}

export async function createProcesoItem(nombre: string, componente: string, idModulo: number, orden: number, tipo: string, tx?: any) {
  // Validar que el idModulo existe
  const modulo = await findModuloById(idModulo);
  if (!modulo) throw new Error('MODULO_NOT_FOUND');

  return createProceso(nombre, componente, idModulo, orden, tipo, tx);
}

export async function updateProcesoItem(id: number, nombre?: string, componente?: string, idModulo?: number, orden?: number, tipo?: string, tx?: any) {
  // Verificar que el proceso existe
  const existing = await findProcesoById(id);
  if (!existing) throw new Error('PROCESO_NOT_FOUND');

  // Validar que el idModulo existe si se proporciona
  if (idModulo !== undefined) {
    const modulo = await findModuloById(idModulo);
    if (!modulo) throw new Error('MODULO_NOT_FOUND');
  }

  return updateProceso(id, nombre, componente, idModulo, orden, tipo, tx);
}

export async function deleteProcesoItem(id: number, tx?: any) {
  // Verificar que el proceso existe
  const existing = await findProcesoById(id);
  if (!existing) throw new Error('PROCESO_NOT_FOUND');

  return deleteProceso(id, tx);
}