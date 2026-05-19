import { ICAIRRepository } from '../../domain/repositories/ICAIRRepository.js';
import { EstadoCuentaCAIR } from '../../domain/entities/EstadoCuentaCAIR.js';
import pino from 'pino';

const logger = pino({
  name: 'GetEstadoCuentaCAIRQuery',
  level: process.env.LOG_LEVEL || 'info'
});

export class GetEstadoCuentaCAIRQuery {
  constructor(private cairRepo: ICAIRRepository) {}

  async execute(quincena: string, userId?: string): Promise<EstadoCuentaCAIR[]> {
    logger.info({
      operation: 'GET_ESTADO_CUENTA_CAIR',
      userId: userId || 'SYSTEM',
      quincena,
      timestamp: new Date().toISOString()
    }, 'CAIR_QUERY');

    try {
      // Validar parámetros
      if (!quincena) {
        throw new Error('Quincena es requerida');
      }

      const estados = await this.cairRepo.getEstadoCuentaCAIR(quincena);

      logger.info({
        operation: 'GET_ESTADO_CUENTA_CAIR',
        userId: userId || 'SYSTEM',
        recordCount: estados.length,
        quincena,
        timestamp: new Date().toISOString()
      }, 'CAIR_QUERY_SUCCESS');

      return estados;

    } catch (error) {
      logger.error({
        operation: 'GET_ESTADO_CUENTA_CAIR',
        userId: userId || 'SYSTEM',
        quincena,
        error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
        timestamp: new Date().toISOString()
      }, 'CAIR_QUERY_ERROR');
      throw error;
    }
  }
}

