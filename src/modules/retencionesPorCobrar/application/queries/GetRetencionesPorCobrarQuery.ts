import { IRetencionesPorCobrarRepository } from '../../domain/repositories/IRetencionesPorCobrarRepository.js';
import { RetencionPorCobrar } from '../../domain/entities/RetencionPorCobrar.js';
import pino from 'pino';

const logger = pino({
  name: 'GetRetencionesPorCobrarQuery',
  level: process.env.LOG_LEVEL || 'info'
});

export interface GetRetencionesPorCobrarResult {
  validado: boolean;
  registros: RetencionPorCobrar[];
}

export class GetRetencionesPorCobrarQuery {
  constructor(private retencionesPorCobrarRepo: IRetencionesPorCobrarRepository) {}

  async execute(org0: string, org1: string, periodo: string, userId?: string): Promise<GetRetencionesPorCobrarResult> {
    logger.info({
      operation: 'GET_RETENCIONES_POR_COBRAR',
      userId: userId || 'SYSTEM',
      org0,
      org1,
      periodo,
      timestamp: new Date().toISOString()
    }, 'RETENCIONES_QUERY');

    try {
      // Validar parámetros
      if (!org0 || !org1 || !periodo) {
        throw new Error('org0, org1 y periodo son requeridos');
      }

      const registros = await this.retencionesPorCobrarRepo.getRetencionesPorCobrar(org0, org1, periodo);

      // Validar que sean exactamente 3 registros
      if (registros.length !== 3) {
        logger.warn({
          operation: 'GET_RETENCIONES_POR_COBRAR',
          userId: userId || 'SYSTEM',
          org0,
          org1,
          periodo,
          recordCount: registros.length,
          expectedCount: 3,
          timestamp: new Date().toISOString()
        }, 'VALIDATION_FAILED_WRONG_COUNT');

        return {
          validado: false,
          registros
        };
      }

      // Validar que haya un registro con cada tipo: PPV, PMP, PCP
      const tipos = registros.map(r => r.tipo.toUpperCase().trim());
      const tienePPV = tipos.includes('PPV');
      const tienePMP = tipos.includes('PMP');
      const tienePCP = tipos.includes('PCP');

      const validado = tienePPV && tienePMP && tienePCP;

      if (!validado) {
        logger.warn({
          operation: 'GET_RETENCIONES_POR_COBRAR',
          userId: userId || 'SYSTEM',
          org0,
          org1,
          periodo,
          tipos,
          tienePPV,
          tienePMP,
          tienePCP,
          timestamp: new Date().toISOString()
        }, 'VALIDATION_FAILED_WRONG_TYPES');
      } else {
        logger.info({
          operation: 'GET_RETENCIONES_POR_COBRAR',
          userId: userId || 'SYSTEM',
          org0,
          org1,
          periodo,
          recordCount: registros.length,
          validado: true,
          timestamp: new Date().toISOString()
        }, 'RETENCIONES_QUERY_SUCCESS');
      }

      return {
        validado,
        registros
      };

    } catch (error) {
      logger.error({
        operation: 'GET_RETENCIONES_POR_COBRAR',
        userId: userId || 'SYSTEM',
        org0,
        org1,
        periodo,
        error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
        timestamp: new Date().toISOString()
      }, 'RETENCIONES_QUERY_ERROR');
      throw error;
    }
  }
}

