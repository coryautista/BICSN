import { IAplicacionQuincenalRepository } from '../../domain/repositories/IAplicacionQuincenalRepository.js';
import { AportacionQuincenalResumen } from '../../domain/entities/AportacionQuincenalResumen.js';
import pino from 'pino';

const logger = pino({
  name: 'GetAportacionQuincenalResumenQuery',
  level: process.env.LOG_LEVEL || 'info'
});

export class GetAportacionQuincenalResumenQuery {
  constructor(private aplicacionQuincenalRepo: IAplicacionQuincenalRepository) {}

  async execute(org0: string, org1: string, periodo: string, userId?: string): Promise<AportacionQuincenalResumen[]> {
    logger.info({
      operation: 'GET_APORTACION_QUINCENAL_RESUMEN',
      userId: userId || 'SYSTEM',
      org0,
      org1,
      periodo,
      timestamp: new Date().toISOString()
    }, 'APLICACION_QUINCENAL_QUERY');

    try {
      // Validar parámetros
      if (!org0 || !org1 || !periodo) {
        throw new Error('org0, org1 y periodo son requeridos');
      }

      const registros = await this.aplicacionQuincenalRepo.getAportacionQuincenalResumen(org0, org1, periodo);

      logger.info({
        operation: 'GET_APORTACION_QUINCENAL_RESUMEN',
        userId: userId || 'SYSTEM',
        org0,
        org1,
        periodo,
        recordCount: registros.length,
        timestamp: new Date().toISOString()
      }, 'APLICACION_QUINCENAL_QUERY_SUCCESS');

      return registros;

    } catch (error) {
      logger.error({
        operation: 'GET_APORTACION_QUINCENAL_RESUMEN',
        userId: userId || 'SYSTEM',
        org0,
        org1,
        periodo,
        error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
        timestamp: new Date().toISOString()
      }, 'APLICACION_QUINCENAL_QUERY_ERROR');
      throw error;
    }
  }
}

