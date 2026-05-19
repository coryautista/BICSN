import { ICAIRRepository } from '../../domain/repositories/ICAIRRepository.js';
import { ChequeLeyenda } from '../../domain/entities/ChequeLeyenda.js';
import pino from 'pino';

const logger = pino({
  name: 'GetChequesLeyendasQuery',
  level: process.env.LOG_LEVEL || 'info'
});

export class GetChequesLeyendasQuery {
  constructor(private cairIndependentRepo: ICAIRRepository) {}

  async execute(userId?: string): Promise<ChequeLeyenda[]> {
    logger.info({
      operation: 'GET_CHEQUES_LEYENDAS',
      userId: userId || 'SYSTEM',
      timestamp: new Date().toISOString()
    }, 'CAIR_QUERY');

    try {
      const leyendas = await this.cairIndependentRepo.getChequesLeyendas();

      logger.info({
        operation: 'GET_CHEQUES_LEYENDAS',
        userId: userId || 'SYSTEM',
        recordCount: leyendas.length,
        timestamp: new Date().toISOString()
      }, 'CAIR_QUERY_SUCCESS');

      return leyendas;

    } catch (error) {
      logger.error({
        operation: 'GET_CHEQUES_LEYENDAS',
        userId: userId || 'SYSTEM',
        error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
        timestamp: new Date().toISOString()
      }, 'CAIR_QUERY_ERROR');
      throw error;
    }
  }
}

