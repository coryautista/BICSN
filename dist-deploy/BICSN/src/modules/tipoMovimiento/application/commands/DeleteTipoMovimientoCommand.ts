import { ITipoMovimientoRepository } from '../../domain/repositories/ITipoMovimientoRepository.js';
import {
  TipoMovimientoNotFoundError,
  TipoMovimientoInvalidIdError
} from '../../domain/errors.js';

export interface DeleteTipoMovimientoInput {
  id: number;
}

export class DeleteTipoMovimientoCommand {
  constructor(private tipoMovimientoRepo: ITipoMovimientoRepository) {}

  async execute(input: DeleteTipoMovimientoInput, userId?: string): Promise<{ id: number }> {
    const timestamp = new Date().toISOString();

    console.log(`[${timestamp}] Iniciando eliminación de tipo de movimiento`, {
      id: input.id,
      userId: userId || 'anonymous'
    });

    // 1. Validar ID
    this.validateId(input.id);

    try {
      // 2. Verificar que el tipo de movimiento existe
      const existing = await this.tipoMovimientoRepo.findById(input.id);
      if (!existing) {
        throw new TipoMovimientoNotFoundError(input.id.toString());
      }

      // 3. Verificar que no esté en uso
      await this.checkTipoMovimientoInUse(input.id, userId);

      // 4. Eliminar tipo de movimiento
      await this.tipoMovimientoRepo.delete(input.id);

      console.log(`[${timestamp}] Tipo de movimiento eliminado exitosamente`, {
        id: input.id,
        nombre: existing.nombre,
        userId: userId || 'anonymous'
      });

      return { id: input.id };

    } catch (error: any) {
      console.error(`[${timestamp}] Error eliminando tipo de movimiento`, {
        id: input.id,
        error: error.message,
        userId: userId || 'anonymous'
      });
      throw error;
    }
  }

  private validateId(id: number): void {
    if (!Number.isInteger(id) || id <= 0) {
      throw new TipoMovimientoInvalidIdError(id.toString());
    }
  }

  private async checkTipoMovimientoInUse(id: number, userId?: string): Promise<void> {
    // Aquí podríamos verificar si el tipo de movimiento está siendo usado en:
    // - Movimientos existentes
    // - Configuraciones del sistema
    // - Etc.

    console.log(`[${new Date().toISOString()}] Verificando si tipo de movimiento está en uso`, {
      id: id,
      userId: userId || 'anonymous'
    });

    // TODO: Agregar verificaciones adicionales según reglas de negocio
    // Por ejemplo:
    // - Verificar si hay movimientos que usan este tipo
    // - Verificar si está referenciado en configuraciones
  }
}
