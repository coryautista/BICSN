import { IExpedienteArchivoRepository } from '../../domain/repositories/IExpedienteRepository.js';
import { ExpedienteArchivo } from '../../domain/entities/Expediente.js';
import {
  InvalidExpedienteDataError,
  InvalidCURPError,
  ExpedienteArchivoQueryError
} from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'getExpedienteArchivosByCurpQuery',
  level: process.env.LOG_LEVEL || 'info'
});

export class GetExpedienteArchivosByCurpQuery {
  constructor(private expedienteArchivoRepo: IExpedienteArchivoRepository) {}

  async execute(curp: string): Promise<ExpedienteArchivo[]> {
    // Validaciones de entrada
    this.validateInput(curp);

    const logContext = {
      operation: 'getExpedienteArchivosByCurp',
      curp: curp
    };

    logger.info(logContext, 'Consultando archivos de expediente por CURP');

    try {
      const archivos = await this.expedienteArchivoRepo.findByCurp(curp);

      logger.info({
        ...logContext,
        count: archivos.length
      }, 'Archivos de expediente consultados exitosamente');

      return archivos;

    } catch (error: any) {
      logger.error({
        ...logContext,
        error: error.message,
        stack: error.stack
      }, 'Error al consultar archivos de expediente por CURP');

      throw new ExpedienteArchivoQueryError('consulta por CURP', {
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
