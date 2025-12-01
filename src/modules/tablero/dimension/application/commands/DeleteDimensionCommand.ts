import { IDimensionRepository } from '../../domain/repositories/IDimensionRepository.js';
import { DimensionNotFoundError } from '../../domain/errors.js';
import { sql } from '../../../../../db/context.js';
import pino from 'pino';

const logger = pino({
  name: 'deleteDimensionCommand',
  level: process.env.LOG_LEVEL || 'info'
});

export interface DeleteDimensionInput {
  dimensionId: number;
}

export class DeleteDimensionCommand {
  constructor(private dimensionRepo: IDimensionRepository) {}

  async execute(input: DeleteDimensionInput, tx?: sql.Transaction): Promise<number> {
    const logContext = {
      operation: 'deleteDimension',
      dimensionId: input.dimensionId
    };

    logger.info(logContext, 'Iniciando eliminación de dimensión');

    // Validación de entrada
    if (!input.dimensionId || typeof input.dimensionId !== 'number' || input.dimensionId <= 0) {
      throw new DimensionNotFoundError(input.dimensionId);
    }

    // Verificar que la dimensión existe
    const existingDimension = await this.dimensionRepo.findById(input.dimensionId);
    if (!existingDimension) {
      throw new DimensionNotFoundError(input.dimensionId);
    }

    try {
      const deletedId = await this.dimensionRepo.delete(input.dimensionId, tx);
      if (!deletedId) {
        throw new DimensionNotFoundError(input.dimensionId);
      }
      logger.info({ ...logContext, deletedId }, 'Dimensión eliminada exitosamente');
      return deletedId;
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      logger.error({
        ...logContext,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      }, 'Error al eliminar dimensión');

      if (error instanceof DimensionNotFoundError) {
        throw error;
      }
      throw error;
    }
  }
}

