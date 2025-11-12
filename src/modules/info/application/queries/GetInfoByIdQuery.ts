import { IInfoRepository } from '../../domain/repositories/IInfoRepository.js';
import { Info } from '../../domain/entities/Info.js';
import {
  InfoNotFoundError,
  InvalidInfoIdError,
  InfoRepositoryError
} from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'getInfoByIdQuery',
  level: process.env.LOG_LEVEL || 'info'
});

export interface GetInfoByIdInput {
  id: number;
}

export class GetInfoByIdQuery {
  constructor(private infoRepo: IInfoRepository) {}

  async execute(input: GetInfoByIdInput, _userId?: string): Promise<Info> {
    try {
      logger.info({
        operation: 'getInfoById',
        infoId: input.id,
        userId: _userId,
        timestamp: new Date().toISOString()
      }, 'Consultando información por ID');

      // Validar ID
      if (!input.id || typeof input.id !== 'number' || input.id <= 0) {
        throw new InvalidInfoIdError(input.id);
      }

      const info = await this.infoRepo.findById(input.id);
      if (!info) {
        logger.warn({
          operation: 'getInfoById',
          infoId: input.id,
          userId: _userId,
          timestamp: new Date().toISOString()
        }, 'Información no encontrada por ID');
        throw new InfoNotFoundError(input.id);
      }

      logger.info({
        operation: 'getInfoById',
        infoId: info.id,
        nombre: info.nombre,
        userId: _userId,
        timestamp: new Date().toISOString()
      }, 'Información encontrada exitosamente');

      return info;
    } catch (error) {
      if (error instanceof InfoNotFoundError || error instanceof InvalidInfoIdError) {
        throw error;
      }

      logger.error({
        operation: 'getInfoById',
        error: (error as Error).message,
        infoId: input.id,
        userId: _userId,
        stack: (error as Error).stack,
        timestamp: new Date().toISOString()
      }, 'Error al consultar información por ID');

      throw new InfoRepositoryError('findById', error as Error);
    }
  }
}
