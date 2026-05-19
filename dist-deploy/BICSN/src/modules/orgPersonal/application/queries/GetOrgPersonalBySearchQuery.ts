import { IOrgPersonalRepository } from '../../domain/repositories/IOrgPersonalRepository.js';
import { OrgPersonal } from '../../domain/entities/OrgPersonal.js';
import { OrgPersonalSearchNotFoundError } from '../../domain/errors.js';

export class GetOrgPersonalBySearchQuery {
  constructor(private orgPersonalRepo: IOrgPersonalRepository) {}

  async execute(searchTerm: string, userId?: string): Promise<OrgPersonal> {
    // Logging de la operación
    console.log(`[ORG_PERSONAL] Buscando registro orgPersonal por término: '${searchTerm}', usuario: ${userId || 'desconocido'}`);

    // Validación del término de búsqueda
    if (!searchTerm || typeof searchTerm !== 'string' || searchTerm.trim().length === 0) {
      console.warn(`[ORG_PERSONAL] Término de búsqueda inválido: '${searchTerm}'`);
      throw new OrgPersonalSearchNotFoundError(searchTerm || 'vacío', 'NOMBRE');
    }

    const trimmedSearchTerm = searchTerm.trim();

    try {
      const orgPersonal = await this.orgPersonalRepo.findBySearch(trimmedSearchTerm);
      if (!orgPersonal) {
        console.warn(`[ORG_PERSONAL] No se encontró registro orgPersonal para el término: '${trimmedSearchTerm}'`);
        // Detectar el tipo de búsqueda basado en el formato del término
        const searchType = this.detectSearchType(trimmedSearchTerm);
        throw new OrgPersonalSearchNotFoundError(trimmedSearchTerm, searchType);
      }

      console.log(`[ORG_PERSONAL] Registro orgPersonal encontrado por búsqueda: interno ${orgPersonal.interno}`);
      return orgPersonal;
    } catch (error: any) {
      // Si ya es un error de dominio, lo propagamos
      if (error instanceof OrgPersonalSearchNotFoundError) {
        throw error;
      }

      console.error(`[ORG_PERSONAL] Error al buscar registro orgPersonal por término '${trimmedSearchTerm}':`, error);
      throw error;
    }
  }

  /**
   * Detecta el tipo de búsqueda basado en el formato del término
   */
  private detectSearchType(searchTerm: string): 'CURP' | 'RFC' | 'NOMBRE' {
    // CURP: 18 caracteres, formato estándar mexicano
    if (searchTerm.length === 18 && /^[A-Z]{4}[0-9]{6}[HM][A-Z]{5}[0-9A-Z][0-9]$/.test(searchTerm)) {
      return 'CURP';
    }
    
    // RFC: 13 caracteres (persona física) o 12 caracteres (persona moral)
    if ((searchTerm.length === 13 || searchTerm.length === 12) && /^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$/.test(searchTerm)) {
      return 'RFC';
    }
    
    // Por defecto, asumimos que es un nombre
    return 'NOMBRE';
  }
}
