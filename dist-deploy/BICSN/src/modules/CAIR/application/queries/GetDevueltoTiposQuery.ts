import { ICAIRRepository } from '../../domain/repositories/ICAIRRepository.js';
import { DevueltoTipo } from '../../domain/entities/DevueltoTipo.js';
import pino from 'pino';

const logger = pino({
  name: 'GetDevueltoTiposQuery',
  level: process.env.LOG_LEVEL || 'info'
});

export class GetDevueltoTiposQuery {
  constructor(private cairIndependentRepo: ICAIRRepository) {}

  async execute(userId?: string): Promise<DevueltoTipo[]> {
    logger.info({
      operation: 'GET_DEVUELTO_TIPOS',
      userId: userId || 'SYSTEM',
      timestamp: new Date().toISOString()
    }, 'CAIR_QUERY');

    try {
      const tipos = await this.cairIndependentRepo.getDevueltoTipos();

      logger.info({
        operation: 'GET_DEVUELTO_TIPOS',
        userId: userId || 'SYSTEM',
        recordCount: tipos.length,
        timestamp: new Date().toISOString()
      }, 'CAIR_QUERY_SUCCESS');

      return tipos;

    } catch (error) {
      logger.error({
        operation: 'GET_DEVUELTO_TIPOS',
        userId: userId || 'SYSTEM',
        error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
        timestamp: new Date().toISOString()
      }, 'CAIR_QUERY_ERROR');
      throw error;
    }
  }
}

