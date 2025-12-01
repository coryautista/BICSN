import { IEjeRepository } from '../../domain/repositories/IEjeRepository.js';
import { EjeNotFoundError } from '../../domain/errors.js';
import { sql } from '../../../../../db/context.js';
import pino from 'pino';

const logger = pino({
  name: 'deleteEjeCommand',
  level: process.env.LOG_LEVEL || 'info'
});

export interface DeleteEjeInput {
  ejeId: number;
}

export class DeleteEjeCommand {
  constructor(private ejeRepo: IEjeRepository) {}

  async execute(input: DeleteEjeInput, tx?: sql.Transaction): Promise<number> {
    const logContext = {
      operation: 'deleteEje',
      ejeId: input.ejeId
    };

    logger.info(logContext, 'Iniciando eliminación de eje');

    // Validación de entrada
    if (!input.ejeId || typeof input.ejeId !== 'number' || input.ejeId <= 0) {
      throw new EjeNotFoundError(input.ejeId);
    }

    // Verificar que el eje existe
    const existingEje = await this.ejeRepo.findById(input.ejeId);
    if (!existingEje) {
      throw new EjeNotFoundError(input.ejeId);
    }

    try {
      const deletedId = await this.ejeRepo.delete(input.ejeId, tx);
      if (!deletedId) {
        throw new EjeNotFoundError(input.ejeId);
      }
      logger.info({ ...logContext, deletedId }, 'Eje eliminado exitosamente');
      return deletedId;
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      logger.error({
        ...logContext,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      }, 'Error al eliminar eje');

      if (error instanceof EjeNotFoundError) {
        throw error;
      }
      throw error;
    }
  }
}

