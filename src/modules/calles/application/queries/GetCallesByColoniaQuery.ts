import { ICalleRepository } from '../../domain/repositories/ICalleRepository.js';
import { Calle } from '../../domain/entities/Calle.js';
import {
  InvalidColoniaIdError,
  CalleQueryError
} from '../../domain/errors.js';

// Logger básico para queries
const logger = {
  info: (message: string, data?: any) => console.log(`[INFO] ${message}`, data ? JSON.stringify(data) : ''),
  warn: (message: string, data?: any) => console.warn(`[WARN] ${message}`, data ? JSON.stringify(data) : ''),
  error: (message: string, data?: any) => console.error(`[ERROR] ${message}`, data ? JSON.stringify(data) : ''),
  debug: (message: string, data?: any) => console.debug(`[DEBUG] ${message}`, data ? JSON.stringify(data) : '')
};

export class GetCallesByColoniaQuery {
  constructor(private calleRepo: ICalleRepository) {}

  async execute(coloniaId: number): Promise<Calle[]> {
    try {
      logger.debug('Ejecutando consulta de calles por colonia', { coloniaId });

      // Validar coloniaId
      if (!coloniaId || typeof coloniaId !== 'number' || coloniaId <= 0) {
        throw new InvalidColoniaIdError(coloniaId);
      }

      const calles = await this.calleRepo.findByColonia(coloniaId);

      logger.debug('Consulta de calles por colonia completada', {
        coloniaId,
        totalCalles: calles.length
      });

      return calles;

    } catch (error) {
      if (error instanceof InvalidColoniaIdError) {
        throw error;
      }

      logger.error('Error en consulta de calles por colonia', {
        error: error instanceof Error ? error.message : 'Error desconocido',
        coloniaId,
        stack: error instanceof Error ? error.stack : undefined
      });

      throw new CalleQueryError('findByColonia', 'Error interno en consulta de calles por colonia');
    }
  }
}
