import { IUnidadMedidaRepository } from '../../domain/repositories/IUnidadMedidaRepository.js';
import { UnidadMedidaNotFoundError } from '../../domain/errors.js';
import { sql } from '../../../../../db/context.js';
import pino from 'pino';

const logger = pino({
  name: 'deleteUnidadMedidaCommand',
  level: process.env.LOG_LEVEL || 'info'
});

export interface DeleteUnidadMedidaInput {
  unidadMedidaId: number;
}

export class DeleteUnidadMedidaCommand {
  constructor(private unidadMedidaRepo: IUnidadMedidaRepository) {}

  async execute(input: DeleteUnidadMedidaInput, tx?: sql.Transaction): Promise<number> {
    const logContext = {
      operation: 'deleteUnidadMedida',
      unidadMedidaId: input.unidadMedidaId
    };

    logger.info(logContext, 'Iniciando eliminación de unidad de medida');

    // Validación de entrada
    if (!input.unidadMedidaId || typeof input.unidadMedidaId !== 'number' || input.unidadMedidaId <= 0) {
      throw new UnidadMedidaNotFoundError(input.unidadMedidaId);
    }

    // Verificar que la unidad de medida existe
    const existingUnidadMedida = await this.unidadMedidaRepo.findById(input.unidadMedidaId);
    if (!existingUnidadMedida) {
      throw new UnidadMedidaNotFoundError(input.unidadMedidaId);
    }

    try {
      const deletedId = await this.unidadMedidaRepo.delete(input.unidadMedidaId, tx);
      if (!deletedId) {
        throw new UnidadMedidaNotFoundError(input.unidadMedidaId);
      }
      logger.info({ ...logContext, deletedId }, 'Unidad de medida eliminada exitosamente');
      return deletedId;
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      logger.error({
        ...logContext,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      }, 'Error al eliminar unidad de medida');

      if (error instanceof UnidadMedidaNotFoundError) {
        throw error;
      }
      throw error;
    }
  }
}

