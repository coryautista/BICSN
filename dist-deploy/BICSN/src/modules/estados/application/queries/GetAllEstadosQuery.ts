import { IEstadoRepository } from '../../domain/repositories/IEstadoRepository.js';
import { Estado } from '../../domain/entities/Estado.js';
import {
  EstadosNotFoundError,
  EstadoQueryError
} from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'getAllEstadosQuery',
  level: process.env.LOG_LEVEL || 'info'
});

export class GetAllEstadosQuery {
  constructor(private estadoRepo: IEstadoRepository) {}

  async execute(): Promise<Estado[]> {
    const logContext = {
      operation: 'getAllEstados'
    };

    logger.info(logContext, 'Consultando todos los estados');

    try {
      const result = await this.estadoRepo.findAll();

      if (!result || result.length === 0) {
        logger.warn({ ...logContext }, 'No se encontraron estados en el sistema');
        throw new EstadosNotFoundError();
      }

      logger.info({
        ...logContext,
        estadosCount: result.length,
        estadosIds: result.map(e => e.estadoId)
      }, 'Consulta de todos los estados completada exitosamente');

      return result;

    } catch (error: any) {
      if (error instanceof EstadosNotFoundError) {
        throw error;
      }

      logger.error({
        ...logContext,
        error: error.message,
        stack: error.stack
      }, 'Error al consultar todos los estados');

      throw new EstadoQueryError('consulta de todos los estados', {
        originalError: error.message
      });
    }
  }
}
