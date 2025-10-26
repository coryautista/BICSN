import { findEventoCalendarioById, listEventoCalendarios, findEventoCalendariosByAnio, createEventoCalendario, updateEventoCalendario, deleteEventoCalendario } from './eventoCalendario.repo.js';

export async function getAllEventoCalendarios() {
  return listEventoCalendarios();
}

export async function getEventoCalendariosByAnio(anio: number) {
  return findEventoCalendariosByAnio(anio);
}

export async function getEventoCalendarioById(id: number) {
  const evento = await findEventoCalendarioById(id);
  if (!evento) throw new Error('EVENTO_CALENDARIO_NOT_FOUND');
  return evento;
}

export async function createEventoCalendarioItem(fecha: string, tipo: string, anio: number, createdAt: string, tx?: any) {
  return createEventoCalendario(fecha, tipo, anio, createdAt, tx);
}

export async function updateEventoCalendarioItem(id: number, fecha?: string, tipo?: string, anio?: number, createdAt?: string, tx?: any) {
  // Verificar que el evento existe
  const existing = await findEventoCalendarioById(id);
  if (!existing) throw new Error('EVENTO_CALENDARIO_NOT_FOUND');

  return updateEventoCalendario(id, fecha, tipo, anio, createdAt, tx);
}

export async function deleteEventoCalendarioItem(id: number, tx?: any) {
  // Verificar que el evento existe
  const existing = await findEventoCalendarioById(id);
  if (!existing) throw new Error('EVENTO_CALENDARIO_NOT_FOUND');

  return deleteEventoCalendario(id, tx);
}