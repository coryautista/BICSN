import { ICAIRRepository } from '../../domain/repositories/ICAIRRepository.js';
import { CAIREntregado } from '../../domain/entities/CAIREntregado.js';
import pino from 'pino';

const logger = pino({
  name: 'GetCAIREntregadoQuery',
  level: process.env.LOG_LEVEL || 'info'
});

export class GetCAIREntregadoQuery {
  constructor(private cairRepo: ICAIRRepository) {}

  async execute(fi: string, ff: string, tipo: string, userId?: string): Promise<CAIREntregado[]> {
    logger.info({
      operation: 'GET_CAIR_ENTREGADO',
      userId: userId || 'SYSTEM',
      fi,
      ff,
      tipo,
      timestamp: new Date().toISOString()
    }, 'CAIR_QUERY');

    try {
      // Validar parámetros
      if (!fi || !ff || !tipo) {
        throw new Error('fi, ff y tipo son requeridos');
      }

      const entregados = await this.cairRepo.getCAIREntregado(fi, ff, tipo);

      logger.info({
        operation: 'GET_CAIR_ENTREGADO',
        userId: userId || 'SYSTEM',
        recordCount: entregados.length,
        fi,
        ff,
        tipo,
        timestamp: new Date().toISOString()
      }, 'CAIR_QUERY_SUCCESS');

      return entregados;

    } catch (error) {
      logger.error({
        operation: 'GET_CAIR_ENTREGADO',
        userId: userId || 'SYSTEM',
        fi,
        ff,
        tipo,
        error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
        timestamp: new Date().toISOString()
      }, 'CAIR_QUERY_ERROR');
      throw error;
    }
  }
}

