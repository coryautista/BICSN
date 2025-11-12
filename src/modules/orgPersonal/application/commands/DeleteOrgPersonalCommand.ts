import { IOrgPersonalRepository } from '../../domain/repositories/IOrgPersonalRepository.js';
import { OrgPersonalInvalidInternoError, OrgPersonalNotFoundError, OrgPersonalInUseError } from '../../domain/errors.js';

export class DeleteOrgPersonalCommand {
  constructor(private orgPersonalRepo: IOrgPersonalRepository) {}

  async execute(interno: number, userId?: string): Promise<{ interno: number; deleted: boolean }> {
    // Logging de la operación
    console.log(`[ORG_PERSONAL] Eliminando registro orgPersonal interno: ${interno}, usuario: ${userId || 'desconocido'}`);

    // Validación del interno
    if (!interno || typeof interno !== 'number' || interno <= 0 || !Number.isInteger(interno)) {
      throw new OrgPersonalInvalidInternoError(interno);
    }

    try {
      // Verificar que el registro existe
      const existing = await this.orgPersonalRepo.findById(interno);
      if (!existing) {
        throw new OrgPersonalNotFoundError(interno);
      }

      // Aquí podríamos agregar validaciones de uso si fuera necesario
      // Por ejemplo, verificar si el registro está referenciado en otras tablas

      await this.orgPersonalRepo.delete(interno);
      console.log(`[ORG_PERSONAL] Registro orgPersonal eliminado exitosamente: interno ${interno}`);
      return { interno, deleted: true };
    } catch (error: any) {
      // Si ya es un error de dominio, lo propagamos
      if (error instanceof OrgPersonalNotFoundError ||
          error instanceof OrgPersonalInvalidInternoError ||
          error instanceof OrgPersonalInUseError) {
        throw error;
      }

      console.error(`[ORG_PERSONAL] Error al eliminar registro orgPersonal interno ${interno}:`, error);
      throw error;
    }
  }
}
