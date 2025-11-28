import { IAplicacionesQNARepository } from '../../domain/repositories/IAplicacionesQNARepository.js';
import { MovimientoQuincenal } from '../../domain/entities/MovimientoQuincenal.js';
import pino from 'pino';

const logger = pino({
  name: 'GetMovimientosQuincenalesQuery',
  level: process.env.LOG_LEVEL || 'info'
});

export class GetMovimientosQuincenalesQuery {
  constructor(private aplicacionesQNARepo: IAplicacionesQNARepository) {}

  async execute(periodo: string, pOrg0: string, pOrg1: string, userId?: string): Promise<MovimientoQuincenal[]> {
    logger.info({
      operation: 'GET_MOVIMIENTOS_QUINCENALES',
      userId: userId || 'SYSTEM',
      periodo,
      pOrg0,
      pOrg1,
      timestamp: new Date().toISOString()
    }, 'APLICACIONES_QNA_QUERY');

    try {
      // Validar parámetros
      if (!periodo || !pOrg0 || !pOrg1) {
        throw new Error('Periodo, pOrg0 y pOrg1 son requeridos');
      }

      const movimientos = await this.aplicacionesQNARepo.getMovimientosQuincenales(periodo, pOrg0, pOrg1);

      logger.info({
        operation: 'GET_MOVIMIENTOS_QUINCENALES',
        userId: userId || 'SYSTEM',
        recordCount: movimientos.length,
        periodo,
        pOrg0,
        pOrg1,
        timestamp: new Date().toISOString()
      }, 'APLICACIONES_QNA_QUERY_SUCCESS');

      return movimientos;

    } catch (error) {
      logger.error({
        operation: 'GET_MOVIMIENTOS_QUINCENALES',
        userId: userId || 'SYSTEM',
        periodo,
        pOrg0,
        pOrg1,
        error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
        timestamp: new Date().toISOString()
      }, 'APLICACIONES_QNA_QUERY_ERROR');
      throw error;
    }
  }
}

