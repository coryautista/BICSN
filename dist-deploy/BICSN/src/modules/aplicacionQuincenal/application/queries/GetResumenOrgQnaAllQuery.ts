import { IAplicacionQuincenalRepository } from '../../domain/repositories/IAplicacionQuincenalRepository.js';
import { ResumenOrgQnaAll } from '../../domain/entities/ResumenOrgQnaAll.js';
import pino from 'pino';

const logger = pino({
  name: 'GetResumenOrgQnaAllQuery',
  level: process.env.LOG_LEVEL || 'info'
});

export class GetResumenOrgQnaAllQuery {
  constructor(private aplicacionQuincenalRepo: IAplicacionQuincenalRepository) {}

  async execute(org0: string, org1: string, periodo: string, userId?: string): Promise<ResumenOrgQnaAll[]> {
    logger.info({
      operation: 'GET_RESUMEN_ORG_QNA_ALL',
      userId: userId || 'SYSTEM',
      org0,
      org1,
      periodo,
      timestamp: new Date().toISOString()
    }, 'RESUMEN_ORG_QNA_ALL_QUERY');

    try {
      // Validar parámetros
      if (!org0 || !org1 || !periodo) {
        throw new Error('org0, org1 y periodo son requeridos');
      }

      const registros = await this.aplicacionQuincenalRepo.getResumenOrgQnaAll(org0, org1, periodo);

      logger.info({
        operation: 'GET_RESUMEN_ORG_QNA_ALL',
        userId: userId || 'SYSTEM',
        org0,
        org1,
        periodo,
        recordCount: registros.length,
        timestamp: new Date().toISOString()
      }, 'RESUMEN_ORG_QNA_ALL_QUERY_SUCCESS');

      return registros;

    } catch (error) {
      logger.error({
        operation: 'GET_RESUMEN_ORG_QNA_ALL',
        userId: userId || 'SYSTEM',
        org0,
        org1,
        periodo,
        error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
        timestamp: new Date().toISOString()
      }, 'RESUMEN_ORG_QNA_ALL_QUERY_ERROR');
      throw error;
    }
  }
}


