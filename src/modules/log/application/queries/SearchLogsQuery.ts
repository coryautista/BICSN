import { ILogRepository } from '../../domain/repositories/ILogRepository.js';
import { LogSearchResult } from '../../domain/entities/Log.js';
import { LogSearchError, LogFileSystemError } from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'searchLogsQuery',
  level: process.env.LOG_LEVEL || 'info'
});

export interface SearchLogsInput {
  searchTerm: string;
  maxResults: number;
}

export class SearchLogsQuery {
  constructor(private logRepo: ILogRepository) {}

  async execute(input: SearchLogsInput, _userId?: string): Promise<LogSearchResult[]> {
    try {
      logger.info({
        operation: 'searchLogs',
        searchTerm: input.searchTerm,
        maxResults: input.maxResults,
        userId: _userId,
        timestamp: new Date().toISOString()
      }, 'Iniciando búsqueda en logs');

      // Validaciones de entrada
      this.validateInput(input);

      const results = await this.logRepo.search(input.searchTerm, input.maxResults);

      logger.info({
        operation: 'searchLogs',
        searchTerm: input.searchTerm,
        maxResults: input.maxResults,
        resultCount: results.length,
        userId: _userId,
        timestamp: new Date().toISOString()
      }, 'Búsqueda en logs completada exitosamente');

      return results;
    } catch (error) {
      // Manejar errores específicos del sistema de archivos
      if ((error as Error).message?.includes('ENOENT') || (error as Error).message?.includes('ENOTDIR')) {
        logger.error({
          operation: 'searchLogs',
          error: (error as Error).message,
          searchTerm: input.searchTerm,
          userId: _userId,
          timestamp: new Date().toISOString()
        }, 'Error del sistema de archivos durante búsqueda en logs');
        throw new LogFileSystemError('search', 'logs directory', error as Error);
      }

      logger.error({
        operation: 'searchLogs',
        error: (error as Error).message,
        searchTerm: input.searchTerm,
        maxResults: input.maxResults,
        userId: _userId,
        stack: (error as Error).stack,
        timestamp: new Date().toISOString()
      }, 'Error al buscar en logs');

      throw new LogSearchError(input.searchTerm, error as Error);
    }
  }

  private validateInput(input: SearchLogsInput): void {
    // Validar searchTerm
    if (!input.searchTerm || typeof input.searchTerm !== 'string' || input.searchTerm.trim().length === 0) {
      throw new Error('LOG_INVALID_SEARCH_TERM: El término de búsqueda es requerido y no puede estar vacío');
    }

    const searchTerm = input.searchTerm.trim();

    // Validar longitud del término de búsqueda
    if (searchTerm.length < 2) {
      throw new Error('LOG_INVALID_SEARCH_TERM: El término de búsqueda debe tener al menos 2 caracteres');
    }

    if (searchTerm.length > 100) {
      throw new Error('LOG_INVALID_SEARCH_TERM: El término de búsqueda no puede tener más de 100 caracteres');
    }

    // Validar caracteres peligrosos
    const dangerousChars = /[<>:"|?*\x00-\x1f]/;
    if (dangerousChars.test(searchTerm)) {
      throw new Error('LOG_INVALID_SEARCH_TERM: El término de búsqueda contiene caracteres no válidos');
    }

    // Validar maxResults
    if (!Number.isInteger(input.maxResults) || input.maxResults <= 0) {
      throw new Error(`LOG_INVALID_MAX_RESULTS: El número máximo de resultados debe ser un entero positivo: ${input.maxResults}`);
    }

    if (input.maxResults > 1000) {
      throw new Error(`LOG_INVALID_MAX_RESULTS: El número máximo de resultados no puede ser mayor a 1000: ${input.maxResults}`);
    }
  }
}
