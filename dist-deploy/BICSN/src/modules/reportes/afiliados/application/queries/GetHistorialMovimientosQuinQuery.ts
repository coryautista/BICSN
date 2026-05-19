import { IAfiliadosReportesRepository } from '../../domain/repositories/IAfiliadosReportesRepository.js';
import { HistorialMovimientosQuin } from '../../domain/entities/HistorialMovimientosQuin.js';
import pino from 'pino';

const logger = pino({
  name: 'GetHistorialMovimientosQuinQuery',
  level: process.env.LOG_LEVEL || 'info'
});

export class GetHistorialMovimientosQuinQuery {
  constructor(private afiliadosReportesRepo: IAfiliadosReportesRepository) {}

  async execute(periodo: string, userId?: string): Promise<HistorialMovimientosQuin[]> {
    logger.info({
      operation: 'GET_HISTORIAL_MOVIMIENTOS_QUIN',
      userId: userId || 'SYSTEM',
      periodo,
      timestamp: new Date().toISOString()
    }, 'AFILIADOS_REPORTES_QUERY');

    try {
      // Validar parámetros
      if (!periodo) {
        throw new Error('Periodo es requerido');
      }

      const historiales = await this.afiliadosReportesRepo.getHistorialMovimientosQuin(periodo);

      logger.info({
        operation: 'GET_HISTORIAL_MOVIMIENTOS_QUIN',
        userId: userId || 'SYSTEM',
        recordCount: historiales.length,
        periodo,
        timestamp: new Date().toISOString()
      }, 'AFILIADOS_REPORTES_QUERY_SUCCESS');

      return historiales;

    } catch (error) {
      logger.error({
        operation: 'GET_HISTORIAL_MOVIMIENTOS_QUIN',
        userId: userId || 'SYSTEM',
        periodo,
        error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
        timestamp: new Date().toISOString()
      }, 'AFILIADOS_REPORTES_QUERY_ERROR');
      throw error;
    }
  }
}

