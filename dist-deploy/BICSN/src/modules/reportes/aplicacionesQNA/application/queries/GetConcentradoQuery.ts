import { IAplicacionesQNARepository } from '../../domain/repositories/IAplicacionesQNARepository.js';
import { Concentrado } from '../../domain/entities/Concentrado.js';
import pino from 'pino';

const logger = pino({
  name: 'GetConcentradoQuery',
  level: process.env.LOG_LEVEL || 'info'
});

export class GetConcentradoQuery {
  constructor(private aplicacionesQNARepo: IAplicacionesQNARepository) {}

  async execute(org0: string, org1: string, org2: string, org3: string, periodo: string, userId?: string): Promise<Concentrado[]> {
    logger.info({
      operation: 'GET_CONCENTRADO',
      userId: userId || 'SYSTEM',
      org0,
      org1,
      org2,
      org3,
      periodo,
      timestamp: new Date().toISOString()
    }, 'APLICACIONES_QNA_QUERY');

    try {
      // Validar parámetros
      if (!org0 || !org1 || !org2 || !org3 || !periodo) {
        throw new Error('org0, org1, org2, org3 y periodo son requeridos');
      }

      const concentrados = await this.aplicacionesQNARepo.getConcentrado(org0, org1, org2, org3, periodo);

      logger.info({
        operation: 'GET_CONCENTRADO',
        userId: userId || 'SYSTEM',
        recordCount: concentrados.length,
        org0,
        org1,
        org2,
        org3,
        periodo,
        timestamp: new Date().toISOString()
      }, 'APLICACIONES_QNA_QUERY_SUCCESS');

      return concentrados;

    } catch (error) {
      logger.error({
        operation: 'GET_CONCENTRADO',
        userId: userId || 'SYSTEM',
        org0,
        org1,
        org2,
        org3,
        periodo,
        error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
        timestamp: new Date().toISOString()
      }, 'APLICACIONES_QNA_QUERY_ERROR');
      throw error;
    }
  }
}

