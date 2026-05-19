import { IAfiliadosReportesRepository } from '../../domain/repositories/IAfiliadosReportesRepository.js';
import { HistorialMovPromedioSdo } from '../../domain/entities/HistorialMovPromedioSdo.js';
import pino from 'pino';

const logger = pino({
  name: 'GetHistorialMovPromedioSdoQuery',
  level: process.env.LOG_LEVEL || 'info'
});

export class GetHistorialMovPromedioSdoQuery {
  constructor(private afiliadosReportesRepo: IAfiliadosReportesRepository) {}

  async execute(periodo: string, pOrg0: string, pOrg1: string, pOrg2: string, pOrg3: string, userId?: string): Promise<HistorialMovPromedioSdo[]> {
    logger.info({
      operation: 'GET_HISTORIAL_MOV_PROMEDIO_SDO',
      userId: userId || 'SYSTEM',
      periodo,
      pOrg0,
      pOrg1,
      pOrg2,
      pOrg3,
      timestamp: new Date().toISOString()
    }, 'AFILIADOS_REPORTES_QUERY');

    try {
      // Validar parámetros
      if (!periodo || !pOrg0 || !pOrg1 || !pOrg2 || !pOrg3) {
        throw new Error('Periodo, pOrg0, pOrg1, pOrg2 y pOrg3 son requeridos');
      }

      const promedios = await this.afiliadosReportesRepo.getHistorialMovPromedioSdo(periodo, pOrg0, pOrg1, pOrg2, pOrg3);

      logger.info({
        operation: 'GET_HISTORIAL_MOV_PROMEDIO_SDO',
        userId: userId || 'SYSTEM',
        recordCount: promedios.length,
        periodo,
        pOrg0,
        pOrg1,
        pOrg2,
        pOrg3,
        timestamp: new Date().toISOString()
      }, 'AFILIADOS_REPORTES_QUERY_SUCCESS');

      return promedios;

    } catch (error) {
      logger.error({
        operation: 'GET_HISTORIAL_MOV_PROMEDIO_SDO',
        userId: userId || 'SYSTEM',
        periodo,
        pOrg0,
        pOrg1,
        pOrg2,
        pOrg3,
        error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
        timestamp: new Date().toISOString()
      }, 'AFILIADOS_REPORTES_QUERY_ERROR');
      throw error;
    }
  }
}

