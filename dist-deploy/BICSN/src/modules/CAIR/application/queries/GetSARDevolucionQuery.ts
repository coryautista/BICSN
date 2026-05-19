import { ICAIRRepository } from '../../domain/repositories/ICAIRRepository.js';
import { SARDevolucion } from '../../domain/entities/SARDevolucion.js';
import pino from 'pino';

const logger = pino({
  name: 'GetSARDevolucionQuery',
  level: process.env.LOG_LEVEL || 'info'
});

export class GetSARDevolucionQuery {
  constructor(private cairIndependentRepo: ICAIRRepository) {}

  async execute(interno: string, tipo: string, userId?: string): Promise<SARDevolucion[]> {
    logger.info({
      operation: 'GET_SAR_DEVOLUCION',
      userId: userId || 'SYSTEM',
      interno,
      tipo,
      timestamp: new Date().toISOString()
    }, 'CAIR_QUERY');

    try {
      // Validar parámetros
      if (!interno || !tipo) {
        throw new Error('interno y tipo son requeridos');
      }

      const devoluciones = await this.cairIndependentRepo.getSARDevolucion(interno, tipo);

      logger.info({
        operation: 'GET_SAR_DEVOLUCION',
        userId: userId || 'SYSTEM',
        recordCount: devoluciones.length,
        interno,
        tipo,
        timestamp: new Date().toISOString()
      }, 'CAIR_QUERY_SUCCESS');

      return devoluciones;

    } catch (error) {
      logger.error({
        operation: 'GET_SAR_DEVOLUCION',
        userId: userId || 'SYSTEM',
        interno,
        tipo,
        error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
        timestamp: new Date().toISOString()
      }, 'CAIR_QUERY_ERROR');
      throw error;
    }
  }
}

