import { ILineaEstrategicaRepository } from '../../domain/repositories/ILineaEstrategicaRepository.js';
import { LineaEstrategicaNotFoundError } from '../../domain/errors.js';
import { sql } from '../../../../../db/context.js';
import pino from 'pino';

const logger = pino({
  name: 'deleteLineaEstrategicaCommand',
  level: process.env.LOG_LEVEL || 'info'
});

export interface DeleteLineaEstrategicaInput {
  lineaEstrategicaId: number;
}

export class DeleteLineaEstrategicaCommand {
  constructor(private lineaEstrategicaRepo: ILineaEstrategicaRepository) {}

  async execute(input: DeleteLineaEstrategicaInput, tx?: sql.Transaction): Promise<number> {
    const logContext = {
      operation: 'deleteLineaEstrategica',
      lineaEstrategicaId: input.lineaEstrategicaId
    };

    logger.info(logContext, 'Iniciando eliminación de línea estratégica');

    // Validación de entrada
    if (!input.lineaEstrategicaId || typeof input.lineaEstrategicaId !== 'number' || input.lineaEstrategicaId <= 0) {
      throw new LineaEstrategicaNotFoundError(input.lineaEstrategicaId);
    }

    // Verificar que la línea estratégica existe
    const existingLineaEstrategica = await this.lineaEstrategicaRepo.findById(input.lineaEstrategicaId);
    if (!existingLineaEstrategica) {
      throw new LineaEstrategicaNotFoundError(input.lineaEstrategicaId);
    }

    try {
      const deletedId = await this.lineaEstrategicaRepo.delete(input.lineaEstrategicaId, tx);
      if (!deletedId) {
        throw new LineaEstrategicaNotFoundError(input.lineaEstrategicaId);
      }
      logger.info({ ...logContext, deletedId }, 'Línea estratégica eliminada exitosamente');
      return deletedId;
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      logger.error({
        ...logContext,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      }, 'Error al eliminar línea estratégica');

      if (error instanceof LineaEstrategicaNotFoundError) {
        throw error;
      }
      throw error;
    }
  }
}

