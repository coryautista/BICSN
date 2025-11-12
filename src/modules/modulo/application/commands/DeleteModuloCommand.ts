import { IModuloRepository } from '../../domain/repositories/IModuloRepository.js';
import {
  ModuloNotFoundError,
  ModuloInUseError,
  ModuloError
} from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'deleteModuloCommand',
  level: process.env.LOG_LEVEL || 'info'
});

export interface DeleteModuloInput {
  id: number;
}

export class DeleteModuloCommand {
  constructor(private moduloRepo: IModuloRepository) {}

  async execute(input: DeleteModuloInput, userId?: string): Promise<boolean> {
    try {
      logger.info({
        operation: 'deleteModulo',
        moduloId: input.id,
        userId,
        timestamp: new Date().toISOString()
      }, 'Iniciando eliminación de módulo');

      // Validar entrada
      this.validateInput(input);

      // Verificar que el módulo existe
      const existing = await this.moduloRepo.findById(input.id);
      if (!existing) {
        throw new ModuloNotFoundError(input.id);
      }

      // Verificar que el módulo no esté siendo usado
      const isInUse = await this.moduloRepo.isInUse(input.id);
      if (isInUse) {
        throw new ModuloInUseError(input.id);
      }

      // Eliminar módulo
      const deleted = await this.moduloRepo.delete(input.id);

      if (deleted) {
        logger.info({
          operation: 'deleteModulo',
          moduloId: input.id,
          nombre: existing.nombre,
          userId,
          timestamp: new Date().toISOString()
        }, 'Módulo eliminado exitosamente');
      } else {
        logger.warn({
          operation: 'deleteModulo',
          moduloId: input.id,
          userId,
          timestamp: new Date().toISOString()
        }, 'No se pudo eliminar el módulo');
      }

      return deleted;
    } catch (error) {
      if (error instanceof ModuloNotFoundError ||
          error instanceof ModuloInUseError) {
        throw error;
      }

      logger.error({
        operation: 'deleteModulo',
        error: (error as Error).message,
        moduloId: input.id,
        userId,
        stack: (error as Error).stack,
        timestamp: new Date().toISOString()
      }, 'Error al eliminar módulo');

      throw new ModuloError('Error interno al eliminar módulo', 'MODULO_DELETE_ERROR', 500);
    }
  }

  private validateInput(input: DeleteModuloInput): void {
    if (!Number.isInteger(input.id) || input.id <= 0) {
      throw new ModuloNotFoundError(input.id);
    }
  }
}
