import { findIndicadorById, listIndicadores, listIndicadoresByPrograma, listIndicadoresByLineaEstrategica, listIndicadoresByEje, createIndicador, updateIndicador, deleteIndicador } from './indicador.repo.js';

export async function getAllIndicadores() {
  return await listIndicadores();
}

export async function getIndicadoresByPrograma(programaId: number) {
  return await listIndicadoresByPrograma(programaId);
}

export async function getIndicadoresByLineaEstrategica(lineaEstrategicaId: number) {
  return await listIndicadoresByLineaEstrategica(lineaEstrategicaId);
}

export async function getIndicadoresByEje(ejeId: number) {
  return await listIndicadoresByEje(ejeId);
}

export async function getIndicadorById(indicadorId: number) {
  const indicador = await findIndicadorById(indicadorId);
  if (!indicador) {
    throw new Error('INDICADOR_NOT_FOUND');
  }
  return indicador;
}

export async function createIndicadorItem(
  idPrograma: number,
  nombre: string,
  descripcion: string,
  tipoIndicador: string,
  frecuenciaMedicion: string,
  meta?: number,
  sentido?: string,
  formula?: string,
  idUnidadMedida?: number,
  idDimension?: number,
  fuenteDatos?: string,
  responsable?: string,
  observaciones?: string,
  userId?: string,
  tx?: any
) {
  try {
    return await createIndicador(
      idPrograma,
      nombre,
      descripcion,
      tipoIndicador,
      frecuenciaMedicion,
      meta,
      sentido,
      formula,
      idUnidadMedida,
      idDimension,
      fuenteDatos,
      responsable,
      observaciones,
      userId,
      tx
    );
  } catch (error: any) {
    if (error.message.includes('FOREIGN KEY constraint')) {
      throw new Error('PROGRAMA_NOT_FOUND');
    }
    if (error.message.includes('Violation of PRIMARY KEY constraint')) {
      throw new Error('INDICADOR_EXISTS');
    }
    throw error;
  }
}

export async function updateIndicadorItem(
  indicadorId: number,
  nombre?: string,
  descripcion?: string,
  tipoIndicador?: string,
  frecuenciaMedicion?: string,
  meta?: number,
  sentido?: string,
  formula?: string,
  idUnidadMedida?: number,
  idDimension?: number,
  fuenteDatos?: string,
  responsable?: string,
  observaciones?: string,
  userId?: string,
  tx?: any
) {
  const indicador = await updateIndicador(
    indicadorId,
    nombre,
    descripcion,
    tipoIndicador,
    frecuenciaMedicion,
    meta,
    sentido,
    formula,
    idUnidadMedida,
    idDimension,
    fuenteDatos,
    responsable,
    observaciones,
    userId,
    tx
  );
  if (!indicador) {
    throw new Error('INDICADOR_NOT_FOUND');
  }
  return indicador;
}

export async function deleteIndicadorItem(indicadorId: number, tx?: any) {
  const deletedId = await deleteIndicador(indicadorId, tx);
  if (!deletedId) {
    throw new Error('INDICADOR_NOT_FOUND');
  }
  return deletedId;
}