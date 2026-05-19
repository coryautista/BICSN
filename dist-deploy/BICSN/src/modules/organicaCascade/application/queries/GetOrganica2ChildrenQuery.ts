import { IOrganicaCascadeRepository } from '../../domain/repositories/IOrganicaCascadeRepository.js';
import { OrganicaChild } from '../../domain/entities/OrganicaChild.js';
import { OrganicaCascadeInvalidClaveOrganica0Error, OrganicaCascadeInvalidClaveOrganica1Error } from '../../domain/errors.js';

export class GetOrganica2ChildrenQuery {
  constructor(private organicaCascadeRepo: IOrganicaCascadeRepository) {}

  async execute(claveOrganica0: string, claveOrganica1: string, userId?: string): Promise<OrganicaChild[]> {
    // Logging de la operación
    console.log(`[ORGANICA_CASCADE] Consultando hijos de organica2 para claves ${claveOrganica0}-${claveOrganica1}, usuario: ${userId || 'desconocido'}`);

    // Validación de claveOrganica0
    if (!claveOrganica0 || typeof claveOrganica0 !== 'string') {
      throw new OrganicaCascadeInvalidClaveOrganica0Error(claveOrganica0);
    }

    // Validación de claveOrganica1
    if (!claveOrganica1 || typeof claveOrganica1 !== 'string') {
      throw new OrganicaCascadeInvalidClaveOrganica1Error(claveOrganica1);
    }

    // Validar formato: 1-2 caracteres alfanuméricos para ambas claves
    const claveRegex = /^[A-Za-z0-9]{1,2}$/;
    if (!claveRegex.test(claveOrganica0)) {
      throw new OrganicaCascadeInvalidClaveOrganica0Error(claveOrganica0);
    }
    if (!claveRegex.test(claveOrganica1)) {
      throw new OrganicaCascadeInvalidClaveOrganica1Error(claveOrganica1);
    }

    try {
      const result = await this.organicaCascadeRepo.findOrganica2ByOrganica1(claveOrganica0, claveOrganica1);

      // Verificar si se encontraron resultados
      if (!result || result.length === 0) {
        console.warn(`[ORGANICA_CASCADE] No se encontraron hijos de organica2 para claves ${claveOrganica0}-${claveOrganica1}`);
        // No lanzamos error aquí porque puede ser válido que no haya hijos
      } else {
        console.log(`[ORGANICA_CASCADE] Se encontraron ${result.length} hijos de organica2 para claves ${claveOrganica0}-${claveOrganica1}`);
      }

      return result;
    } catch (error: any) {
      // Para otros errores, logueamos y relanzamos
      console.error(`[ORGANICA_CASCADE] Error al consultar hijos de organica2 para claves ${claveOrganica0}-${claveOrganica1}:`, error);
      throw error;
    }
  }
}
