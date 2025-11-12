import { IProcesoRepository } from '../../domain/repositories/IProcesoRepository.js';
import {
  ProcesoNotFoundError,
  ProcesoInvalidIdError
} from '../../domain/errors.js';

export interface DeleteProcesoInput {
  id: number;
}

export class DeleteProcesoCommand {
  constructor(private procesoRepo: IProcesoRepository) {}

  async execute(input: DeleteProcesoInput, userId: string, tx?: any): Promise<boolean> {
    const timestamp = new Date().toISOString();

    console.log(`[${timestamp}] [Usuario: ${userId}] Iniciando eliminación de proceso`, {
      procesoId: input.id
    });

    try {
      // Validar ID del proceso
      if (!input.id || typeof input.id !== 'number' || input.id <= 0 || !Number.isInteger(input.id)) {
        throw new ProcesoInvalidIdError(input.id);
      }

      // Verificar que el proceso existe
      const existing = await this.procesoRepo.findById(input.id);
      if (!existing) {
        throw new ProcesoNotFoundError(input.id);
      }

      // Aquí podríamos agregar validaciones de negocio adicionales
      // Por ejemplo, verificar si el proceso está siendo usado por otros módulos
      // o si tiene dependencias que impedirían su eliminación

      // Verificar si el proceso está en uso (ejemplo: si tiene movimientos asociados)
      // Esta validación dependería de las reglas de negocio específicas
      // const isInUse = await this.checkIfProcesoIsInUse(input.id);
      // if (isInUse) {
      //   throw new ProcesoInUseError(input.id, 'El proceso tiene movimientos asociados');
      // }

      const deleted = await this.procesoRepo.delete(input.id, tx);
      if (!deleted) {
        throw new Error('Error interno al eliminar proceso');
      }

      console.log(`[${timestamp}] [Usuario: ${userId}] Proceso eliminado exitosamente`, {
        procesoId: input.id,
        nombre: existing.nombre
      });

      return deleted;

    } catch (error) {
      console.error(`[${timestamp}] [Usuario: ${userId}] Error en eliminación de proceso`, {
        procesoId: input.id,
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
      throw error;
    }
  }

  // Método auxiliar para verificar si el proceso está en uso
  // Este método podría implementarse según las reglas de negocio específicas
  // private async checkIfProcesoIsInUse(procesoId: number): Promise<boolean> {
  //   // Implementar lógica para verificar dependencias
  //   // Por ejemplo: verificar movimientos, workflows, etc. que usen este proceso
  //   return false;
  // }
}
