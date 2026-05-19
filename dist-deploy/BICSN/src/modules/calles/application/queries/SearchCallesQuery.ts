import { ICalleRepository } from '../../domain/repositories/ICalleRepository.js';
import { Calle, SearchCallesFilters } from '../../domain/entities/Calle.js';
import {
  InvalidSearchFiltersError,
  CalleSearchError
} from '../../domain/errors.js';

// Logger básico para queries
const logger = {
  info: (message: string, data?: any) => console.log(`[INFO] ${message}`, data ? JSON.stringify(data) : ''),
  warn: (message: string, data?: any) => console.warn(`[WARN] ${message}`, data ? JSON.stringify(data) : ''),
  error: (message: string, data?: any) => console.error(`[ERROR] ${message}`, data ? JSON.stringify(data) : ''),
  debug: (message: string, data?: any) => console.debug(`[DEBUG] ${message}`, data ? JSON.stringify(data) : '')
};

export class SearchCallesQuery {
  constructor(private calleRepo: ICalleRepository) {}

  async execute(filters: SearchCallesFilters): Promise<Calle[]> {
    try {
      logger.debug('Ejecutando búsqueda de calles con filtros', filters);

      // Validar filtros
      const validationErrors: string[] = [];
      const validatedFilters: SearchCallesFilters = { ...filters };

      // Validar estadoId
      if (filters.estadoId !== undefined) {
        if (typeof filters.estadoId !== 'string' || filters.estadoId.length !== 2) {
          validationErrors.push('estadoId debe ser una cadena de 2 caracteres');
        } else {
          validatedFilters.estadoId = filters.estadoId;
        }
      }

      // Validar municipioId
      if (filters.municipioId !== undefined) {
        const municipioIdStr = filters.municipioId.toString();
        if (!/^[0-9]+$/.test(municipioIdStr)) {
          validationErrors.push('municipioId debe ser un número válido');
        } else {
          validatedFilters.municipioId = parseInt(municipioIdStr);
        }
      }

      // Validar coloniaId
      if (filters.coloniaId !== undefined) {
        const coloniaIdStr = filters.coloniaId.toString();
        if (!/^[0-9]+$/.test(coloniaIdStr)) {
          validationErrors.push('coloniaId debe ser un número válido');
        } else {
          validatedFilters.coloniaId = parseInt(coloniaIdStr);
        }
      }

      // Validar codigoPostal
      if (filters.codigoPostal !== undefined) {
        if (typeof filters.codigoPostal !== 'string' || filters.codigoPostal.length !== 5 || !/^[0-9]{5}$/.test(filters.codigoPostal)) {
          validationErrors.push('codigoPostal debe ser una cadena de 5 dígitos');
        } else {
          validatedFilters.codigoPostal = filters.codigoPostal;
        }
      }

      // Validar nombreCalle
      if (filters.nombreCalle !== undefined) {
        if (typeof filters.nombreCalle !== 'string' || filters.nombreCalle.trim().length === 0) {
          validationErrors.push('nombreCalle debe ser una cadena no vacía');
        } else {
          validatedFilters.nombreCalle = filters.nombreCalle.trim();
        }
      }

      // Validar esValido
      if (filters.esValido !== undefined) {
        if (typeof filters.esValido !== 'string' || !['true', 'false'].includes(filters.esValido)) {
          validationErrors.push('esValido debe ser "true" o "false"');
        } else {
          validatedFilters.esValido = filters.esValido === 'true';
        }
      }

      // Validar paginación
      const maxLimit = 1000; // Límite máximo configurable
      if (filters.limit !== undefined) {
        const limitStr = filters.limit.toString();
        if (!/^[0-9]+$/.test(limitStr)) {
          validationErrors.push('limit debe ser un número válido');
        } else {
          const limit = parseInt(limitStr);
          if (limit > maxLimit) {
            validationErrors.push(`limit no puede exceder ${maxLimit}`);
          } else {
            validatedFilters.limit = limit;
          }
        }
      }

      if (filters.offset !== undefined) {
        const offsetStr = filters.offset.toString();
        if (!/^[0-9]+$/.test(offsetStr)) {
          validationErrors.push('offset debe ser un número válido');
        } else {
          validatedFilters.offset = parseInt(offsetStr);
        }
      }

      // Si hay errores de validación, lanzarlos
      if (validationErrors.length > 0) {
        logger.warn('Filtros de búsqueda inválidos', {
          filters,
          validationErrors
        });
        throw new InvalidSearchFiltersError(validationErrors);
      }

      // Ejecutar búsqueda
      logger.debug('Ejecutando búsqueda con filtros validados', validatedFilters);
      const calles = await this.calleRepo.search(validatedFilters);

      logger.info('Búsqueda de calles completada exitosamente', {
        filters: validatedFilters,
        totalResults: calles.length
      });

      return calles;

    } catch (error) {
      if (error instanceof InvalidSearchFiltersError) {
        throw error;
      }

      logger.error('Error en búsqueda de calles', {
        error: error instanceof Error ? error.message : 'Error desconocido',
        filters,
        stack: error instanceof Error ? error.stack : undefined
      });

      throw new CalleSearchError(filters, 'Error interno en búsqueda de calles');
    }
  }
}
