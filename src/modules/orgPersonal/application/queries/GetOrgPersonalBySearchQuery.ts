import { IOrgPersonalRepository } from '../../domain/repositories/IOrgPersonalRepository.js';
import { OrgPersonal } from '../../domain/entities/OrgPersonal.js';
import { OrgPersonalNotFoundError } from '../../domain/errors.js';

export class GetOrgPersonalBySearchQuery {
  constructor(private orgPersonalRepo: IOrgPersonalRepository) {}

  async execute(searchTerm: string, userId?: string): Promise<OrgPersonal> {
    // Logging de la operación
    console.log(`[ORG_PERSONAL] Buscando registro orgPersonal por término: '${searchTerm}', usuario: ${userId || 'desconocido'}`);

    // Validación del término de búsqueda
    if (!searchTerm || typeof searchTerm !== 'string' || searchTerm.trim().length === 0) {
      console.warn(`[ORG_PERSONAL] Término de búsqueda inválido: '${searchTerm}'`);
      throw new OrgPersonalNotFoundError(-1); // Usamos -1 como ID genérico para este caso
    }

    const trimmedSearchTerm = searchTerm.trim();

    try {
      const orgPersonal = await this.orgPersonalRepo.findBySearch(trimmedSearchTerm);
      if (!orgPersonal) {
        console.warn(`[ORG_PERSONAL] No se encontró registro orgPersonal para el término: '${trimmedSearchTerm}'`);
        throw new OrgPersonalNotFoundError(-1); // Usamos -1 como ID genérico
      }

      console.log(`[ORG_PERSONAL] Registro orgPersonal encontrado por búsqueda: interno ${orgPersonal.interno}`);
      return orgPersonal;
    } catch (error: any) {
      // Si ya es un error de dominio, lo propagamos
      if (error instanceof OrgPersonalNotFoundError) {
        throw error;
      }

      console.error(`[ORG_PERSONAL] Error al buscar registro orgPersonal por término '${trimmedSearchTerm}':`, error);
      throw error;
    }
  }
}
