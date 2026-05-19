import { IPersonalRepository } from '../../domain/repositories/IPersonalRepository.js';
import {
  PersonalNotFoundError,
  PersonalInvalidInternoError
} from '../../domain/errors.js';

export class DeletePersonalCommand {
  constructor(private personalRepo: IPersonalRepository) {}

  async execute(interno: number, userId: string): Promise<{ interno: number; deleted: boolean }> {
    const timestamp = new Date().toISOString();

    console.log(`[${timestamp}] [Usuario: ${userId}] Iniciando eliminación de registro personal`, {
      interno
    });

    try {
      // Validar interno
      if (!interno || typeof interno !== 'number' || interno <= 0 || !Number.isInteger(interno)) {
        throw new PersonalInvalidInternoError(interno);
      }

      // Verificar que el registro exista
      const existing = await this.personalRepo.findById(interno);
      if (!existing) {
        throw new PersonalNotFoundError(interno);
      }

      // TODO: Aquí se podrían agregar validaciones de negocio adicionales
      // Por ejemplo, verificar si el registro está siendo usado en otras tablas

      // Eliminar el registro personal
      await this.personalRepo.delete(interno);

      console.log(`[${timestamp}] [Usuario: ${userId}] Registro personal eliminado exitosamente`, {
        interno
      });

      return { interno, deleted: true };

    } catch (error) {
      console.error(`[${timestamp}] [Usuario: ${userId}] Error en eliminación de registro personal`, {
        interno,
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
      throw error;
    }
  }
}
