import { IProgramaRepository } from '../../domain/repositories/IProgramaRepository.js';
import { ProgramaNotFoundError } from '../../domain/errors.js';
import { sql } from '../../../../../db/context.js';
import pino from 'pino';

const logger = pino({
  name: 'deleteProgramaCommand',
  level: process.env.LOG_LEVEL || 'info'
});

export interface DeleteProgramaInput {
  programaId: number;
}

export class DeleteProgramaCommand {
  constructor(private programaRepo: IProgramaRepository) {}

  async execute(input: DeleteProgramaInput, tx?: sql.Transaction): Promise<number> {
    const logContext = {
      operation: 'deletePrograma',
      programaId: input.programaId
    };

    logger.info(logContext, 'Iniciando eliminación de programa');

    // Validación de entrada
    if (!input.programaId || typeof input.programaId !== 'number' || input.programaId <= 0) {
      throw new ProgramaNotFoundError(input.programaId);
    }

    // Verificar que el programa existe
    const existingPrograma = await this.programaRepo.findById(input.programaId);
    if (!existingPrograma) {
      throw new ProgramaNotFoundError(input.programaId);
    }

    try {
      const deletedId = await this.programaRepo.delete(input.programaId, tx);
      if (!deletedId) {
        throw new ProgramaNotFoundError(input.programaId);
      }
      logger.info({ ...logContext, deletedId }, 'Programa eliminado exitosamente');
      return deletedId;
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      logger.error({
        ...logContext,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      }, 'Error al eliminar programa');

      if (error instanceof ProgramaNotFoundError) {
        throw error;
      }
      throw error;
    }
  }
}

