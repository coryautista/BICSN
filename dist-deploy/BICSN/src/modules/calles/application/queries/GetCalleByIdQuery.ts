import { ICalleRepository } from '../../domain/repositories/ICalleRepository.js';
import { CalleDetailed } from '../../domain/entities/Calle.js';
import {
  CalleNotFoundError,
  InvalidCalleDataError,
  CalleQueryError
} from '../../domain/errors.js';

// Logger básico para queries
const logger = {
  info: (message: string, data?: any) => console.log(`[INFO] ${message}`, data ? JSON.stringify(data) : ''),
  warn: (message: string, data?: any) => console.warn(`[WARN] ${message}`, data ? JSON.stringify(data) : ''),
  error: (message: string, data?: any) => console.error(`[ERROR] ${message}`, data ? JSON.stringify(data) : ''),
  debug: (message: string, data?: any) => console.debug(`[DEBUG] ${message}`, data ? JSON.stringify(data) : '')
};

export class GetCalleByIdQuery {
  constructor(private calleRepo: ICalleRepository) {}

  async execute(calleId: number): Promise<CalleDetailed> {
    try {
      logger.debug('Ejecutando consulta de calle por ID', { calleId });

      // Validar calleId
      if (!calleId || typeof calleId !== 'number' || calleId <= 0) {
        throw new InvalidCalleDataError('ID de calle inválido para consulta');
      }

      const calle = await this.calleRepo.findById(calleId);

      if (!calle) {
        logger.warn('Calle no encontrada por ID', { calleId });
        throw new CalleNotFoundError(calleId);
      }

      logger.debug('Calle encontrada exitosamente', {
        calleId: calle.calleId,
        nombreCalle: calle.nombreCalle,
        coloniaId: calle.coloniaId
      });

      return calle;

    } catch (error) {
      if (error instanceof CalleNotFoundError || error instanceof InvalidCalleDataError) {
        throw error;
      }

      logger.error('Error en consulta de calle por ID', {
        error: error instanceof Error ? error.message : 'Error desconocido',
        calleId,
        stack: error instanceof Error ? error.stack : undefined
      });

      throw new CalleQueryError('findById', 'Error interno en consulta de calle');
    }
  }
}
