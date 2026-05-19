import { IColoniaRepository } from '../../domain/repositories/IColoniaRepository.js';
import { Colonia, SearchColoniasFilters } from '../../domain/entities/Colonia.js';
import {
  InvalidColoniaDataError,
  SearchColoniasError,
  ColoniaQueryError
} from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'searchColoniasQuery',
  level: process.env.LOG_LEVEL || 'info'
});

export class SearchColoniasQuery {
  constructor(private coloniaRepo: IColoniaRepository) {}

  async execute(filters: SearchColoniasFilters): Promise<Colonia[]> {
    // Validaciones de entrada
    this.validateInput(filters);

    const logContext = {
      operation: 'searchColonias',
      filters: filters
    };

    logger.info(logContext, 'Buscando colonias con filtros');

    try {
      const result = await this.coloniaRepo.search(filters);

      logger.info({
        ...logContext,
        resultsCount: result.length,
        coloniasIds: result.map(c => c.coloniaId)
      }, 'Búsqueda de colonias completada exitosamente');

      return result;

    } catch (error: any) {
      if (error instanceof InvalidColoniaDataError ||
          error instanceof SearchColoniasError) {
        throw error;
      }

      logger.error({
        ...logContext,
        error: error.message,
        stack: error.stack
      }, 'Error al buscar colonias');

      throw new ColoniaQueryError('búsqueda', {
        originalError: error.message,
        filters: filters
      });
    }
  }

  private validateInput(filters: SearchColoniasFilters): void {
    // Validar nombreColonia
    if (!filters.nombreColonia || typeof filters.nombreColonia !== 'string') {
      throw new InvalidColoniaDataError('nombreColonia', 'Es requerido y debe ser una cadena de texto');
    }

    if (filters.nombreColonia.trim().length === 0) {
      throw new InvalidColoniaDataError('nombreColonia', 'No puede estar vacío');
    }

    if (filters.nombreColonia.length > 100) {
      throw new InvalidColoniaDataError('nombreColonia', 'No puede exceder 100 caracteres');
    }
  }
}
