import { IDependenciaRepository } from '../../domain/repositories/IDependenciaRepository.js';
import { DependenciaNotFoundError } from '../../domain/errors.js';
import { sql } from '../../../../../db/context.js';
import pino from 'pino';

const logger = pino({
  name: 'deleteDependenciaCommand',
  level: process.env.LOG_LEVEL || 'info'
});

export interface DeleteDependenciaInput {
  dependenciaId: number;
}

export class DeleteDependenciaCommand {
  constructor(private dependenciaRepo: IDependenciaRepository) {}

  async execute(input: DeleteDependenciaInput, tx?: sql.Transaction): Promise<number> {
    const logContext = {
      operation: 'deleteDependencia',
      dependenciaId: input.dependenciaId
    };

    logger.info(logContext, 'Iniciando eliminación de dependencia');

    // Validación de entrada
    if (!input.dependenciaId || typeof input.dependenciaId !== 'number' || input.dependenciaId <= 0) {
      throw new DependenciaNotFoundError(input.dependenciaId);
    }

    // Verificar que la dependencia existe
    const existingDependencia = await this.dependenciaRepo.findById(input.dependenciaId);
    if (!existingDependencia) {
      throw new DependenciaNotFoundError(input.dependenciaId);
    }

    try {
      const deletedId = await this.dependenciaRepo.delete(input.dependenciaId, tx);
      if (!deletedId) {
        throw new DependenciaNotFoundError(input.dependenciaId);
      }
      logger.info({ ...logContext, deletedId }, 'Dependencia eliminada exitosamente');
      return deletedId;
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      logger.error({
        ...logContext,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      }, 'Error al eliminar dependencia');

      if (error instanceof DependenciaNotFoundError) {
        throw error;
      }
      throw error;
    }
  }
}

