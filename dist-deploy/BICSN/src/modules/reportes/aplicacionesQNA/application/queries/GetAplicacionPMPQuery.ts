import { IAplicacionesQNARepository } from '../../domain/repositories/IAplicacionesQNARepository.js';
import { AplicacionPMP } from '../../domain/entities/AplicacionPMP.js';
import pino from 'pino';

const logger = pino({
  name: 'GetAplicacionPMPQuery',
  level: process.env.LOG_LEVEL || 'info'
});

export class GetAplicacionPMPQuery {
  constructor(private aplicacionesQNARepo: IAplicacionesQNARepository) {}

  async execute(pOrg0: string, pOrg1: string, pPeriodo: string, userId?: string): Promise<AplicacionPMP[]> {
    logger.info({
      operation: 'GET_APLICACION_PMP',
      userId: userId || 'SYSTEM',
      pOrg0,
      pOrg1,
      pPeriodo,
      timestamp: new Date().toISOString()
    }, 'APLICACIONES_QNA_QUERY');

    try {
      // Validar parámetros
      if (!pOrg0 || !pOrg1 || !pPeriodo) {
        throw new Error('pOrg0, pOrg1 y pPeriodo son requeridos');
      }

      const prestamos = await this.aplicacionesQNARepo.getAplicacionPMP(pOrg0, pOrg1, pPeriodo);

      logger.info({
        operation: 'GET_APLICACION_PMP',
        userId: userId || 'SYSTEM',
        recordCount: prestamos.length,
        pOrg0,
        pOrg1,
        pPeriodo,
        timestamp: new Date().toISOString()
      }, 'APLICACIONES_QNA_QUERY_SUCCESS');

      return prestamos;

    } catch (error) {
      logger.error({
        operation: 'GET_APLICACION_PMP',
        userId: userId || 'SYSTEM',
        pOrg0,
        pOrg1,
        pPeriodo,
        error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
        timestamp: new Date().toISOString()
      }, 'APLICACIONES_QNA_QUERY_ERROR');
      throw error;
    }
  }
}

