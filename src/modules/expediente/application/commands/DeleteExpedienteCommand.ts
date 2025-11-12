import { IExpedienteRepository } from '../../domain/repositories/IExpedienteRepository.js';
import {
  ExpedienteNotFoundError,
  InvalidExpedienteDataError,
  InvalidCURPError,
  ExpedienteCommandError
} from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'deleteExpedienteCommand',
  level: process.env.LOG_LEVEL || 'info'
});

export class DeleteExpedienteCommand {
  constructor(private expedienteRepo: IExpedienteRepository) {}

  async execute(curp: string): Promise<void> {
    // Validaciones de entrada
    this.validateInput(curp);

    const logContext = {
      operation: 'deleteExpediente',
      curp: curp
    };

    logger.info(logContext, 'Eliminando expediente');

    try {
      await this.expedienteRepo.delete(curp);

      logger.info({
        ...logContext,
        deleted: true
      }, 'Expediente eliminado exitosamente');

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
      }, 'Error al eliminar expediente');

      throw new ExpedienteCommandError('eliminación', {
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
