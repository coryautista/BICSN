import { IAplicacionesQNARepository } from '../../domain/repositories/IAplicacionesQNARepository.js';
import { AplicacionAportaciones } from '../../domain/entities/AplicacionAportaciones.js';
import pino from 'pino';

const logger = pino({
  name: 'GetAplicacionAportacionesQuery',
  level: process.env.LOG_LEVEL || 'info'
});

export class GetAplicacionAportacionesQuery {
  constructor(private aplicacionesQNARepo: IAplicacionesQNARepository) {}

  async execute(pOrg0: string, pOrg1: string, periodo: string, userId?: string): Promise<AplicacionAportaciones[]> {
    logger.info({
      operation: 'GET_APLICACION_APORTACIONES',
      userId: userId || 'SYSTEM',
      pOrg0,
      pOrg1,
      periodo,
      timestamp: new Date().toISOString()
    }, 'APLICACIONES_QNA_QUERY');

    try {
      // Validar parámetros
      if (!pOrg0 || !pOrg1 || !periodo) {
        throw new Error('pOrg0, pOrg1 y periodo son requeridos');
      }

      const aportaciones = await this.aplicacionesQNARepo.getAplicacionAportaciones(pOrg0, pOrg1, periodo);

      logger.info({
        operation: 'GET_APLICACION_APORTACIONES',
        userId: userId || 'SYSTEM',
        recordCount: aportaciones.length,
        pOrg0,
        pOrg1,
        periodo,
        timestamp: new Date().toISOString()
      }, 'APLICACIONES_QNA_QUERY_SUCCESS');

      return aportaciones;

    } catch (error) {
      logger.error({
        operation: 'GET_APLICACION_APORTACIONES',
        userId: userId || 'SYSTEM',
        pOrg0,
        pOrg1,
        periodo,
        error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
        timestamp: new Date().toISOString()
      }, 'APLICACIONES_QNA_QUERY_ERROR');
      throw error;
    }
  }
}

