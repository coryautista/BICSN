import { IRetencionesPorCobrarRepository } from '../../domain/repositories/IRetencionesPorCobrarRepository.js';
import { RetencionPorCobrar } from '../../domain/entities/RetencionPorCobrar.js';
import { RetencionesPorCobrarError, RetencionesPorCobrarErrorCode } from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'CreateRetencionesMoratorioCommand',
  level: process.env.LOG_LEVEL || 'info'
});

export interface CreateRetencionesMoratorioCommandParams {
  org0: string;
  org1: string;
  org2: string;
  org3: string;
  periodo: string;
  userAlta: string;
}

export class CreateRetencionesMoratorioCommand {
  constructor(private retencionesPorCobrarRepo: IRetencionesPorCobrarRepository) {}

  async execute(params: CreateRetencionesMoratorioCommandParams): Promise<RetencionPorCobrar[]> {
    logger.info({
      operation: 'CREATE_RETENCIONES_MORATORIO',
      userId: params.userAlta,
      org0: params.org0,
      org1: params.org1,
      org2: params.org2,
      org3: params.org3,
      periodo: params.periodo,
      timestamp: new Date().toISOString()
    }, 'RETENCIONES_CREATE_COMMAND');

    try {
      // Validar parámetros
      if (!params.org0 || !params.org1 || !params.org2 || !params.org3 || !params.periodo || !params.userAlta) {
        throw new Error('Todos los parámetros son requeridos: org0, org1, org2, org3, periodo, userAlta');
      }

      const registros = await this.retencionesPorCobrarRepo.createRetencionesMoratorio(
        params.org0,
        params.org1,
        params.org2,
        params.org3,
        params.periodo,
        params.userAlta
      );

      logger.info({
        operation: 'CREATE_RETENCIONES_MORATORIO',
        userId: params.userAlta,
        org0: params.org0,
        org1: params.org1,
        org2: params.org2,
        org3: params.org3,
        periodo: params.periodo,
        recordCount: registros.length,
        timestamp: new Date().toISOString()
      }, 'RETENCIONES_CREATE_COMMAND_SUCCESS');

      return registros;
    } catch (error) {
      logger.error({
        operation: 'CREATE_RETENCIONES_MORATORIO',
        userId: params.userAlta,
        org0: params.org0,
        org1: params.org1,
        org2: params.org2,
        org3: params.org3,
        periodo: params.periodo,
        error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
        timestamp: new Date().toISOString()
      }, 'RETENCIONES_CREATE_COMMAND_ERROR');
      throw error;
    }
  }
}

