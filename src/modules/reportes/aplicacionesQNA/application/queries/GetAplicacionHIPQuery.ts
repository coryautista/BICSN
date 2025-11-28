import { IAplicacionesQNARepository } from '../../domain/repositories/IAplicacionesQNARepository.js';
import { AplicacionHIP } from '../../domain/entities/AplicacionHIP.js';
import pino from 'pino';

const logger = pino({
  name: 'GetAplicacionHIPQuery',
  level: process.env.LOG_LEVEL || 'info'
});

export class GetAplicacionHIPQuery {
  constructor(private aplicacionesQNARepo: IAplicacionesQNARepository) {}

  async execute(org0: string, org1: string, quincena: string, userId?: string): Promise<AplicacionHIP[]> {
    logger.info({
      operation: 'GET_APLICACION_HIP',
      userId: userId || 'SYSTEM',
      org0,
      org1,
      quincena,
      timestamp: new Date().toISOString()
    }, 'APLICACIONES_QNA_QUERY');

    try {
      // Validar parámetros
      if (!org0 || !org1 || !quincena) {
        throw new Error('org0, org1 y quincena son requeridos');
      }

      const prestamos = await this.aplicacionesQNARepo.getAplicacionHIP(org0, org1, quincena);

      logger.info({
        operation: 'GET_APLICACION_HIP',
        userId: userId || 'SYSTEM',
        recordCount: prestamos.length,
        org0,
        org1,
        quincena,
        timestamp: new Date().toISOString()
      }, 'APLICACIONES_QNA_QUERY_SUCCESS');

      return prestamos;

    } catch (error) {
      logger.error({
        operation: 'GET_APLICACION_HIP',
        userId: userId || 'SYSTEM',
        org0,
        org1,
        quincena,
        error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
        timestamp: new Date().toISOString()
      }, 'APLICACIONES_QNA_QUERY_ERROR');
      throw error;
    }
  }
}

