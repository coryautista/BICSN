import { IOrgPersonalRepository } from '../../domain/repositories/IOrgPersonalRepository.js';
import { OrgPersonal } from '../../domain/entities/OrgPersonal.js';
import { OrgPersonalInvalidInternoError, OrgPersonalNotFoundError } from '../../domain/errors.js';

export class GetOrgPersonalByIdQuery {
  constructor(private orgPersonalRepo: IOrgPersonalRepository) {}

  async execute(interno: number, userId?: string): Promise<OrgPersonal> {
    // Logging de la operación
    console.log(`[ORG_PERSONAL] Consultando registro orgPersonal por interno: ${interno}, usuario: ${userId || 'desconocido'}`);

    // Validación del interno
    if (!interno || typeof interno !== 'number' || interno <= 0 || !Number.isInteger(interno)) {
      throw new OrgPersonalInvalidInternoError(interno);
    }

    try {
      const orgPersonal = await this.orgPersonalRepo.findById(interno);
      if (!orgPersonal) {
        console.warn(`[ORG_PERSONAL] Registro orgPersonal con interno ${interno} no encontrado`);
        throw new OrgPersonalNotFoundError(interno);
      }

      console.log(`[ORG_PERSONAL] Registro orgPersonal encontrado: interno ${interno}`);
      return orgPersonal;
    } catch (error: any) {
      // Si ya es un error de dominio, lo propagamos
      if (error instanceof OrgPersonalNotFoundError || error instanceof OrgPersonalInvalidInternoError) {
        throw error;
      }

      console.error(`[ORG_PERSONAL] Error al consultar registro orgPersonal por interno ${interno}:`, error);
      throw error;
    }
  }
}
