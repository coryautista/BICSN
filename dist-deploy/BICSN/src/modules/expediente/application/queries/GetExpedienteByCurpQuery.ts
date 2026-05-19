import { IExpedienteRepository } from '../../domain/repositories/IExpedienteRepository.js';
import { Expediente } from '../../domain/entities/Expediente.js';
import {
  ExpedienteNotFoundError,
  InvalidExpedienteDataError,
  InvalidCURPError,
  ExpedienteQueryError
} from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'getExpedienteByCurpQuery',
  level: process.env.LOG_LEVEL || 'info'
});

export class GetExpedienteByCurpQuery {
  constructor(private expedienteRepo: IExpedienteRepository) {}

  async execute(curp: string): Promise<Expediente> {
    // Validaciones de entrada
    this.validateInput(curp);

    const logContext = {
      operation: 'getExpedienteByCurp',
      curp: curp
    };

    logger.info(logContext, 'Consultando expediente por CURP');

    try {
      const expediente = await this.expedienteRepo.findByCurp(curp);

      if (!expediente) {
        logger.warn(logContext, 'Expediente no encontrado');
        throw new ExpedienteNotFoundError(curp);
      }

      logger.info({
        ...logContext,
        found: true,
        estado: expediente.estado,
        afiliadoId: expediente.afiliadoId,
        interno: expediente.interno
      }, 'Expediente encontrado exitosamente');

      return expediente;

    } catch (error: any) {
      if (error instanceof ExpedienteNotFoundError ||
          error instanceof InvalidExpedienteDataError ||
          error instanceof InvalidCURPError) {
        throw error;
      }

      logger.error({
        ...logContext,
        error: error.message,
        stack: error.stack
      }, 'Error al consultar expediente por CURP');

      throw new ExpedienteQueryError('consulta por CURP', {
        originalError: error.message,
        curp: curp
      });
    }
  }

  private validateInput(curp: string): void {
    // Validar CURP
    if (!curp || typeof curp !== 'string') {
      throw new InvalidExpedienteDataError('curp', 'Es requerida y debe ser una cadena de texto');
    }

    // Validar formato de CURP (18 caracteres alfanuméricos)
    const curpRegex = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/;
    if (!curpRegex.test(curp)) {
      throw new InvalidCURPError(curp);
    }
  }
}
