import { IColoniaRepository } from '../../domain/repositories/IColoniaRepository.js';
import { DeleteColoniaData } from '../../domain/entities/Colonia.js';
import {
  ColoniaNotFoundError,
  InvalidColoniaDataError,
  ColoniaCommandError
} from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'deleteColoniaCommand',
  level: process.env.LOG_LEVEL || 'info'
});

export class DeleteColoniaCommand {
  constructor(private coloniaRepo: IColoniaRepository) {}

  async execute(data: DeleteColoniaData): Promise<number> {
    // Validaciones de entrada
    this.validateInput(data);

    const logContext = {
      operation: 'deleteColonia',
      coloniaId: data.coloniaId
    };

    logger.info(logContext, 'Eliminando colonia');

    try {
      const deletedId = await this.coloniaRepo.delete(data.coloniaId);

      if (!deletedId) {
        logger.warn({ ...logContext }, 'Colonia no encontrada para eliminación');
        throw new ColoniaNotFoundError(data.coloniaId);
      }

      logger.info({
        ...logContext,
        deletedId: deletedId
      }, 'Colonia eliminada exitosamente');

      return deletedId;

    } catch (error: any) {
      if (error instanceof ColoniaNotFoundError ||
          error instanceof InvalidColoniaDataError) {
        throw error;
      }

      logger.error({
        ...logContext,
        error: error.message,
        stack: error.stack
      }, 'Error al eliminar colonia');

      throw new ColoniaCommandError('eliminación', {
        originalError: error.message,
        coloniaId: data.coloniaId
      });
    }
  }

  private validateInput(data: DeleteColoniaData): void {
    // Validar coloniaId
    if (!data.coloniaId || typeof data.coloniaId !== 'number' || data.coloniaId <= 0) {
      throw new InvalidColoniaDataError('coloniaId', 'Es requerido y debe ser un número positivo');
    }
  }
}
