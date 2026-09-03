import { IOrgPersonalRepository } from '../../domain/repositories/IOrgPersonalRepository.js';
import { OrgPersonal } from '../../domain/entities/OrgPersonal.js';

export class GetAllOrgPersonalQuery {
  constructor(private orgPersonalRepo: IOrgPersonalRepository) {}

  async execute(scope: { org0: string; org1: string }, userId?: string): Promise<OrgPersonal[]> {
    // Logging de la operación
    console.log(`[ORG_PERSONAL] Consultando todos los registros orgPersonal, usuario: ${userId || 'desconocido'}`);

    try {
      const result = await this.orgPersonalRepo.findAll(scope);

      console.log(`[ORG_PERSONAL] Se encontraron ${result.length} registros orgPersonal`);
      return result;
    } catch (error: any) {
      console.error('[ORG_PERSONAL] Error al consultar todos los registros orgPersonal:', error);
      throw error;
    }
  }
}
