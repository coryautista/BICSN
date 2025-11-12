import { IInfoRepository } from '../../domain/repositories/IInfoRepository.js';
import { Info } from '../../domain/entities/Info.js';
import { InfoRepositoryError } from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'getAllInfosQuery',
  level: process.env.LOG_LEVEL || 'info'
});

export class GetAllInfosQuery {
  constructor(private infoRepo: IInfoRepository) {}

  async execute(_userId?: string): Promise<Info[]> {
    try {
      logger.info({
        operation: 'getAllInfos',
        userId: _userId,
        timestamp: new Date().toISOString()
      }, 'Consultando todas las informaciones');

      const infos = await this.infoRepo.findAll();

      logger.info({
        operation: 'getAllInfos',
        count: infos.length,
        userId: _userId,
        timestamp: new Date().toISOString()
      }, 'Consulta de informaciones completada exitosamente');

      return infos;
    } catch (error) {
      logger.error({
        operation: 'getAllInfos',
        error: (error as Error).message,
        userId: _userId,
        stack: (error as Error).stack,
        timestamp: new Date().toISOString()
      }, 'Error al consultar informaciones');

      throw new InfoRepositoryError('findAll', error as Error);
    }
  }
}
