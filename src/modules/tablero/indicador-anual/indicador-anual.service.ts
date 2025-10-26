import { findIndicadorAnualById, listIndicadoresAnualesByIndicador, listIndicadoresAnualesByAnio, createIndicadorAnual, updateIndicadorAnual, deleteIndicadorAnual } from './indicador-anual.repo.js';

export async function getIndicadoresAnualesByIndicador(indicadorId: number) {
  return await listIndicadoresAnualesByIndicador(indicadorId);
}

export async function getIndicadoresAnualesByAnio(anio: number) {
  return await listIndicadoresAnualesByAnio(anio);
}

export async function getIndicadorAnualById(indicadorAnualId: number) {
  const indicadorAnual = await findIndicadorAnualById(indicadorAnualId);
  if (!indicadorAnual) {
    throw new Error('INDICADOR_ANUAL_NOT_FOUND');
  }
  return indicadorAnual;
}

export async function createIndicadorAnualItem(
  idIndicador: number,
  anio: number,
  enero?: number,
  febrero?: number,
  marzo?: number,
  abril?: number,
  mayo?: number,
  junio?: number,
  julio?: number,
  agosto?: number,
  septiembre?: number,
  octubre?: number,
  noviembre?: number,
  diciembre?: number,
  metaAnual?: number,
  observaciones?: string,
  userId?: string,
  tx?: any
) {
  try {
    return await createIndicadorAnual(
      idIndicador,
      anio,
      enero,
      febrero,
      marzo,
      abril,
      mayo,
      junio,
      julio,
      agosto,
      septiembre,
      octubre,
      noviembre,
      diciembre,
      metaAnual,
      observaciones,
      userId,
      tx
    );
  } catch (error: any) {
    if (error.message.includes('FOREIGN KEY constraint')) {
      throw new Error('INDICADOR_NOT_FOUND');
    }
    if (error.message.includes('Violation of PRIMARY KEY constraint')) {
      throw new Error('INDICADOR_ANUAL_EXISTS');
    }
    throw error;
  }
}

export async function updateIndicadorAnualItem(
  indicadorAnualId: number,
  enero?: number,
  febrero?: number,
  marzo?: number,
  abril?: number,
  mayo?: number,
  junio?: number,
  julio?: number,
  agosto?: number,
  septiembre?: number,
  octubre?: number,
  noviembre?: number,
  diciembre?: number,
  metaAnual?: number,
  observaciones?: string,
  userId?: string,
  tx?: any
) {
  const indicadorAnual = await updateIndicadorAnual(
    indicadorAnualId,
    enero,
    febrero,
    marzo,
    abril,
    mayo,
    junio,
    julio,
    agosto,
    septiembre,
    octubre,
    noviembre,
    diciembre,
    metaAnual,
    observaciones,
    userId,
    tx
  );
  if (!indicadorAnual) {
    throw new Error('INDICADOR_ANUAL_NOT_FOUND');
  }
  return indicadorAnual;
}

export async function deleteIndicadorAnualItem(indicadorAnualId: number, tx?: any) {
  const deletedId = await deleteIndicadorAnual(indicadorAnualId, tx);
  if (!deletedId) {
    throw new Error('INDICADOR_ANUAL_NOT_FOUND');
  }
  return deletedId;
}