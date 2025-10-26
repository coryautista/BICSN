import { findDependenciaById, listDependencias, listDependenciasByTipo, listDependenciasHijas, getDependenciaWithHijas as getDependenciaWithHijasRepo, createDependencia, updateDependencia, deleteDependencia } from './dependencia.repo.js';

export async function getAllDependencias() {
  return await listDependencias();
}

export async function getDependenciasByTipo(tipoDependencia: string) {
  return await listDependenciasByTipo(tipoDependencia);
}

export async function getDependenciasHijas(dependenciaPadreId: number) {
  return await listDependenciasHijas(dependenciaPadreId);
}

export async function getDependenciaById(dependenciaId: number) {
  const dependencia = await findDependenciaById(dependenciaId);
  if (!dependencia) {
    throw new Error('DEPENDENCIA_NOT_FOUND');
  }
  return dependencia;
}

export async function getDependenciaWithHijas(dependenciaId: number) {
  const dependencia = await getDependenciaWithHijasRepo(dependenciaId);
  if (!dependencia) {
    throw new Error('DEPENDENCIA_NOT_FOUND');
  }
  return dependencia;
}

export async function createDependenciaItem(
  nombre: string,
  descripcion: string,
  tipoDependencia: string,
  claveDependencia: string,
  idDependenciaPadre?: number,
  responsable?: string,
  telefono?: string,
  email?: string,
  esActiva?: boolean,
  userId?: string,
  tx?: any
) {
  try {
    return await createDependencia(
      nombre,
      descripcion,
      tipoDependencia,
      claveDependencia,
      idDependenciaPadre,
      responsable,
      telefono,
      email,
      esActiva,
      userId,
      tx
    );
  } catch (error: any) {
    if (error.message.includes('FOREIGN KEY constraint')) {
      throw new Error('DEPENDENCIA_PADRE_NOT_FOUND');
    }
    if (error.message.includes('Violation of PRIMARY KEY constraint')) {
      throw new Error('DEPENDENCIA_EXISTS');
    }
    throw error;
  }
}

export async function updateDependenciaItem(
  dependenciaId: number,
  nombre?: string,
  descripcion?: string,
  tipoDependencia?: string,
  claveDependencia?: string,
  idDependenciaPadre?: number,
  responsable?: string,
  telefono?: string,
  email?: string,
  esActiva?: boolean,
  userId?: string,
  tx?: any
) {
  const dependencia = await updateDependencia(
    dependenciaId,
    nombre,
    descripcion,
    tipoDependencia,
    claveDependencia,
    idDependenciaPadre,
    responsable,
    telefono,
    email,
    esActiva,
    userId,
    tx
  );
  if (!dependencia) {
    throw new Error('DEPENDENCIA_NOT_FOUND');
  }
  return dependencia;
}

export async function deleteDependenciaItem(dependenciaId: number, tx?: any) {
  const deletedId = await deleteDependencia(dependenciaId, tx);
  if (!deletedId) {
    throw new Error('DEPENDENCIA_NOT_FOUND');
  }
  return deletedId;
}