import { IExpedienteRepository } from '../../domain/repositories/IExpedienteRepository.js';
import { Expediente } from '../../domain/entities/Expediente.js';
import { ExpedienteQueryError } from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'getAllExpedientesQuery',
  level: process.env.LOG_LEVEL || 'info'
});

export class GetAllExpedientesQuery {
  constructor(private expedienteRepo: IExpedienteRepository) {}

  async execute(): Promise<Expediente[]> {
    const logContext = {
      operation: 'getAllExpedientes'
    };

    logger.info(logContext, 'Consultando todos los expedientes');

    try {
      const expedientes = await this.expedienteRepo.findAll();

      logger.info({
        ...logContext,
        count: expedientes.length
      }, 'Expedientes consultados exitosamente');

      return expedientes;

    } catch (error: any) {
      logger.error({
        ...logContext,
        error: error.message,
        stack: error.stack
      }, 'Error al consultar todos los expedientes');

      throw new ExpedienteQueryError('consulta general', {
        originalError: error.message
      });
    }
  }
}
