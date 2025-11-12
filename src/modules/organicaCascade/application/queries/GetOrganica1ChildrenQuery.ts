import { IOrganicaCascadeRepository } from '../../domain/repositories/IOrganicaCascadeRepository.js';
import { OrganicaChild } from '../../domain/entities/OrganicaChild.js';
import { OrganicaCascadeInvalidClaveOrganica0Error } from '../../domain/errors.js';

export class GetOrganica1ChildrenQuery {
  constructor(private organicaCascadeRepo: IOrganicaCascadeRepository) {}

  async execute(claveOrganica0: string, userId?: string): Promise<OrganicaChild[]> {
    // Logging de la operación
    console.log(`[ORGANICA_CASCADE] Consultando hijos de organica1 para claveOrganica0: ${claveOrganica0}, usuario: ${userId || 'desconocido'}`);

    // Validación de claveOrganica0
    if (!claveOrganica0 || typeof claveOrganica0 !== 'string') {
      throw new OrganicaCascadeInvalidClaveOrganica0Error(claveOrganica0);
    }

    // Validar formato: 1-2 caracteres alfanuméricos
    const claveRegex = /^[A-Za-z0-9]{1,2}$/;
    if (!claveRegex.test(claveOrganica0)) {
      throw new OrganicaCascadeInvalidClaveOrganica0Error(claveOrganica0);
    }

    try {
      const result = await this.organicaCascadeRepo.findOrganica1ByOrganica0(claveOrganica0);

      // Verificar si se encontraron resultados
      if (!result || result.length === 0) {
        console.warn(`[ORGANICA_CASCADE] No se encontraron hijos de organica1 para claveOrganica0: ${claveOrganica0}`);
        // No lanzamos error aquí porque puede ser válido que no haya hijos
      } else {
        console.log(`[ORGANICA_CASCADE] Se encontraron ${result.length} hijos de organica1 para claveOrganica0: ${claveOrganica0}`);
      }

      return result;
    } catch (error: any) {
      // Para otros errores, logueamos y relanzamos
      console.error(`[ORGANICA_CASCADE] Error al consultar hijos de organica1 para claveOrganica0 ${claveOrganica0}:`, error);
      throw error;
    }
  }
}
