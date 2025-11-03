import { obtenerPlantilla, busquedaHistorico } from './afiliadosPersonal.repo.js';
import { ObtenerPlantillaResponse } from './afiliadosPersonal.schemas.js';

export async function getObtenerPlantilla(claveOrganica0: string, claveOrganica1: string): Promise<ObtenerPlantillaResponse[]> {
  return await obtenerPlantilla(claveOrganica0, claveOrganica1);
}

export async function getBusquedaHistorico(searchTerm?: string): Promise<ObtenerPlantillaResponse[]> {
  return await busquedaHistorico(searchTerm);
}