import { IInfoRepository } from '../../domain/repositories/IInfoRepository.js';
import {
  InfoNotFoundError,
  InvalidInfoIdError,
  InfoRepositoryError
} from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'deleteInfoCommand',
  level: process.env.LOG_LEVEL || 'info'
});

export interface DeleteInfoInput {
  id: number;
}

export class DeleteInfoCommand {
  constructor(private infoRepo: IInfoRepository) {}

  async execute(input: DeleteInfoInput, _userId?: string): Promise<boolean> {
    try {
      logger.info({
        operation: 'deleteInfo',
        infoId: input.id,
        userId: _userId,
        timestamp: new Date().toISOString()
      }, 'Iniciando eliminación de información');

      // Validar ID
      if (!input.id || typeof input.id !== 'number' || input.id <= 0) {
        throw new InvalidInfoIdError(input.id);
      }

      // Verificar que el info existe
      const existing = await this.infoRepo.findById(input.id);
      if (!existing) {
        logger.warn({
          operation: 'deleteInfo',
          infoId: input.id,
          userId: _userId,
          timestamp: new Date().toISOString()
        }, 'Intento de eliminar información inexistente');
        throw new InfoNotFoundError(input.id);
      }

      const deleted = await this.infoRepo.delete(input.id);
      if (!deleted) {
        logger.error({
          operation: 'deleteInfo',
          infoId: input.id,
          userId: _userId,
          timestamp: new Date().toISOString()
        }, 'La eliminación no afectó ningún registro');
        throw new InfoRepositoryError('delete', new Error('No rows affected'));
      }

      logger.info({
        operation: 'deleteInfo',
        infoId: input.id,
        nombre: existing.nombre,
        userId: _userId,
        timestamp: new Date().toISOString()
      }, 'Información eliminada exitosamente');

      return deleted;
    } catch (error) {
      if (error instanceof InfoNotFoundError || error instanceof InvalidInfoIdError) {
        throw error;
      }

      logger.error({
        operation: 'deleteInfo',
        error: (error as Error).message,
        infoId: input.id,
        userId: _userId,
        stack: (error as Error).stack,
        timestamp: new Date().toISOString()
      }, 'Error al eliminar información');

      throw new InfoRepositoryError('delete', error as Error);
    }
  }
}
