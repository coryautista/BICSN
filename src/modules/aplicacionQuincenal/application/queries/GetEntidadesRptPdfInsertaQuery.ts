import { IAplicacionQuincenalRepository } from '../../domain/repositories/IAplicacionQuincenalRepository.js';
import pino from 'pino';

const logger = pino({
  name: 'GetEntidadesRptPdfInsertaQuery',
  level: process.env.LOG_LEVEL || 'info'
});

export class GetEntidadesRptPdfInsertaQuery {
  constructor(private aplicacionQuincenalRepo: IAplicacionQuincenalRepository) {}

  async execute(organica0: string, organica1: string, periodo: string, userId?: string): Promise<Record<string, unknown>[]> {
    logger.info({
      operation: 'GET_ENTIDADES_RPT_PDF_INSERTA',
      userId: userId || 'SYSTEM',
      organica0,
      organica1,
      periodo,
      timestamp: new Date().toISOString()
    }, 'ENTIDADES_RPT_PDF_INSERTA_QUERY');

    if (!organica0 || !organica1 || !periodo) {
      throw new Error('organica0, organica1 y periodo son requeridos');
    }

    const registros = await this.aplicacionQuincenalRepo.getEntidadesRptPdfInserta(organica0, organica1, periodo);

    logger.info({
      operation: 'GET_ENTIDADES_RPT_PDF_INSERTA',
      userId: userId || 'SYSTEM',
      organica0,
      organica1,
      periodo,
      recordCount: registros.length,
      timestamp: new Date().toISOString()
    }, 'ENTIDADES_RPT_PDF_INSERTA_QUERY_SUCCESS');

    return registros;
  }
}
