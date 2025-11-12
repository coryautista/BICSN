import { IEstadoRepository } from '../../domain/repositories/IEstadoRepository.js';
import { DeleteEstadoData } from '../../domain/entities/Estado.js';
import {
  EstadoNotFoundError,
  InvalidEstadoDataError,
  EstadoCommandError
} from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'deleteEstadoCommand',
  level: process.env.LOG_LEVEL || 'info'
});

export class DeleteEstadoCommand {
  constructor(private estadoRepo: IEstadoRepository) {}

  async execute(data: DeleteEstadoData): Promise<string> {
    // Validaciones de entrada
    this.validateInput(data);

    const logContext = {
      operation: 'deleteEstado',
      estadoId: data.estadoId
    };

    logger.info(logContext, 'Eliminando estado');

    try {
      const deletedId = await this.estadoRepo.delete(data.estadoId);

      if (!deletedId) {
        logger.warn({ ...logContext }, 'Estado no encontrado para eliminación');
        throw new EstadoNotFoundError(data.estadoId);
      }

      logger.info({
        ...logContext,
        deletedId: deletedId
      }, 'Estado eliminado exitosamente');

      return deletedId;

    } catch (error: any) {
      if (error instanceof EstadoNotFoundError ||
          error instanceof InvalidEstadoDataError) {
        throw error;
      }

      logger.error({
        ...logContext,
        error: error.message,
        stack: error.stack
      }, 'Error al eliminar estado');

      throw new EstadoCommandError('eliminación', {
        originalError: error.message,
        estadoId: data.estadoId
      });
    }
  }

  private validateInput(data: DeleteEstadoData): void {
    // Validar estadoId
    if (!data.estadoId || typeof data.estadoId !== 'string' || data.estadoId.trim().length === 0) {
      throw new InvalidEstadoDataError('estadoId', 'Es requerido y debe ser una cadena no vacía');
    }
  }
}
