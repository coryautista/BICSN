import { findInfoById, listInfos, createInfo, updateInfo, deleteInfo } from './info.repo.js';
import { logAppEvent } from '../../db/context.js';
import { FastifyRequest } from 'fastify';

export async function getAllInfos() {
  return listInfos();
}

export async function getInfoById(id: number) {
  const info = await findInfoById(id);
  if (!info) throw new Error('INFO_NOT_FOUND');
  return info;
}

export async function createInfoItem(req: FastifyRequest, nombre: string, createdAt: string, updatedAt: string, icono?: string, color?: string, colorBotones?: string, colorEncabezados?: string, colorLetra?: string, createdBy?: string, updatedBy?: string) {
  const result = await createInfo(nombre, createdAt, updatedAt, icono, color, colorBotones, colorEncabezados, colorLetra, createdBy, updatedBy);
  await logAppEvent(req, 'Info', result.id.toString(), 'INSERT', null, result);
  return result;
}

export async function updateInfoItem(req: FastifyRequest, id: number, updatedAt: string, nombre?: string, icono?: string, color?: string, colorBotones?: string, colorEncabezados?: string, colorLetra?: string, updatedBy?: string) {
  // Verificar que existe
  const existing = await findInfoById(id);
  if (!existing) throw new Error('INFO_NOT_FOUND');

  const result = await updateInfo(id, updatedAt, nombre, icono, color, colorBotones, colorEncabezados, colorLetra, updatedBy);
  await logAppEvent(req, 'Info', id.toString(), 'UPDATE', existing, result);
  return result;
}

export async function deleteInfoItem(req: FastifyRequest, id: number) {
  // Verificar que existe
  const existing = await findInfoById(id);
  if (!existing) throw new Error('INFO_NOT_FOUND');

  const result = await deleteInfo(id);
  await logAppEvent(req, 'Info', id.toString(), 'DELETE', existing, null);
  return result;
}